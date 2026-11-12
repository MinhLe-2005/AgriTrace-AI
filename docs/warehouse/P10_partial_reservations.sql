-- Apply after P04. Preserve prior completed reservations when adding partial dispatch accounting.
BEGIN;
ALTER TABLE wh_reservation_lines
    ADD COLUMN IF NOT EXISTS dispatched_kg NUMERIC(14,3) NOT NULL DEFAULT 0;
UPDATE wh_reservation_lines l SET dispatched_kg = l.quantity_kg
FROM wh_reservations r
WHERE r.id = l.reservation_id AND r.status = 'CONSUMED' AND l.dispatched_kg = 0;
ALTER TABLE wh_reservation_lines DROP CONSTRAINT IF EXISTS ck_wh_reservation_dispatch;
ALTER TABLE wh_reservation_lines ADD CONSTRAINT ck_wh_reservation_dispatch
    CHECK (dispatched_kg >= 0 AND dispatched_kg <= quantity_kg);
COMMIT;
