-- ==============================================================================
-- AGRITRACE AI - SMART AGRICULTURAL SYSTEM
-- FULL DATABASE CHO TẤT CẢ 5 VAI TRÒ (ACTORS) TRONG DỰ ÁN
-- ADMIN | FARMER | WAREHOUSE | DISTRIBUTOR | CUSTOMER
-- TẤT CẢ MẬT KHẨU MẪU ĐỀU LÀ: 123456
-- ==============================================================================

-- 1. XÓA VÀ KHỞI TẠO LẠI SCHEMA MỚI
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. HỆ THỐNG PHÂN QUYỀN & TÀI KHOẢN (AUTH & 5 ACTORS)
-- ==============================================================================

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(32) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES 
('ADMIN'), 
('FARMER'), 
('WAREHOUSE'), 
('DISTRIBUTOR'), 
('CUSTOMER'),
('USER');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    full_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    address TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    verified BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX ux_users_email_lower ON users (LOWER(email));

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(160) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. MODULE 2: NÔNG DÂN & NÔNG TRẠI (FARMER)
-- ==============================================================================

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(50) NOT NULL UNIQUE,
    icon VARCHAR(50),
    description TEXT
);

INSERT INTO categories (name, code, icon, description) VALUES
('Rau Ăn Lá Thủy Canh', 'RAU_LA', '🥗', 'Rau xanh giòn ngọt, canh tác thủy canh chuẩn VietGAP'),
('Củ Quả Tươi Sạch', 'CU_QUA', '🥕', 'Củ quả Đà Lạt tươi mới, an toàn sức khỏe'),
('Trái Cây Đặc Sản', 'TRAI_CAY', '🍓', 'Trái cây ngọt mọng thu hoạch tại vườn chất lượng cao'),
('Nấm & Nông Sản Chế Biến', 'NAM_CHEBIEN', '🍄', 'Nấm sạch và các dòng thực phẩm organic');

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    province VARCHAR(100),
    area_hectares NUMERIC(6,2) DEFAULT 3.5,
    cert_standard VARCHAR(50) DEFAULT 'VietGAP',
    rating NUMERIC(2,1) DEFAULT 4.9,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE crop_seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_month INT NOT NULL,
    end_month INT NOT NULL,
    region VARCHAR(100),
    expected_yield_tons NUMERIC(8,2),
    status VARCHAR(30) DEFAULT 'IN_SEASON'
);

CREATE TABLE certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    cert_type VARCHAR(50) NOT NULL, -- VIETGAP, GLOBALGAP, ORGANIC
    cert_number VARCHAR(100) UNIQUE NOT NULL,
    issued_by VARCHAR(150) NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(30) DEFAULT 'VERIFIED',
    verified_by UUID REFERENCES users(id)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50) UNIQUE,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
    season_id INT REFERENCES crop_seasons(id) ON DELETE SET NULL,
    price NUMERIC(12,2) NOT NULL,
    original_price NUMERIC(12,2),
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    stock_quantity INT NOT NULL DEFAULT 100,
    description TEXT,
    origin VARCHAR(100) DEFAULT 'Đà Lạt, Lâm Đồng',
    cert_type VARCHAR(50) DEFAULT 'VietGAP',
    image_url TEXT,
    rating NUMERIC(2,1) DEFAULT 5.0,
    rating_count INT DEFAULT 12,
    is_seasonal BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'IN_STOCK',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE harvest_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    certification_id UUID REFERENCES certifications(id) ON DELETE SET NULL,
    lot_code VARCHAR(100) UNIQUE NOT NULL,
    planting_date DATE NOT NULL,
    harvest_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    initial_quantity NUMERIC(10,2) NOT NULL,
    current_quantity NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    status VARCHAR(30) DEFAULT 'APPROVED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE farming_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,
    action_description TEXT NOT NULL,
    fertilizer_used VARCHAR(150),
    pesticide_used VARCHAR(150),
    temperature_c NUMERIC(4,1),
    humidity_percent NUMERIC(4,1),
    logged_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    logged_by UUID REFERENCES users(id)
);

