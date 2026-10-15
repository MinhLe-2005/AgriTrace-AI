-- ==============================================================================
-- AGRITRACE AI - SMART AGRICULTURAL SUPPLY CHAIN MANAGEMENT SYSTEM
-- SCRIPT KHỞI TẠO CƠ SỞ DỮ LIỆU ĐẦY ĐỦ CHO SUPABASE (POSTGRESQL 16)
-- Bao gồm 5 Module: Auth, Nông trại/Sản phẩm, Kho & Vận chuyển, Đơn hàng/QR/Loyalty, AI & Chat
-- ==============================================================================

-- 1. Bật Extension UUID nếu chưa có
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- MODULE 1: AUTHENTICATION & USER MANAGEMENT (MEMBER 1)
-- ==============================================================================

-- Bảng Roles (5 vai trò chuẩn đề tài)
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES 
('ADMIN'), 
('FARMER'), 
('WAREHOUSE'), 
('DISTRIBUTOR'), 
('CUSTOMER')
ON CONFLICT (name) DO NOTHING;

-- Bảng Users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower ON users (LOWER(email));

-- Bảng Phân quyền User_Roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Bảng Refresh Tokens (JWT)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);


-- ==============================================================================
-- MODULE 2: FARM & PRODUCT MANAGEMENT (MEMBER 2)
-- ==============================================================================

-- Bảng Nông Trại (Farms)
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    address TEXT NOT NULL,
    province VARCHAR(64) NOT NULL,
    area_hectares NUMERIC(8, 2) NOT NULL DEFAULT 1.0,
    contact_phone VARCHAR(20),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_farms_owner_id ON farms(owner_id);

-- Bảng Danh Mục Nông Sản (Categories)
CREATE TABLE IF NOT EXISTS categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    code VARCHAR(32) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(32)
);

INSERT INTO categories (name, code, description, icon) VALUES
('Rau Ăn Lá Thủy Canh', 'VEG_LEAF', 'Các loại rau xanh ăn lá trồng thủy canh sạch', 'leaf'),
('Trái Cây Theo Mùa', 'FRUIT_SEASON', 'Trái cây chính vụ, dâu tây, cam, bơ sáp', 'apple'),
('Củ Quả & Nấm', 'VEG_ROOT', 'Khoai lang, cà rốt, củ dền, các loại nấm sạch', 'carrot'),
('Gia Vị & Thảo Mộc', 'HERBS', 'Húng quế, bạc hà, hương thảo hữu cơ', 'sparkles')
ON CONFLICT (code) DO NOTHING;

-- Bảng Nhóm Mùa Vụ (Crop Seasons)
CREATE TABLE IF NOT EXISTS crop_seasons (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_month INT NOT NULL CHECK (start_month BETWEEN 1 AND 12),
    end_month INT NOT NULL CHECK (end_month BETWEEN 1 AND 12),
    region VARCHAR(64) NOT NULL,
    expected_yield_tons NUMERIC(10, 2),
    status VARCHAR(32) NOT NULL DEFAULT 'IN_SEASON' -- UPCOMING, IN_SEASON, LATE_SEASON, OFF_SEASON
);

