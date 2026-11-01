-- Warehouse-owned additions for measured commercial units and handover audit.
-- Apply after P01_schema.sql and P02_schema.sql.
BEGIN;
ALTER TABLE wh_documents ADD COLUMN handover_by VARCHAR(254);
ALTER TABLE wh_documents ADD COLUMN handed_over_at TIMESTAMPTZ;
CREATE TABLE wh_unit_conversions (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    product_key VARCHAR(255) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    kg_per_unit NUMERIC(14,6) NOT NULL CHECK(kg_per_unit > 0),
    updated_by VARCHAR(254) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_unit_conversion UNIQUE(product_key,unit)
);
COMMIT;
