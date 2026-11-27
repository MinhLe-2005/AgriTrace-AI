-- Chạy với psql trên bản sao đã cài schema hiện tại. Mỗi ngày có một bộ riêng.
\set ON_ERROR_STOP on
BEGIN;
DO $$ BEGIN
    IF NOT starts_with(current_database(), 'warehouse_demo_') THEN
        RAISE EXCEPTION 'Chỉ chạy trên database riêng có tên bắt đầu bằng warehouse_demo_';
    END IF;
END $$;
CREATE TEMP TABLE demo_context ON COMMIT DROP AS
SELECT 'DEMO-' || to_char(current_date, 'YYYYMMDD') AS prefix;
INSERT INTO agri_harvest_lots(code, product, harvest_date, expiry_date, qty, unit, status, farm_name, created_at)
SELECT prefix || '-' || suffix, 'Rau demo FEFO', current_date::text, (current_date + days)::text,
       kg, 'kg', 'Đã duyệt xuất kho', 'Nông trại demo FEFO', now()
FROM demo_context CROSS JOIN (VALUES ('A',3,'6'),('B',8,'10'),('C',12,'2')) AS lots(suffix,days,kg)
ON CONFLICT (code) DO NOTHING;
WITH new_order AS (
    INSERT INTO agri_orders(order_code,receiver_name,receiver_phone,receiver_address,status,created_at)
    SELECT prefix || '-ORDER', 'Khách demo', '0000000000', 'Điểm giao demo', 'CONFIRMED', now()
    FROM demo_context ON CONFLICT (order_code) DO NOTHING RETURNING id
)
INSERT INTO agri_order_items(order_id,name,qty,price)
SELECT id, 'Rau demo FEFO', '8 kg', 1 FROM new_order;
INSERT INTO agri_shipments(shipment_code,order_codes,driver_name,vehicle_number,origin,destination,product_summary,status,created_at,updated_at)
SELECT prefix || '-SHIP', prefix || '-ORDER', 'Demo', 'DEMO', 'Kho demo','Điểm giao demo','Rau demo FEFO','PREPARING',now(),now()
FROM demo_context ON CONFLICT (shipment_code) DO NOTHING;
COMMIT;
