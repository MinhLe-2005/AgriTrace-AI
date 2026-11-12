-- Fresh Warehouse schema only; the project's core users table must already exist.
-- Run with psql -f Install-Warehouse.sql. Existing Warehouse schemas use Upgrade-Warehouse.sql.
\set ON_ERROR_STOP on
DO $$ BEGIN
    IF to_regclass('warehouses') IS NOT NULL THEN
        RAISE EXCEPTION 'Warehouse schema already exists. Use Upgrade-Warehouse.sql instead.';
    END IF;
    IF to_regclass('users') IS NULL THEN
        RAISE EXCEPTION 'Install the core users schema before Warehouse.';
    END IF;
END $$;
\ir P01_schema.sql
\ir P02_schema.sql
\ir P04_schema.sql
\ir P05_schema.sql
\ir P06_schema.sql
\ir P08_monitoring_schema.sql
\ir P09_heatmap_schema.sql
\ir P10_partial_reservations.sql
\ir P11_transfer_receiving.sql
\ir P12_inventory_indexes.sql
