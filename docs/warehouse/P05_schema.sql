-- Warehouse-owned quality inspection log. Apply after earlier Warehouse scripts.
BEGIN;
CREATE TABLE wh_quality_inspections (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    balance_id UUID NOT NULL REFERENCES wh_stock_balances(id),
    held BOOLEAN NOT NULL,
    note VARCHAR(500) NOT NULL,
    actor VARCHAR(254) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
