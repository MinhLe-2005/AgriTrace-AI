-- Apply after P12. Reconcile Warehouse tables previously created by Hibernate.
-- Add missing protections without recreating tables, rewriting rows or changing RLS.
BEGIN;
DO $$
DECLARE
    item RECORD;
    existing_name TEXT;
BEGIN
    FOR item IN
        SELECT * FROM (VALUES
            ('wh_documents', 'warehouse_id', 'warehouses', 'fk_wh_documents_warehouse'),
            ('wh_documents', 'target_warehouse_id', 'warehouses', 'fk_wh_documents_target'),
            ('wh_documents', 'reservation_id', 'wh_reservations', 'fk_wh_document_reservation'),
            ('wh_document_lines', 'location_id', 'storage_locations', 'fk_wh_document_lines_location'),
            ('wh_document_lines', 'target_location_id', 'storage_locations', 'fk_wh_document_lines_target'),
            ('wh_stock_balances', 'warehouse_id', 'warehouses', 'fk_wh_balances_warehouse'),
            ('wh_stock_balances', 'location_id', 'storage_locations', 'fk_wh_balances_location'),
            ('wh_stock_movements', 'warehouse_id', 'warehouses', 'fk_wh_movements_warehouse'),
            ('wh_stock_movements', 'location_id', 'storage_locations', 'fk_wh_movements_location'),
            ('wh_stock_movements', 'document_id', 'wh_documents', 'fk_wh_movements_document'),
            ('wh_reservations', 'warehouse_id', 'warehouses', 'fk_wh_reservations_warehouse'),
            ('wh_reservation_lines', 'balance_id', 'wh_stock_balances', 'fk_wh_reservation_lines_balance'),
            ('wh_unit_conversions', 'warehouse_id', 'warehouses', 'fk_wh_unit_conversions_warehouse')
        ) AS required(table_name, column_name, referenced_table, constraint_name)
    LOOP
        -- Match by relationship, not generated constraint names, to avoid duplicate FKs.
        SELECT c.conname INTO existing_name
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attname = item.column_name
        JOIN pg_attribute r ON r.attrelid = c.confrelid AND r.attname = 'id'
        WHERE c.contype = 'f'
          AND c.conrelid = format('public.%I', item.table_name)::regclass
          AND c.confrelid = format('public.%I', item.referenced_table)::regclass
          AND c.conkey = ARRAY[a.attnum] AND c.confkey = ARRAY[r.attnum]
        LIMIT 1;
        IF existing_name IS NULL THEN
            existing_name := item.constraint_name;
            EXECUTE format(
                'ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.%I(id) NOT VALID',
                item.table_name, existing_name, item.column_name, item.referenced_table);
        END IF;
        -- Fail atomically on orphaned legacy rows; never delete or silently repair them.
        EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', item.table_name, existing_name);
    END LOOP;

    FOR item IN
        SELECT * FROM (VALUES
            ('warehouses', 'ck_warehouses_capacity', 'capacity_tons > 0'),
            ('warehouses', 'ck_warehouses_conditions',
                'temp_target_c BETWEEN -999.9 AND 999.9 AND humidity_target BETWEEN 0 AND 100'),
            ('wh_stock_movements', 'wh_stock_movements_balance_after_kg_check', 'balance_after_kg >= 0'),
            ('wh_reservation_lines', 'wh_reservation_lines_quantity_kg_check', 'quantity_kg > 0')
        ) AS required(table_name, constraint_name, expression)
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conrelid = format('public.%I', item.table_name)::regclass
              AND conname = item.constraint_name
        ) THEN
            EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I CHECK (%s) NOT VALID',
                item.table_name, item.constraint_name, item.expression);
        END IF;
        EXECUTE format('ALTER TABLE public.%I VALIDATE CONSTRAINT %I', item.table_name, item.constraint_name);
    END LOOP;
END $$;
COMMIT;
