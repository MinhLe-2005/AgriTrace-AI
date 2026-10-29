-- Apply once after P08. Coordinates describe the map only, not physical stock transfers.
BEGIN;
CREATE TABLE wh_location_layouts (
    location_id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    row_no INTEGER NOT NULL CHECK(row_no BETWEEN 1 AND 30),
    column_no INTEGER NOT NULL CHECK(column_no BETWEEN 1 AND 30),
    level_no INTEGER NOT NULL CHECK(level_no BETWEEN 1 AND 10),
    updated_by VARCHAR(254) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_wh_layout_cell UNIQUE(warehouse_id,level_no,row_no,column_no),
    FOREIGN KEY(location_id,warehouse_id) REFERENCES storage_locations(id,warehouse_id)
);
COMMIT;
