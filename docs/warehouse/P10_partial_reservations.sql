-- Apply after P04. Preserve prior completed reservations when adding partial dispatch accounting.
BEGIN;
ALTER TABLE wh_reservation_lines
    ADD COLUMN IF NOT EXISTS dispatched_kg NUMERIC(14,3) NOT NULL DEFAULT 0;
-- Recover actual dispatch quantities for legacy reservations, including old partial dispatches.
UPDATE wh_reservation_lines l SET dispatched_kg = LEAST(l.quantity_kg, COALESCE((
    SELECT SUM(dl.quantity_kg) FROM wh_documents d
    JOIN wh_document_lines dl ON dl.document_id=d.id
    JOIN wh_stock_balances b ON b.warehouse_id=d.warehouse_id
        AND b.location_id=dl.location_id AND b.lot_id=dl.lot_id
    WHERE d.reservation_id=l.reservation_id AND b.id=l.balance_id
        AND d.type='OUTBOUND' AND d.status IN ('CONFIRMED','HANDED_OVER')
), CASE WHEN EXISTS (
    SELECT 1 FROM wh_documents d WHERE d.reservation_id=l.reservation_id
        AND d.type='OUTBOUND' AND d.status IN ('CONFIRMED','HANDED_OVER')
) THEN 0 ELSE l.quantity_kg END))
FROM wh_reservations r
WHERE r.id=l.reservation_id AND r.status='CONSUMED' AND COALESCE(l.dispatched_kg,0)=0;
UPDATE wh_reservation_lines SET dispatched_kg=0 WHERE dispatched_kg IS NULL;
UPDATE wh_reservations r SET status=CASE WHEN expires_at>CURRENT_TIMESTAMP THEN 'ACTIVE' ELSE 'EXPIRED' END
WHERE status='CONSUMED' AND EXISTS (
    SELECT 1 FROM wh_reservation_lines l WHERE l.reservation_id=r.id AND l.dispatched_kg<l.quantity_kg
);
ALTER TABLE wh_reservation_lines ALTER COLUMN dispatched_kg SET DEFAULT 0;
ALTER TABLE wh_reservation_lines ALTER COLUMN dispatched_kg SET NOT NULL;
ALTER TABLE wh_reservation_lines DROP CONSTRAINT IF EXISTS ck_wh_reservation_dispatch;
ALTER TABLE wh_reservation_lines ADD CONSTRAINT ck_wh_reservation_dispatch
    CHECK (dispatched_kg >= 0 AND dispatched_kg <= quantity_kg);
COMMIT;
