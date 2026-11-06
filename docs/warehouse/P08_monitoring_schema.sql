-- Apply once after P06. All new data belongs to Warehouse; no Farmer/Order schema changes.
BEGIN;
ALTER TABLE storage_locations ADD CONSTRAINT uk_wh_location_identity UNIQUE(id,warehouse_id);
CREATE TABLE wh_monitoring_settings (
    warehouse_id UUID PRIMARY KEY REFERENCES warehouses(id),
    max_gap_seconds INTEGER NOT NULL DEFAULT 120 CHECK(max_gap_seconds BETWEEN 10 AND 3600),
    telegram_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    telegram_chat_id VARCHAR(100),
    CHECK(NOT telegram_enabled OR length(trim(telegram_chat_id))>0)
);
CREATE TABLE wh_sensor_devices (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL CHECK(length(key_hash)=64),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    simulated BOOLEAN NOT NULL DEFAULT FALSE,
    created_by VARCHAR(254) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_wh_sensor_identity UNIQUE(id,warehouse_id),
    FOREIGN KEY(location_id,warehouse_id) REFERENCES storage_locations(id,warehouse_id)
);
CREATE UNIQUE INDEX uk_wh_active_sensor_scope ON wh_sensor_devices(warehouse_id,COALESCE(location_id,'00000000-0000-0000-0000-000000000000'::UUID)) WHERE active;
CREATE TABLE wh_sensor_readings (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    device_id UUID NOT NULL,
    location_id UUID,
    message_id UUID NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL,
    temperature NUMERIC(4,1) NOT NULL CHECK(temperature BETWEEN -100 AND 100),
    humidity NUMERIC(4,1) NOT NULL CHECK(humidity BETWEEN 0 AND 100),
    CONSTRAINT uk_wh_sensor_message UNIQUE(device_id,message_id),
    FOREIGN KEY(device_id,warehouse_id) REFERENCES wh_sensor_devices(id,warehouse_id),
    FOREIGN KEY(location_id,warehouse_id) REFERENCES storage_locations(id,warehouse_id)
);
CREATE INDEX idx_wh_sensor_recorded ON wh_sensor_readings(device_id,recorded_at DESC,received_at DESC);
CREATE INDEX idx_wh_sensor_received ON wh_sensor_readings(device_id,received_at);
CREATE TABLE wh_monitoring_rules (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID,
    name VARCHAR(100) NOT NULL,
    kind VARCHAR(30) NOT NULL CHECK(kind IN ('TEMPERATURE_HIGH','TEMPERATURE_LOW','HUMIDITY_HIGH','HUMIDITY_LOW','NEAR_EXPIRY_HIGH_STOCK','SHELF_LIFE_LOW_HIGH_STOCK')),
    threshold_value NUMERIC(5,1) NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK(duration_minutes BETWEEN 0 AND 1440),
    recovery_minutes INTEGER NOT NULL CHECK(recovery_minutes BETWEEN 0 AND 1440),
    min_quantity_kg NUMERIC(14,3) CHECK(min_quantity_kg>=0),
    severity VARCHAR(20) NOT NULL CHECK(severity IN ('MEDIUM','HIGH','CRITICAL')),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_by VARCHAR(254) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_wh_monitor_rule_identity UNIQUE(id,warehouse_id),
    FOREIGN KEY(location_id,warehouse_id) REFERENCES storage_locations(id,warehouse_id),
    CHECK((kind='NEAR_EXPIRY_HIGH_STOCK' AND threshold_value BETWEEN 0 AND 365 AND threshold_value=trunc(threshold_value) AND min_quantity_kg IS NOT NULL AND duration_minutes=0 AND recovery_minutes=0)
       OR (kind='SHELF_LIFE_LOW_HIGH_STOCK' AND threshold_value BETWEEN 0 AND 100 AND min_quantity_kg IS NOT NULL AND duration_minutes=0 AND recovery_minutes=0)
       OR (kind IN ('TEMPERATURE_HIGH','TEMPERATURE_LOW') AND threshold_value BETWEEN -100 AND 100)
       OR (kind IN ('HUMIDITY_HIGH','HUMIDITY_LOW') AND threshold_value BETWEEN 0 AND 100))
);
CREATE INDEX idx_wh_monitor_rule_warehouse ON wh_monitoring_rules(warehouse_id,enabled);
CREATE TABLE wh_monitor_rule_revisions (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    rule_id UUID NOT NULL,
    definition VARCHAR(2000) NOT NULL,
    actor VARCHAR(254) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY(rule_id,warehouse_id) REFERENCES wh_monitoring_rules(id,warehouse_id)
);
CREATE INDEX idx_wh_rule_revision ON wh_monitor_rule_revisions(warehouse_id,rule_id,created_at DESC);
ALTER TABLE wh_risk_alerts ADD COLUMN location_id UUID;
ALTER TABLE wh_risk_alerts ADD COLUMN rule_id UUID;
ALTER TABLE wh_risk_alerts ADD COLUMN device_id UUID;
ALTER TABLE wh_risk_alerts ADD COLUMN lot_id VARCHAR(40);
ALTER TABLE wh_risk_alerts ADD FOREIGN KEY(location_id,warehouse_id) REFERENCES storage_locations(id,warehouse_id);
ALTER TABLE wh_risk_alerts ADD FOREIGN KEY(rule_id,warehouse_id) REFERENCES wh_monitoring_rules(id,warehouse_id);
ALTER TABLE wh_risk_alerts ADD FOREIGN KEY(device_id,warehouse_id) REFERENCES wh_sensor_devices(id,warehouse_id);
ALTER TABLE wh_risk_alerts DROP CONSTRAINT wh_risk_alerts_type_check;
ALTER TABLE wh_risk_alerts ADD CONSTRAINT wh_risk_alerts_type_check CHECK(type IN ('EXPIRY','STALE','QUALITY_HOLD','LOW_STOCK','SENSOR_OFFLINE','TEMPERATURE_HIGH','TEMPERATURE_LOW','HUMIDITY_HIGH','HUMIDITY_LOW','NEAR_EXPIRY_HIGH_STOCK','SHELF_LIFE_LOW_HIGH_STOCK','SHELF_LIFE_DATA_MISSING'));
CREATE TABLE wh_alert_deliveries (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    alert_id UUID NOT NULL REFERENCES wh_risk_alerts(id),
    chat_id VARCHAR(100) NOT NULL,
    message VARCHAR(3500) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK(status IN ('PENDING','RETRY','SENT','FAILED','CANCELLED')),
    attempts INTEGER NOT NULL CHECK(attempts>=0),
    last_error VARCHAR(100),
    next_attempt_at TIMESTAMPTZ NOT NULL,
    sent_at TIMESTAMPTZ
);
CREATE INDEX idx_wh_delivery_due ON wh_alert_deliveries(status,next_attempt_at);
CREATE INDEX idx_wh_delivery_warehouse ON wh_alert_deliveries(warehouse_id,next_attempt_at DESC);
COMMIT;
