CREATE TABLE distributor_notifications (
    id UUID PRIMARY KEY,
    recipient_email VARCHAR(254) NOT NULL,
    type VARCHAR(48) NOT NULL,
    title VARCHAR(160) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    reference_code VARCHAR(64),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_distributor_notifications_recipient_created
    ON distributor_notifications (recipient_email, created_at DESC);

CREATE INDEX idx_distributor_notifications_recipient_unread
    ON distributor_notifications (recipient_email, is_read, created_at DESC);
