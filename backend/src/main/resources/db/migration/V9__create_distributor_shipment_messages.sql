CREATE TABLE distributor_shipment_messages (
    id UUID PRIMARY KEY,
    shipment_code VARCHAR(64) NOT NULL,
    sender_id UUID NOT NULL,
    sender_email VARCHAR(254) NOT NULL,
    sender_name VARCHAR(120) NOT NULL,
    sender_role VARCHAR(24) NOT NULL,
    content VARCHAR(2000) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_distributor_shipment_messages_thread
    ON distributor_shipment_messages (shipment_code, sent_at ASC);
