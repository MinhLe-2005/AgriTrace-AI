-- Apply after P10. Partial receipts remain IN_TRANSIT until all dispatched goods arrive.
BEGIN;
ALTER TABLE wh_documents ADD COLUMN IF NOT EXISTS in_transit BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE wh_documents ADD COLUMN IF NOT EXISTS received_by VARCHAR(254);
ALTER TABLE wh_documents ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;
ALTER TABLE wh_documents ADD COLUMN IF NOT EXISTS receiving_note VARCHAR(500);
ALTER TABLE wh_document_lines ADD COLUMN IF NOT EXISTS received_quantity_kg NUMERIC(14,3) NOT NULL DEFAULT 0;
UPDATE wh_documents SET in_transit=FALSE WHERE in_transit IS NULL;
UPDATE wh_document_lines SET received_quantity_kg=0 WHERE received_quantity_kg IS NULL;
ALTER TABLE wh_documents ALTER COLUMN in_transit SET DEFAULT FALSE;
ALTER TABLE wh_documents ALTER COLUMN in_transit SET NOT NULL;
ALTER TABLE wh_document_lines ALTER COLUMN received_quantity_kg SET DEFAULT 0;
ALTER TABLE wh_document_lines ALTER COLUMN received_quantity_kg SET NOT NULL;
UPDATE wh_documents SET in_transit = TRUE WHERE status = 'IN_TRANSIT';
UPDATE wh_document_lines l SET received_quantity_kg=l.quantity_kg
FROM wh_documents d WHERE d.id=l.document_id AND d.type='TRANSFER'
AND d.status IN ('CONFIRMED','HANDED_OVER','RECEIVED') AND l.received_quantity_kg=0;
ALTER TABLE wh_document_lines DROP CONSTRAINT IF EXISTS ck_wh_transfer_received;
ALTER TABLE wh_document_lines ADD CONSTRAINT ck_wh_transfer_received
    CHECK(received_quantity_kg >= 0 AND received_quantity_kg <= quantity_kg);
CREATE INDEX IF NOT EXISTS ix_wh_document_source_time ON wh_documents(warehouse_id,created_at DESC,id DESC);
CREATE INDEX IF NOT EXISTS ix_wh_document_target_time ON wh_documents(target_warehouse_id,created_at DESC,id DESC) WHERE type='TRANSFER';
COMMIT;
