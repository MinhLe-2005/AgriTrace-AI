-- P01: additive Warehouse schema for team review; not a live database backup.
-- Run once after review, where the shared users table already exists.
BEGIN;
-- Compatible with warehouses already provisioned by supabase_schema.sql.
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    capacity_tons NUMERIC(10,2) NOT NULL,
    temp_target_c NUMERIC(4,1) DEFAULT 4.0,
    humidity_target NUMERIC(4,1) DEFAULT 85.0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE warehouses ADD CONSTRAINT ck_warehouses_capacity CHECK (capacity_tons > 0);
ALTER TABLE warehouses ADD CONSTRAINT ck_warehouses_conditions
    CHECK (temp_target_c BETWEEN -999.9 AND 999.9 AND humidity_target BETWEEN 0 AND 100);

CREATE TABLE storage_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    capacity_tons NUMERIC(10,2) NOT NULL,
    temp_target_c NUMERIC(4,1) NOT NULL,
    humidity_target NUMERIC(4,1) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_storage_locations_warehouse_code UNIQUE (warehouse_id, code),
    CONSTRAINT ck_storage_locations_capacity CHECK (capacity_tons > 0),
    CONSTRAINT ck_storage_locations_code CHECK (code = upper(trim(code)) AND length(trim(code)) > 0),
    CONSTRAINT ck_storage_locations_conditions
        CHECK (temp_target_c BETWEEN -999.9 AND 999.9 AND humidity_target BETWEEN 0 AND 100)
);
COMMIT;