-- ==============================================================================
-- 4. MODULE 3: THỦ KHO & KHO LẠNH FEFO (WAREHOUSE)
-- ==============================================================================

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    manager_id UUID REFERENCES users(id) ON DELETE SET NULL,
    location VARCHAR(200) NOT NULL,
    capacity_tons NUMERIC(10,2) NOT NULL,
    temp_target_c NUMERIC(4,1) DEFAULT 4.0,
    humidity_target NUMERIC(4,1) DEFAULT 85.0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE warehouse_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    quantity NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    zone_bin VARCHAR(50) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fefo_priority INT DEFAULT 1,
    status VARCHAR(30) DEFAULT 'IN_STORAGE'
);

CREATE TABLE stock_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    harvest_lot_id UUID NOT NULL REFERENCES harvest_lots(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- INBOUND, OUTBOUND, DISPOSAL
    quantity NUMERIC(10,2) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    note TEXT,
    performed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 5. MODULE 4: NHÀ PHÂN PHỐI & VẬN CHUYỂN (DISTRIBUTOR)
-- ==============================================================================

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_code VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id UUID REFERENCES warehouses(id),
    distributor_id UUID REFERENCES users(id),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    vehicle_number VARCHAR(30),
    temp_c NUMERIC(4,1) DEFAULT 4.5,
    status VARCHAR(30) DEFAULT 'IN_TRANSIT', -- PREPARING, IN_TRANSIT, DELIVERED
    dispatch_time TIMESTAMPTZ,
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tracking_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    location VARCHAR(200) NOT NULL,
    temperature_c NUMERIC(4,1),
    humidity_percent NUMERIC(4,1),
    status VARCHAR(50) NOT NULL,
    note TEXT,
    event_time TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 6. MODULE 5: KHÁCH HÀNG & THƯƠNG MẠI (CUSTOMER)
-- ==============================================================================

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    discount_type VARCHAR(20) NOT NULL, -- PERCENT, FIXED, FREESHIP
    discount_value NUMERIC(12,2) NOT NULL,
    min_order_value NUMERIC(12,2) DEFAULT 0,
    max_discount NUMERIC(12,2) DEFAULT 100000,
    usage_limit INT DEFAULT 500,
    used_count INT DEFAULT 0,
    membership_tier VARCHAR(20) DEFAULT 'ALL',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_code VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(120) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0,
    shipping_fee NUMERIC(12,2) DEFAULT 25000,
    total_amount NUMERIC(12,2) NOT NULL,
    voucher_code VARCHAR(50),
    payment_method VARCHAR(30) DEFAULT 'COD',
    payment_status VARCHAR(30) DEFAULT 'PENDING',
    order_status VARCHAR(30) DEFAULT 'CONFIRMED',
    points_earned INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image TEXT,
    unit VARCHAR(20) DEFAULT 'KG',
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL,
    total_price NUMERIC(12,2) NOT NULL
);