-- Bảng Sản Phẩm (Products)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL REFERENCES categories(id),
    season_id BIGINT REFERENCES crop_seasons(id),
    sku VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG', -- KG, GRAM, BOX, BUNCH
    image_url TEXT,
    is_seasonal BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL DEFAULT 'IN_STOCK', -- IN_STOCK, OUT_OF_STOCK, OUT_OF_SEASON, DISCONTINUED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_farm_id ON products(farm_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- Bảng Chứng Nhận Chất Lượng (Certifications: VietGAP, GlobalGAP, Organic)
CREATE TABLE IF NOT EXISTS certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    cert_type VARCHAR(32) NOT NULL, -- VIETGAP, GLOBALGAP, ORGANIC, HACCP
    cert_number VARCHAR(64) NOT NULL UNIQUE,
    issued_by VARCHAR(160) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    certificate_url TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED', -- PENDING, VERIFIED, EXPIRED, REVOKED
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_certifications_farm_id ON certifications(farm_id);

-- Bảng Lô Sản Xuất & Thu Hoạch (Harvest Lots)
CREATE TABLE IF NOT EXISTS harvest_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    certification_id UUID REFERENCES certifications(id),
    lot_code VARCHAR(40) NOT NULL UNIQUE,
    planting_date DATE NOT NULL,
    harvest_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity NUMERIC(10, 2) NOT NULL,
    current_quantity NUMERIC(10, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    storage_temp_celsius NUMERIC(4, 1) DEFAULT 5.0,
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- GROWING, HARVESTED, INSPECTING, APPROVED, IN_WAREHOUSE, SOLD_OUT
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_harvest_lots_product_id ON harvest_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_harvest_lots_farm_id ON harvest_lots(farm_id);

-- Bảng Nhật Ký Canh Tác (Farming Logs)
CREATE TABLE IF NOT EXISTS farming_logs (
    id BIGSERIAL PRIMARY KEY,
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    stage_name VARCHAR(64) NOT NULL,
    activity_type VARCHAR(32) NOT NULL, -- SEEDING, WATERING, FERTILIZING, PEST_CONTROL, HARVESTING
    description TEXT NOT NULL,
    ec_level NUMERIC(4, 2),
    ph_level NUMERIC(4, 2),
    performer_name VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==============================================================================
-- MODULE 3: WAREHOUSE & LOGISTICS MANAGEMENT (MEMBER 3)
-- ==============================================================================

-- Bảng Kho Hàng (Warehouses)
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manager_id UUID REFERENCES users(id),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    address TEXT NOT NULL,
    province VARCHAR(64) NOT NULL,
    capacity_tons NUMERIC(10, 2) NOT NULL DEFAULT 50.0,
    temp_celsius NUMERIC(4, 1) DEFAULT 4.0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Tồn Kho Theo Chuẩn FEFO (Warehouse Inventory)
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    quantity_in_stock NUMERIC(10, 2) NOT NULL,
    expiry_date DATE NOT NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(32) NOT NULL DEFAULT 'NORMAL', -- NORMAL, NEAR_EXPIRY, EXPIRED
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_warehouse_lot UNIQUE (warehouse_id, harvest_lot_id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_fefo ON warehouse_inventory (expiry_date ASC);

-- Bảng Lịch Sử Nhập/Xuất Kho (Stock Transactions)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id),
    type VARCHAR(16) NOT NULL, -- IMPORT, EXPORT
    quantity NUMERIC(10, 2) NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Chuyến Hàng Vận Chuyển (Shipments)
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor_id UUID NOT NULL REFERENCES users(id),
    shipment_code VARCHAR(32) NOT NULL UNIQUE,
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_address TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, IN_TRANSIT, DELIVERED, CANCELLED
    vehicle_plate VARCHAR(20),
    departed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Lịch Sử Hành Trình Giao Nhận (Tracking Events)
CREATE TABLE IF NOT EXISTS tracking_events (
    id BIGSERIAL PRIMARY KEY,
    shipment_code VARCHAR(32) NOT NULL,
    status VARCHAR(64) NOT NULL,
    location VARCHAR(120) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tracking_shipment ON tracking_events(shipment_code);


-- ==============================================================================
-- MODULE 4: ORDERS, QR TRACEABILITY & LOYALTY (MEMBER 4)
-- ==============================================================================

-- Bảng Mã QR Định Danh (QR Codes)
CREATE TABLE IF NOT EXISTS qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(64) NOT NULL UNIQUE, -- UUID token
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    qr_image_url TEXT,
    scan_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_qr_codes_lot ON qr_codes(harvest_lot_id);

-- Bảng Kho Voucher (Vouchers)
CREATE TABLE IF NOT EXISTS vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(32) NOT NULL UNIQUE,
    title VARCHAR(120) NOT NULL,
    discount_type VARCHAR(16) NOT NULL, -- PERCENT, FIXED, FREESHIP
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_discount NUMERIC(12, 2),
    usage_limit INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    membership_tier VARCHAR(16) NOT NULL DEFAULT 'ALL', -- ALL, BRONZE, SILVER, GOLD, DIAMOND
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đơn Hàng (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(32) NOT NULL UNIQUE,
    customer_id UUID NOT NULL REFERENCES users(id),
    voucher_id UUID REFERENCES vouchers(id),
    total_amount NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    shipping_fee NUMERIC(12, 2) NOT NULL DEFAULT 25000,
    final_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED
    shipping_address TEXT NOT NULL,
    receiver_name VARCHAR(120) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);

-- Bảng Chi Tiết Đơn Hàng (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    harvest_lot_id UUID REFERENCES harvest_lots(id),
    quantity NUMERIC(10, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL
);

-- Bảng Thanh Toán (Payments)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(32) NOT NULL, -- COD, VNPAY, MOMO, BANKING
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    transaction_code VARCHAR(64),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Hạng Thành Viên & Điểm Tích Lũy (Loyalty Memberships)
CREATE TABLE IF NOT EXISTS loyalty_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    current_points INT NOT NULL DEFAULT 0,
    lifetime_points INT NOT NULL DEFAULT 0,
    tier VARCHAR(16) NOT NULL DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, DIAMOND
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Lịch Sử Điểm Thưởng (Loyalty Transactions)
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id),
    points INT NOT NULL,
    type VARCHAR(16) NOT NULL, -- EARN, REDEEM
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ==============================================================================
-- MODULE 5: AI SOLUTIONS & WEBSOCKET CHAT (MEMBER 5)
-- ==============================================================================

-- Bảng AI Dự Đoán Nhu Cầu Tiêu Thụ (AI Demand Forecasts)
CREATE TABLE IF NOT EXISTS ai_demand_forecasts (
    id BIGSERIAL PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    predicted_quantity NUMERIC(10, 2) NOT NULL,
    actual_quantity NUMERIC(10, 2),
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.92,
    factors JSONB, -- { "weather": "sunny", "seasonality": 1.25, "day_of_week": "Friday" }
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng AI Cảnh Báo Rủi Ro Chuỗi Cung Ứng (AI Risk Alerts)
CREATE TABLE IF NOT EXISTS ai_risk_alerts (
    id BIGSERIAL PRIMARY KEY,
    harvest_lot_id UUID REFERENCES harvest_lots(id),
    warehouse_id UUID REFERENCES warehouses(id),
    risk_type VARCHAR(32) NOT NULL, -- EXPIRY_RISK, STOCKOUT_RISK, TEMP_ANOMALY, SHIPMENT_DELAY
    severity VARCHAR(16) NOT NULL, -- LOW, MEDIUM, HIGH, CRITICAL
    description TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Phòng Chat Trực Tuyến (Chat Rooms)
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES users(id),
    staff_id UUID REFERENCES users(id),
    farm_id UUID REFERENCES farms(id),
    status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, CLOSED
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Tin Nhắn Chat WebSocket (Chat Messages)
CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);


-- ==============================================================================
-- SEED DATA: DỮ LIỆU MẪU ĐỂ TEST & DEMO ĐỒ ÁN (MẬT KHẨU: password123)
-- BCrypt Hash: $2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi
-- ==============================================================================

-- 1. Tài khoản mẫu cho 5 Vai trò
INSERT INTO users (id, email, password_hash, full_name, phone, active, verified) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@agritrace.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Quản Trị Viên (Admin)', '0901000001', TRUE, TRUE),
('22222222-2222-2222-2222-222222222222', 'farmer.hung@agritrace.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Nguyễn Văn Hùng (Chủ Nông Trại)', '0902000002', TRUE, TRUE),
('33333333-3333-3333-3333-333333333333', 'warehouse.kho@agritrace.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Trần Thị Thu (Thủ Kho FEFO)', '0903000003', TRUE, TRUE),
('44444444-4444-4444-4444-444444444444', 'distributor.van@agritrace.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Lê Hoàng Vận (Nhà Phân Phối)', '0904000004', TRUE, TRUE),
('55555555-5555-5555-5555-555555555555', 'customer.minh@agritrace.vn', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'Lê Quang Minh (Khách Hàng)', '0905000005', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- Gán vai trò
INSERT INTO user_roles (user_id, role_id)
SELECT '11111111-1111-1111-1111-111111111111', id FROM roles WHERE name = 'ADMIN'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '22222222-2222-2222-2222-222222222222', id FROM roles WHERE name = 'FARMER'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '33333333-3333-3333-3333-333333333333', id FROM roles WHERE name = 'WAREHOUSE'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '44444444-4444-4444-4444-444444444444', id FROM roles WHERE name = 'DISTRIBUTOR'
ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role_id)
SELECT '55555555-5555-5555-5555-555555555555', id FROM roles WHERE name = 'CUSTOMER'
ON CONFLICT DO NOTHING;

-- 2. Nông Trại Mẫu
INSERT INTO farms (id, owner_id, code, name, address, province, area_hectares, contact_phone, description) VALUES
('aaaa1111-aaaa-1111-aaaa-111111111111', '22222222-2222-2222-2222-222222222222', 'NT-DL-01', 'Nông Trại Xanh Đà Lạt', 'Phường 7, TP. Đà Lạt', 'Lâm Đồng', 3.5, '0902000002', 'Chuyên canh rau ăn lá thủy canh hồi lưu và dâu tây giống Nhật'),
('bbbb2222-bbbb-2222-bbbb-222222222222', '22222222-2222-2222-2222-222222222222', 'NT-HY-02', 'Vườn Cam Sành Hàm Yên', 'Xã Tân Thành, Huyện Hàm Yên', 'Tuyên Quang', 8.0, '0902000003', 'Vùng trồng cam sành hữu cơ đạt chuẩn VietGAP')
ON CONFLICT (code) DO NOTHING;

-- 3. Mùa Vụ Mẫu
INSERT INTO crop_seasons (id, name, start_month, end_month, region, expected_yield_tons, status) VALUES
(1, 'Mùa Vụ Thu Đông Đà Lạt 2026', 9, 12, 'Tây Nguyên', 45.0, 'IN_SEASON'),
(2, 'Vụ Cam Sành Hàm Yên Chính Vụ', 10, 2, 'Tuyên Quang', 120.0, 'IN_SEASON')
ON CONFLICT DO NOTHING;

-- 4. Chứng Nhận Mẫu (VietGAP)
INSERT INTO certifications (id, farm_id, cert_type, cert_number, issued_by, issue_date, expiry_date, status, verified_by) VALUES
('cccc1111-cccc-1111-cccc-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'VIETGAP', 'VG-2024-889', 'Chi cục Trồng trọt & BVTV Lâm Đồng', '2024-12-15', '2026-12-15', 'VERIFIED', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (cert_number) DO NOTHING;

-- 5. Sản Phẩm Mẫu
INSERT INTO products (id, farm_id, category_id, season_id, sku, name, description, price, unit, image_url, is_seasonal, status) VALUES
('dddd1111-dddd-1111-dddd-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 1, 1, 'SP-XL-01', 'Xà Lách Lô Lô Thủy Canh', 'Rau giòn ngọt, canh tác NFT chuẩn VietGAP', 35000, 'KG', '/images/fresh-produce.png', FALSE, 'IN_STOCK'),
('dddd2222-dddd-2222-dddd-222222222222', 'aaaa1111-aaaa-1111-aaaa-111111111111', 2, 1, 'SP-DT-02', 'Dâu Tây New Zealand Đà Lạt', 'Quả đỏ mọng, ngọt đậm đà, thu hoạch chính vụ', 180000, 'BOX', '/images/fresh-produce.png', TRUE, 'IN_STOCK'),
('dddd3333-dddd-3333-dddd-333333333333', 'bbbb2222-bbbb-2222-bbbb-222222222222', 2, 2, 'SP-CS-03', 'Cam Sành Hàm Yên Mọng Nước', 'Cam sành sạch tép giòn nhiều nước, giàu Vitamin C', 45000, 'KG', '/images/fresh-produce.png', TRUE, 'IN_STOCK')
ON CONFLICT (sku) DO NOTHING;

-- 6. Lô Thu Hoạch Mẫu (Harvest Lots)
INSERT INTO harvest_lots (id, farm_id, product_id, certification_id, lot_code, planting_date, harvest_date, expiry_date, initial_quantity, current_quantity, unit, status) VALUES
('eeee1111-eeee-1111-eeee-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'cccc1111-cccc-1111-cccc-111111111111', 'LOT-XL-2026-08', '2026-09-01', '2026-10-12', '2026-10-22', 500, 320, 'KG', 'APPROVED')
ON CONFLICT (lot_code) DO NOTHING;

-- 7. Mã QR Truy Xuất Nguồn Gốc Mẫu
INSERT INTO qr_codes (id, code, harvest_lot_id, product_id, scan_count) VALUES
('ffff1111-ffff-1111-ffff-111111111111', 'AGRI-QR-XL-2026-08-DEMO', 'eeee1111-eeee-1111-eeee-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 142)
ON CONFLICT (code) DO NOTHING;

-- 8. Kho Voucher Ưu Đãi Mẫu
INSERT INTO vouchers (id, code, title, discount_type, discount_value, min_order_value, usage_limit, membership_tier, start_date, end_date, active) VALUES
('10101010-1010-1010-1010-101010101010', 'AGRI30', 'Giảm 30% Đơn Hàng Nông Sản Đầu Tiên', 'PERCENT', 30, 100000, 500, 'ALL', '2026-01-01', '2026-12-31', TRUE),
('20202020-2020-2020-2020-202020202020', 'FREESHIP50', 'Miễn Phí Vận Chuyển Đơn Từ 200k', 'FREESHIP', 25000, 200000, 1000, 'ALL', '2026-01-01', '2026-12-31', TRUE),
('30303030-3030-3030-3030-303030303030', 'VIPGOLD', 'Đặc Quyền Hội Viên Vàng - Giảm 50k', 'FIXED', 50000, 300000, 200, 'GOLD', '2026-01-01', '2026-12-31', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 9. Hội Viên Khách Hàng Thân Thiết (Loyalty)
INSERT INTO loyalty_memberships (user_id, current_points, lifetime_points, tier) VALUES
('55555555-5555-5555-5555-555555555555', 1250, 2800, 'GOLD')
ON CONFLICT (user_id) DO NOTHING;

-- 10. AI Demand Forecast & Risk Alert Mẫu
INSERT INTO ai_demand_forecasts (product_id, forecast_date, predicted_quantity, actual_quantity, confidence_score) VALUES
('dddd1111-dddd-1111-dddd-111111111111', '2026-10-16', 85.0, NULL, 0.94),
('dddd1111-dddd-1111-dddd-111111111111', '2026-10-17', 110.0, NULL, 0.91)
ON CONFLICT DO NOTHING;

INSERT INTO ai_risk_alerts (harvest_lot_id, risk_type, severity, description, recommended_action) VALUES
('eeee1111-eeee-1111-eeee-111111111111', 'EXPIRY_RISK', 'MEDIUM', 'Lô xà lách LOT-XL-2026-08 còn 6 ngày hạn dùng, tồn kho 320kg', 'Khuyến nghị ưu tiên xuất kho FEFO và áp dụng Voucher giảm giá 15%');

-- ==============================================================================
-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU AGRITRACE AI TRÊN SUPABASE!
-- ==============================================================================
