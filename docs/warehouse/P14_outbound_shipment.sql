-- Optional link installed by Warehouse even when Distributor is provisioned later.
BEGIN;
ALTER TABLE wh_documents ADD COLUMN IF NOT EXISTS handover_shipment_id bigint;
DO $$ BEGIN
    IF to_regclass('agri_shipments') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM pg_constraint
                       WHERE conrelid = 'wh_documents'::regclass AND contype = 'f'
                         AND confrelid = to_regclass('agri_shipments')
                         AND pg_get_constraintdef(oid) LIKE 'FOREIGN KEY (handover_shipment_id)%') THEN
        ALTER TABLE wh_documents ADD CONSTRAINT fk_wh_handover_shipment
            FOREIGN KEY (handover_shipment_id) REFERENCES agri_shipments(id);
    END IF;
END $$;
COMMIT;