CREATE TABLE loyalty_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_points INT NOT NULL DEFAULT 100,
    lifetime_points INT NOT NULL DEFAULT 100,
    tier VARCHAR(20) NOT NULL DEFAULT 'SILVER',
    total_spent NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    customer_name VARCHAR(120) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    harvest_lot_id UUID REFERENCES harvest_lots(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    farm_name VARCHAR(150),
    harvest_date DATE,
    cert_standard VARCHAR(50),
    scan_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 7. MODULE AI & CHAT TRỰC TUYẾN
-- ==============================================================================

CREATE TABLE ai_demand_forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    forecast_date DATE NOT NULL,
    predicted_quantity NUMERIC(10,2) NOT NULL,
    actual_quantity NUMERIC(10,2),
    confidence_score NUMERIC(3,2) DEFAULT 0.92,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ai_risk_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    harvest_lot_id UUID REFERENCES harvest_lots(id) ON DELETE CASCADE,
    risk_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    recommended_action TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 8. NẠP ĐẦY ĐỦ 5 ACTORS VÀ DỮ LIỆU MẪU SẴN SÀNG DEMO
-- MẬT KHẨU TẤT CẢ CÁC TÀI KHOẢN: 123456
-- Hash BCrypt: $2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu
-- ==============================================================================

-- 8.1 DANH SÁCH 5 ACTOR (ĐĂNG NHẬP BẰNG TÊN NGẮN HOẶC EMAIL ĐỀU ĐƯỢC)

-- 1. ADMIN (Quản trị viên)
INSERT INTO users (id, email, password_hash, full_name, phone, address) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Quản Trị Viên (Admin)', '0901234567', 'Trụ sở AgriTrace'),
('11111111-1111-1111-1111-111111111112', 'admin@gmail.com', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Quản Trị Viên (Admin)', '0901234567', 'Trụ sở AgriTrace');

-- 2. FARMER (Nông dân)
INSERT INTO users (id, email, password_hash, full_name, phone, address) VALUES
('22222222-2222-2222-2222-222222222222', 'farmer', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Nguyễn Văn Hùng (Nông Dân)', '0912345678', 'Xã Lát, Lạc Dương, Lâm Đồng'),
('22222222-2222-2222-2222-222222222223', 'farmer@gmail.com', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Nguyễn Văn Hùng (Nông Dân)', '0912345678', 'Xã Lát, Lạc Dương, Lâm Đồng');

-- 3. WAREHOUSE (Thủ kho lạnh)
INSERT INTO users (id, email, password_hash, full_name, phone, address) VALUES
('33333333-3333-3333-3333-333333333333', 'warehouse', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Trần Văn Kho (Quản Lý Kho)', '0933445566', 'Khu Công Nghiệp Sóng Thần, Bình Dương'),
('33333333-3333-3333-3333-333333333334', 'warehouse@gmail.com', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Trần Văn Kho (Quản Lý Kho)', '0933445566', 'Khu Công Nghiệp Sóng Thần, Bình Dương');

-- 4. DISTRIBUTOR (Nhà phân phối & Vận chuyển)
INSERT INTO users (id, email, password_hash, full_name, phone, address) VALUES
('44444444-4444-4444-4444-444444444444', 'distributor', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Vũ Thị Giao Vận (Nhà Phân Phối)', '0944556677', 'Tổng kho Phân Phối Hà Nội & HCM'),
('44444444-4444-4444-4444-444444444445', 'distributor@gmail.com', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Vũ Thị Giao Vận (Nhà Phân Phối)', '0944556677', 'Tổng kho Phân Phối Hà Nội & HCM');

-- 5. CUSTOMER (Khách hàng)
INSERT INTO users (id, email, password_hash, full_name, phone, address) VALUES
('55555555-5555-5555-5555-555555555555', 'customer', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Lê Quang Minh (Khách Hàng)', '0988776655', 'Số 123 Cầu Giấy, Hà Nội'),
('55555555-5555-5555-5555-555555555556', 'customer@gmail.com', '$2a$10$Z3KlkCUybPRtuGyyHzWSEO0oqBYKhunZLyc4I3CmYfSqLbb5Ly8xu', 'Lê Quang Minh (Khách Hàng)', '0988776655', 'Số 123 Cầu Giấy, Hà Nội');

-- Gán vai trò cho 5 Actor
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email IN ('admin', 'admin@gmail.com') AND r.name = 'ADMIN';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email IN ('farmer', 'farmer@gmail.com') AND r.name = 'FARMER';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email IN ('warehouse', 'warehouse@gmail.com') AND r.name = 'WAREHOUSE';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email IN ('distributor', 'distributor@gmail.com') AND r.name = 'DISTRIBUTOR';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r WHERE u.email IN ('customer', 'customer@gmail.com') AND r.name IN ('CUSTOMER', 'USER');

-- 8.2 Dữ liệu Nông trại & Mùa vụ
INSERT INTO farms (id, name, owner_id, phone, address, province, cert_standard) VALUES
('aaaa1111-aaaa-1111-aaaa-111111111111', 'Nông Trại Xanh Thủy Canh Đà Lạt', '22222222-2222-2222-2222-222222222222', '0912345678', 'Tiểu khu 112, Lạc Dương', 'Lâm Đồng', 'VietGAP'),
('bbbb2222-bbbb-2222-bbbb-222222222222', 'Hợp Tác Xã Nông Sản Sạch Mộc Châu', '22222222-2222-2222-2222-222222222222', '0987654321', 'Thị trấn Nông trường Mộc Châu', 'Sơn La', 'GlobalGAP');

INSERT INTO crop_seasons (id, name, start_month, end_month, region, expected_yield_tons, status) VALUES
(1, 'Mùa Vụ Thu Đông Đà Lạt 2026', 9, 12, 'Tây Nguyên', 45.0, 'IN_SEASON'),
(2, 'Vụ Cam Sành Hàm Yên Chính Vụ', 10, 2, 'Tuyên Quang', 120.0, 'IN_SEASON');

INSERT INTO certifications (id, farm_id, cert_type, cert_number, issued_by, issue_date, expiry_date, status, verified_by) VALUES
('cccc1111-cccc-1111-cccc-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'VIETGAP', 'VG-2024-889', 'Chi cục Trồng trọt & BVTV Lâm Đồng', '2024-12-15', '2026-12-15', 'VERIFIED', '11111111-1111-1111-1111-111111111111');

-- 8.3 Danh mục sản phẩm
INSERT INTO products (id, name, sku, category_id, farm_id, season_id, price, original_price, unit, stock_quantity, description, origin, cert_type, image_url, rating, rating_count) VALUES
('dddd1111-dddd-1111-dddd-111111111111', 'Xà Lách Lô Lô Xanh Thủy Canh', 'SP-XL-01', 1, 'aaaa1111-aaaa-1111-aaaa-111111111111', 1, 35000, 42000, 'KG', 150, 'Rau giòn ngọt mát, canh tác công nghệ NFT tuần hoàn chuẩn VietGAP, thu hoạch trong ngày.', 'Đà Lạt, Lâm Đồng', 'VietGAP', '/images/fresh-produce.png', 4.9, 38),
('dddd2222-dddd-2222-dddd-222222222222', 'Dâu Tây New Zealand Mộc Châu', 'SP-DT-02', 3, 'bbbb2222-bbbb-2222-bbbb-222222222222', 1, 180000, 210000, 'HỘP 500G', 85, 'Dâu tây đỏ mọng căng bóng, vị ngọt thanh đậm đà thơm tự nhiên, đạt tiêu chuẩn GlobalGAP.', 'Mộc Châu, Sơn La', 'GlobalGAP', '/images/fresh-produce.png', 5.0, 52),
('dddd3333-dddd-3333-dddd-333333333333', 'Cam Sành Hàm Yên Tép Vàng Mọng Nước', 'SP-CS-03', 3, 'bbbb2222-bbbb-2222-bbbb-222222222222', 2, 45000, 55000, 'KG', 200, 'Cam sành chính vụ vỏ mỏng, tép vàng giòn nhiều nước, giàu Vitamin C tăng cường đề kháng.', 'Tuyên Quang', 'VietGAP', '/images/fresh-produce.png', 4.8, 27),
('dddd4444-dddd-4444-dddd-444444444444', 'Cà Chua Bi Cherry Đỏ Ngọt', 'SP-CC-04', 2, 'aaaa1111-aaaa-1111-aaaa-111111111111', 1, 50000, 60000, 'KG', 120, 'Cà chua cherry giòn ngọt, vỏ bóng mọng nước, phù hợp ăn sống hoặc làm salad dinh dưỡng.', 'Đà Lạt, Lâm Đồng', 'VietGAP', '/images/fresh-produce.png', 4.9, 19),
('dddd5555-dddd-5555-dddd-555555555555', 'Cải Xoăn Kale Hữu Cơ Dinh Dưỡng', 'SP-KL-05', 1, 'aaaa1111-aaaa-1111-aaaa-111111111111', 1, 65000, 75000, 'KG', 90, 'Nữ hoàng rau xanh, dồi dào chất xơ, vitamin A-C-K và khoáng chất, chuẩn Organic.', 'Đà Lạt, Lâm Đồng', 'Organic', '/images/fresh-produce.png', 4.7, 15),
('dddd6666-dddd-6666-dddd-666666666666', 'Bơ Sáp 034 Đặc Sản Cao Nguyên', 'SP-BO-06', 3, 'aaaa1111-aaaa-1111-aaaa-111111111111', 1, 75000, 90000, 'KG', 110, 'Bơ dẻo quánh, hạt lép, cơm vàng ngậy béo, thơm ngon đặc biệt được hái trực tiếp tại vườn.', 'Bảo Lộc, Lâm Đồng', 'VietGAP', '/images/fresh-produce.png', 5.0, 44);

-- 8.4 Lô thu hoạch (Harvest Lots) & Nhật ký canh tác
INSERT INTO harvest_lots (id, farm_id, product_id, certification_id, lot_code, planting_date, harvest_date, expiry_date, initial_quantity, current_quantity, unit, status) VALUES
('eeee1111-eeee-1111-eeee-111111111111', 'aaaa1111-aaaa-1111-aaaa-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'cccc1111-cccc-1111-cccc-111111111111', 'LOT-XL-2026-08', CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '8 days', 500, 320, 'KG', 'APPROVED'),
('eeee2222-eeee-2222-eeee-222222222222', 'bbbb2222-bbbb-2222-bbbb-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'cccc1111-cccc-1111-cccc-111111111111', 'LOT-DT-2026-11', CURRENT_DATE - INTERVAL '50 days', CURRENT_DATE - INTERVAL '1 days', CURRENT_DATE + INTERVAL '5 days', 200, 140, 'HỘP 500G', 'APPROVED');

INSERT INTO farming_logs (harvest_lot_id, stage, action_description, temperature_c, humidity_percent, logged_by) VALUES
('eeee1111-eeee-1111-eeee-111111111111', 'Gieo Hạt', 'Gieo hạt giống xà lách chịu nhiệt trong giá thể xơ dừa vô trùng', 22.5, 75.0, '22222222-2222-2222-2222-222222222222'),
('eeee1111-eeee-1111-eeee-111111111111', 'Thu Hoạch', 'Thu hoạch lứa đầu sáng sớm, đóng thùng mát bảo quản', 18.0, 80.0, '22222222-2222-2222-2222-222222222222');

-- 8.5 Dữ liệu Kho lạnh FEFO (Warehouse)
INSERT INTO warehouses (id, name, manager_id, location, capacity_tons, temp_target_c, humidity_target) VALUES
('99991111-9999-1111-9999-111111111111', 'Kho Lạnh Trung Tâm Đà Lạt Hub 01', '33333333-3333-3333-3333-333333333333', 'Lô B4 KCN Trại Mát, Đà Lạt', 200.0, 4.0, 85.0),
('99992222-9999-2222-9999-222222222222', 'Kho Phân Phối Sóng Thần HCM Hub 02', '33333333-3333-3333-3333-333333333333', 'KCN Sóng Thần 2, Dĩ An, Bình Dương', 500.0, 5.0, 80.0);

INSERT INTO warehouse_inventory (warehouse_id, harvest_lot_id, quantity, unit, zone_bin, fefo_priority) VALUES
('99991111-9999-1111-9999-111111111111', 'eeee1111-eeee-1111-eeee-111111111111', 320, 'KG', 'BIN-A1-04', 1),
('99991111-9999-1111-9999-111111111111', 'eeee2222-eeee-2222-eeee-222222222222', 140, 'HỘP 500G', 'BIN-B2-08', 2);

INSERT INTO stock_transactions (warehouse_id, harvest_lot_id, type, quantity, unit, note, performed_by) VALUES
('99991111-9999-1111-9999-111111111111', 'eeee1111-eeee-1111-eeee-111111111111', 'INBOUND', 500, 'KG', 'Nhập kho lô xà lách từ Nông trại Đà Lạt', '33333333-3333-3333-3333-333333333333');

-- 8.6 Dữ liệu Vận chuyển & Giao vận (Distributor)
INSERT INTO shipments (id, shipment_code, from_warehouse_id, distributor_id, driver_name, driver_phone, vehicle_number, temp_c, status, dispatch_time, estimated_arrival) VALUES
('77771111-7777-1111-7777-111111111111', 'SHIP-DL-HCM-09', '99991111-9999-1111-9999-111111111111', '44444444-4444-4444-4444-444444444444', 'Nguyễn Tấn Lực', '0918889999', '49C-188.42 (Xe lạnh IoT)', 4.2, 'IN_TRANSIT', CURRENT_TIMESTAMP - INTERVAL '3 hours', CURRENT_TIMESTAMP + INTERVAL '4 hours');

INSERT INTO tracking_events (shipment_id, location, temperature_c, humidity_percent, status, note) VALUES
('77771111-7777-1111-7777-111111111111', 'Trạm thu phí Đèo Bảo Lộc, QL20', 4.1, 82.0, 'ON_SCHEDULE', 'Xe duy trì nhiệt độ mát tiêu chuẩn 4.1°C, tốc độ 55km/h');

-- 8.7 Dữ liệu Khách hàng (Voucher, Đơn hàng, Tích điểm, QR)
INSERT INTO vouchers (id, code, title, discount_type, discount_value, min_order_value, max_discount, usage_limit, membership_tier, start_date, end_date, active) VALUES
('10101010-1010-1010-1010-101010101010', 'AGRI30', 'Giảm 30% Đơn Hàng Nông Sản Đầu Tiên', 'PERCENT', 30, 100000, 50000, 500, 'ALL', CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', TRUE),
('20202020-2020-2020-2020-202020202020', 'FREESHIP', 'Miễn Phí Vận Chuyển Đơn Hàng Từ 150k', 'FREESHIP', 25000, 150000, 25000, 1000, 'ALL', CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', TRUE),
('30303030-3030-3030-3030-303030303030', 'VIPGOLD', 'Đặc Quyền Hội Viên Vàng - Giảm Trực Tiếp 50k', 'FIXED', 50000, 300000, 50000, 200, 'GOLD', CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', TRUE);

INSERT INTO orders (id, order_code, customer_id, customer_name, phone, shipping_address, subtotal, discount_amount, shipping_fee, total_amount, voucher_code, payment_method, payment_status, order_status, points_earned) VALUES
('88881111-8888-1111-8888-111111111111', 'ORD-8841', '55555555-5555-5555-5555-555555555555', 'Lê Quang Minh', '0988776655', 'Số 123 Cầu Giấy, Hà Nội', 250000, 39000, 25000, 236000, 'AGRI30', 'VNPAY', 'PAID', 'SHIPPING', 28),
('88882222-8888-2222-8888-222222222222', 'ORD-8790', '55555555-5555-5555-5555-555555555555', 'Lê Quang Minh', '0988776655', 'Số 123 Cầu Giấy, Hà Nội', 200000, 25000, 25000, 200000, 'FREESHIP', 'COD', 'PAID', 'DELIVERED', 24);

INSERT INTO order_items (order_id, product_id, product_name, unit, unit_price, quantity, total_price) VALUES
('88881111-8888-1111-8888-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'Xà Lách Lô Lô Xanh Thủy Canh', 'KG', 35000, 2, 70000),
('88881111-8888-1111-8888-111111111111', 'dddd2222-dddd-2222-dddd-222222222222', 'Dâu Tây New Zealand Mộc Châu', 'HỘP 500G', 180000, 1, 180000),
('88882222-8888-2222-8888-222222222222', 'dddd3333-dddd-3333-dddd-333333333333', 'Cam Sành Hàm Yên Tép Vàng Mọng Nước', 'KG', 45000, 2, 90000),
('88882222-8888-2222-8888-222222222222', 'dddd6666-dddd-6666-dddd-666666666666', 'Bơ Sáp 034 Đặc Sản Cao Nguyên', 'KG', 75000, 1, 75000);

INSERT INTO loyalty_memberships (user_id, current_points, lifetime_points, tier, total_spent) VALUES
('55555555-5555-5555-5555-555555555555', 1250, 2800, 'GOLD', 436000),
('55555555-5555-5555-5555-555555555556', 1250, 2800, 'GOLD', 436000);

INSERT INTO loyalty_transactions (user_id, points, transaction_type, description) VALUES
('55555555-5555-5555-5555-555555555555', 28, 'EARNED', 'Tích điểm đơn hàng #ORD-8841'),
('55555555-5555-5555-5555-555555555555', 24, 'EARNED', 'Tích điểm đơn hàng #ORD-8790'),
('55555555-5555-5555-5555-555555555555', 200, 'BONUS', 'Thưởng đặc quyền sinh nhật hội viên Gold');

INSERT INTO product_reviews (product_id, user_id, customer_name, rating, comment) VALUES
('dddd1111-dddd-1111-dddd-111111111111', '55555555-5555-5555-5555-555555555555', 'Lê Quang Minh', 5, 'Rau xà lách cực kỳ tươi ngon, giòn ngọt, đóng gói rất kỹ lưỡng và giao hàng nhanh!'),
('dddd2222-dddd-2222-dddd-222222222222', '55555555-5555-5555-5555-555555555555', 'Lê Quang Minh', 5, 'Dâu tây thơm nức, quả đều và không hề dập nát, rất đáng tiền!');

INSERT INTO qr_codes (code, harvest_lot_id, product_id, farm_name, harvest_date, cert_standard, scan_count) VALUES
('AGRI-QR-XL-2026', 'eeee1111-eeee-1111-eeee-111111111111', 'dddd1111-dddd-1111-dddd-111111111111', 'Nông Trại Xanh Thủy Canh Đà Lạt', CURRENT_DATE - INTERVAL '2 days', 'VietGAP', 145),
('AGRI-QR-DT-2026', 'eeee2222-eeee-2222-eeee-222222222222', 'dddd2222-dddd-2222-dddd-222222222222', 'Hợp Tác Xã Nông Sản Sạch Mộc Châu', CURRENT_DATE - INTERVAL '1 days', 'GlobalGAP', 210);

-- 8.8 Dữ liệu AI Dự Báo & Cảnh Báo
INSERT INTO ai_demand_forecasts (product_id, forecast_date, predicted_quantity, actual_quantity, confidence_score) VALUES
('dddd1111-dddd-1111-dddd-111111111111', CURRENT_DATE + INTERVAL '1 days', 85.0, NULL, 0.94),
('dddd2222-dddd-2222-dddd-222222222222', CURRENT_DATE + INTERVAL '1 days', 110.0, NULL, 0.91);

INSERT INTO ai_risk_alerts (harvest_lot_id, risk_type, severity, description, recommended_action) VALUES
('eeee1111-eeee-1111-eeee-111111111111', 'EXPIRY_RISK', 'MEDIUM', 'Lô xà lách LOT-XL-2026-08 còn 6 ngày hạn dùng, tồn kho 320kg', 'Khuyến nghị ưu tiên xuất kho FEFO và áp dụng Voucher giảm giá 15%');

-- ==============================================================================
-- HOÀN TẤT KHỞI TẠO ĐẦY ĐỦ 5 ACTORS & TOÀN BỘ CƠ SỞ DỮ LIỆU!
-- ==============================================================================
