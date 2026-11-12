BEGIN;
CREATE INDEX IF NOT EXISTS ix_wh_balance_page ON wh_stock_balances(warehouse_id,expiry_date,lot_id,location_id,id);
CREATE INDEX IF NOT EXISTS ix_wh_reservation_scope ON wh_reservations(warehouse_id,status,expires_at,id);
CREATE INDEX IF NOT EXISTS ix_wh_reservation_balance ON wh_reservation_lines(balance_id,reservation_id);
COMMIT;
