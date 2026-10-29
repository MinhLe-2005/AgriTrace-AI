-- Warehouse-owned risk rules, alerts and audit history. Apply after P05.
BEGIN;
CREATE TABLE wh_risk_rules (
    warehouse_id UUID PRIMARY KEY REFERENCES warehouses(id),
    expiry_warning_days INTEGER NOT NULL DEFAULT 3 CHECK (expiry_warning_days BETWEEN 0 AND 365),
    stale_days INTEGER NOT NULL DEFAULT 14 CHECK (stale_days BETWEEN 1 AND 3650),
    low_stock_kg NUMERIC(14,3) NOT NULL DEFAULT 100 CHECK (low_stock_kg >= 0)
);
CREATE TABLE wh_risk_alerts (
    id UUID PRIMARY KEY,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    fingerprint VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('EXPIRY','STALE','QUALITY_HOLD','LOW_STOCK')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('MEDIUM','HIGH','CRITICAL')),
    message VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_wh_alert_fingerprint UNIQUE (warehouse_id,fingerprint)
);
CREATE INDEX idx_wh_alert_updated ON wh_risk_alerts(warehouse_id,updated_at DESC);
CREATE TABLE wh_alert_actions (
    id UUID PRIMARY KEY,
    alert_id UUID NOT NULL REFERENCES wh_risk_alerts(id),
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN','ACKNOWLEDGED','RESOLVED')),
    note VARCHAR(500) NOT NULL,
    actor VARCHAR(254) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_wh_alert_action_history ON wh_alert_actions(alert_id,created_at);
COMMIT;
