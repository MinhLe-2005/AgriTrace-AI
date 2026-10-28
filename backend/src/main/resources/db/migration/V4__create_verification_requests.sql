CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('FARMER', 'DISTRIBUTOR')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    organization_name VARCHAR(150) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    document_url VARCHAR(500) NOT NULL,
    note VARCHAR(1000),
    decision_reason VARCHAR(1000),
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_verification_status_type ON verification_requests(status, type);
CREATE INDEX IF NOT EXISTS idx_verification_subject ON verification_requests(subject_id);
