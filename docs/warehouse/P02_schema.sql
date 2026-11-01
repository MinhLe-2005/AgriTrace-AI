-- P02 Warehouse-owned receipt and inventory schema, for review.
-- Apply after P01_schema.sql. Farmer tables are referenced through a read-only adapter.
-- No table belonging to Farmer, Order, Auth or Distributor is created or modified.
BEGIN;

CREATE TABLE wh_documents (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    target_warehouse_id UUID REFERENCES warehouses(id),
    type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    reservation_id UUID,
    note VARCHAR(500),
    handover_reference VARCHAR(150),
    created_by VARCHAR(254) NOT NULL,
    confirmed_by VARCHAR(254),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMPTZ
);

CREATE TABLE wh_document_lines (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES wh_documents(id),
    lot_id VARCHAR(255) NOT NULL,
    location_id UUID NOT NULL REFERENCES storage_locations(id),
    target_location_id UUID REFERENCES storage_locations(id),
    quantity_kg NUMERIC(14,3) NOT NULL CHECK (quantity_kg >= 0),
    expected_kg NUMERIC(14,3),
    expected_version BIGINT
);

CREATE TABLE wh_stock_balances (
    id UUID PRIMARY KEY,
    version BIGINT NOT NULL DEFAULT 0,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID NOT NULL REFERENCES storage_locations(id),
    lot_id VARCHAR(255) NOT NULL,
    product_id VARCHAR(255) NOT NULL,
    lot_code VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_kg NUMERIC(14,3) NOT NULL DEFAULT 0 CHECK (quantity_kg >= 0),
    held BOOLEAN NOT NULL DEFAULT FALSE,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_balance_location_lot UNIQUE(location_id, lot_id)
);

CREATE TABLE wh_stock_movements (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID NOT NULL REFERENCES storage_locations(id),
    lot_id VARCHAR(255) NOT NULL,
    document_id UUID NOT NULL REFERENCES wh_documents(id),
    type VARCHAR(20) NOT NULL,
    delta_kg NUMERIC(14,3) NOT NULL,
    balance_after_kg NUMERIC(14,3) NOT NULL CHECK (balance_after_kg >= 0),
    actor VARCHAR(254) NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_wh_movement_scope_time ON wh_stock_movements(warehouse_id,occurred_at);

-- Reservation storage is included as the foundation for availability in P04.
CREATE TABLE wh_reservations (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    order_id BIGINT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(254) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
CREATE TABLE wh_reservation_lines (
    reservation_id UUID NOT NULL REFERENCES wh_reservations(id),
    balance_id UUID NOT NULL REFERENCES wh_stock_balances(id),
    quantity_kg NUMERIC(14,3) NOT NULL CHECK (quantity_kg > 0)
);
ALTER TABLE wh_documents ADD CONSTRAINT fk_wh_document_reservation
    FOREIGN KEY(reservation_id) REFERENCES wh_reservations(id);
COMMIT;
