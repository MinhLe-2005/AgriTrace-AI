package com.example.myfullstackapp.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Ensures existing PostgreSQL column agri_products.image is widened to TEXT
 * so product DataURLs/long image URLs persist when Hibernate ddl-auto=update
 * runs against a pre-existing database schema.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FarmerSchemaCompatibilityInitializer implements ApplicationRunner {

    private final ObjectProvider<DataSource> dataSourceProvider;

    @Override
    public void run(ApplicationArguments args) {
        DataSource dataSource = dataSourceProvider.getIfAvailable();
        if (dataSource == null) {
            return;
        }
        try (Connection conn = dataSource.getConnection()) {
            String dbName = conn.getMetaData().getDatabaseProductName();
            if (dbName != null && dbName.toLowerCase().contains("postgres")) {
                try (Statement st = conn.createStatement()) {
                    st.execute("ALTER TABLE IF EXISTS agri_products ALTER COLUMN image TYPE TEXT");
                    st.execute("ALTER TABLE IF EXISTS agri_order_items ALTER COLUMN image TYPE TEXT");
                    st.execute("ALTER TABLE IF EXISTS agri_orders ALTER COLUMN refund_photo_url TYPE TEXT");
                    st.execute("ALTER TABLE IF EXISTS agri_orders ALTER COLUMN refund_note TYPE TEXT");
                    st.execute("ALTER TABLE IF EXISTS agri_orders ADD COLUMN IF NOT EXISTS admin_support_requested BOOLEAN DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS agri_orders ADD COLUMN IF NOT EXISTS admin_support_requested_at TIMESTAMPTZ");
                    st.execute("ALTER TABLE IF EXISTS agri_order_messages ALTER COLUMN image_url TYPE TEXT");
                    st.execute("ALTER TABLE IF EXISTS agri_order_messages ADD COLUMN IF NOT EXISTS channel VARCHAR(16) DEFAULT 'SHOP'");
                    st.execute("UPDATE agri_order_messages SET channel = 'ADMIN' WHERE (channel IS NULL OR channel = '') AND UPPER(sender_role) = 'ADMIN'");
                    st.execute("UPDATE agri_order_messages SET channel = 'SHOP' WHERE channel IS NULL OR channel = ''");
                    st.execute("ALTER TABLE IF EXISTS verification_requests DROP CONSTRAINT IF EXISTS verification_requests_type_check");
                    st.execute("ALTER TABLE IF EXISTS verification_requests ALTER COLUMN document_url TYPE TEXT");
                    st.execute("INSERT INTO roles (name) VALUES ('ADMIN'), ('USER'), ('FARMER'), ('WAREHOUSE'), ('DISTRIBUTOR'), ('CUSTOMER') ON CONFLICT (name) DO NOTHING");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS self_locked BOOLEAN NOT NULL DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS admin_locked BOOLEAN NOT NULL DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(500)");
                    st.execute("ALTER TABLE IF EXISTS agri_harvest_lots ADD COLUMN IF NOT EXISTS transport_destination VARCHAR(255)");
                    st.execute("ALTER TABLE IF EXISTS agri_harvest_lots ADD COLUMN IF NOT EXISTS transport_status VARCHAR(64) DEFAULT 'Chưa vận chuyển'");
                    st.execute("ALTER TABLE IF EXISTS agri_harvest_lots ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64)");
                    st.execute("ALTER TABLE IF EXISTS agri_harvest_lots ADD COLUMN IF NOT EXISTS farm_code VARCHAR(64)");
                    st.execute("ALTER TABLE IF EXISTS agri_farming_logs ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64)");
                    st.execute("ALTER TABLE IF EXISTS agri_products ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64)");
                    st.execute("ALTER TABLE IF EXISTS agri_products ADD COLUMN IF NOT EXISTS farm_code VARCHAR(64)");
                    st.execute("ALTER TABLE IF EXISTS agri_farmer_certificates ADD COLUMN IF NOT EXISTS owner_id VARCHAR(64)");
                    st.execute("UPDATE agri_harvest_lots SET owner_id = 'farmer_hung' WHERE owner_id IS NULL");
                    st.execute("UPDATE agri_farming_logs SET owner_id = 'farmer_hung' WHERE owner_id IS NULL");
                    st.execute("UPDATE agri_products SET owner_id = 'farmer_hung' WHERE owner_id IS NULL");
                    st.execute("UPDATE agri_farmer_certificates SET owner_id = 'farmer_hung' WHERE owner_id IS NULL");
                    st.execute("UPDATE agri_harvest_lots SET farm_code = 'NT-DL-01' WHERE (farm_code IS NULL OR farm_code = '') AND farm_name ILIKE '%Đà Lạt%'");
                    st.execute("UPDATE agri_harvest_lots SET farm_code = 'NT-DT-02' WHERE (farm_code IS NULL OR farm_code = '') AND farm_name ILIKE '%Cao Lãnh%'");
                    st.execute("UPDATE agri_harvest_lots SET farm_code = 'NT-MC-03' WHERE (farm_code IS NULL OR farm_code = '') AND farm_name ILIKE '%Mộc Châu%'");
                    st.execute("ALTER TABLE IF EXISTS wh_reservation_lines ADD COLUMN IF NOT EXISTS dispatched_kg NUMERIC(14,3) NOT NULL DEFAULT 0");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS in_transit BOOLEAN NOT NULL DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS received_by VARCHAR(254)");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS receiving_note VARCHAR(500)");
                    st.execute("ALTER TABLE IF EXISTS wh_document_lines ADD COLUMN IF NOT EXISTS received_quantity_kg NUMERIC(14,3) NOT NULL DEFAULT 0");
                    st.execute("UPDATE agri_orders SET created_at = NOW() - INTERVAL '5 days' WHERE created_at IS NULL");
                    st.execute("UPDATE agri_products SET name = 'Dâu Tây New Zealand Mộc Châu' WHERE name ILIKE 'Dau Tay New Zealand%'");
                    st.execute("UPDATE agri_products SET farm = 'Hợp Tác Xã Nông Sản Sạch Mộc Châu' WHERE farm ILIKE '%Nong San Sach Moc Chau%'");
                    st.execute("UPDATE agri_order_items SET name = 'Dâu Tây New Zealand Mộc Châu' WHERE name ILIKE 'Dau Tay New Zealand%'");
                    st.execute("UPDATE agri_order_items SET origin = 'Hợp Tác Xã Nông Sản Sạch Mộc Châu' WHERE origin ILIKE '%Nong San Sach Moc Chau%'");
                    st.execute("ALTER TABLE IF EXISTS agri_reviews ADD COLUMN IF NOT EXISTS likes_count INT DEFAULT 0");
                    st.execute("ALTER TABLE IF EXISTS agri_reviews ADD COLUMN IF NOT EXISTS reply VARCHAR(1000)");
                    st.execute("ALTER TABLE IF EXISTS agri_reviews ADD COLUMN IF NOT EXISTS reply_author VARCHAR(128)");
                    st.execute("ALTER TABLE IF EXISTS agri_reviews ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ");
                    st.execute("ALTER TABLE IF EXISTS agri_reviews ALTER COLUMN comment TYPE TEXT");
                    st.execute("ALTER TABLE IF EXISTS agri_vouchers ADD COLUMN IF NOT EXISTS owner_email VARCHAR(254)");
                    st.execute("CREATE TABLE IF NOT EXISTS user_vouchers (id BIGSERIAL PRIMARY KEY, user_email VARCHAR(254) NOT NULL, voucher_code VARCHAR(64) NOT NULL, saved_at TIMESTAMP NOT NULL DEFAULT NOW(), CONSTRAINT uk_user_voucher_email_code UNIQUE (user_email, voucher_code))");
                    st.execute("INSERT INTO agri_vouchers (code, title, description, badge, badge_color, discount, min_order, exp, active) VALUES "
                            + "('FREESHIP25', 'Miễn Phí Vận Chuyển Xe Lạnh Toàn Quốc', 'Giảm tối đa 25.000đ phí giao hàng xe lạnh bảo quản nông sản tươi', 'FREESHIP', 'bg-emerald-100 text-emerald-800', '25000', '100000', '31/12/2026', TRUE), "
                            + "('MUAVU10', 'Ưu Đãi Trái Cây & Nông Sản Chính Vụ', 'Giảm 10% đơn hàng nông sản tươi vào vụ thu hoạch', 'Giảm 10%', 'bg-amber-100 text-amber-800', '10%', '150000', '31/12/2026', TRUE), "
                            + "('CHAOBANMOI', 'Voucher Chào Mừng Khách Hàng Mới', 'Giảm trực tiếp 20.000đ cho khách hàng mới trên AgriTrace', 'Giảm 20K', 'bg-blue-100 text-blue-800', '20000', '120000', '31/12/2026', TRUE), "
                            + "('VANGVIP5', 'Đặc Quyền Thành Viên Hạng Vàng & Kim Cương', 'Chiết khấu 5% dành cho hội viên thân thiết hạng Vàng trở lên', 'VIP -5%', 'bg-amber-100 text-amber-800', '5%', '300000', '31/12/2026', TRUE), "
                            + "('RAUSACH50', 'Siêu Sale Nông Sản Đầu Tuần', 'Giảm 15% cho đơn hàng rau củ hữu cơ VietGAP', 'Giảm 15%', 'bg-rose-100 text-rose-800', '15%', '250000', '31/12/2026', TRUE), "
                            + "('VIETGAP10', 'Khuyến Mãi Nông Sản VietGAP', 'Giảm 10% cho tất cả nông sản đạt chứng nhận VietGAP', 'VietGAP 10%', 'bg-emerald-100 text-emerald-800', '10%', '120000', '31/12/2026', TRUE), "
                            + "('VIP-FREESHIP', 'Voucher Freeship Xe Lạnh Hội Viên', 'Đặc quyền miễn phí ship xe lạnh 2°C - 5°C hàng tháng', 'FREESHIP 25K', 'bg-emerald-100 text-emerald-800', '25000', '100000', '31/12/2026', TRUE), "
                            + "('VIP-GOLD5', 'Voucher Giảm 5% Toàn Giỏ Hàng VIP', 'Chiết khấu độc quyền cho thành viên đạt hạng Vàng & Kim Cương', 'GIẢM 5%', 'bg-amber-100 text-amber-800', '5%', '300000', '31/12/2026', TRUE) "
                            + "ON CONFLICT (code) DO NOTHING");
                    st.execute("UPDATE agri_vouchers v SET owner_email = u.email FROM users u WHERE v.owner_email IS NULL AND v.description ILIKE ('%dành cho ' || u.full_name) AND (SELECT COUNT(*) FROM users u2 WHERE LOWER(u2.full_name) = LOWER(u.full_name)) = 1");
                    st.execute("INSERT INTO user_vouchers (user_email, voucher_code, saved_at) SELECT LOWER(owner_email), UPPER(code), NOW() FROM agri_vouchers WHERE owner_email IS NOT NULL AND active = TRUE ON CONFLICT (user_email, voucher_code) DO NOTHING");
                    st.execute("DELETE FROM loyalty_transactions t1 USING loyalty_transactions t2 WHERE t1.user_id = t2.user_id AND t1.transaction_type = 'BONUS' AND t2.transaction_type = 'BONUS' AND t1.description = t2.description AND t1.description ILIKE '%Đánh giá đơn #%' AND (t1.created_at > t2.created_at OR (t1.created_at = t2.created_at AND t1.id > t2.id))");
                    st.execute("UPDATE loyalty_memberships m SET current_points = COALESCE((SELECT SUM(points) FROM loyalty_transactions t WHERE t.user_id = m.user_id), 0), lifetime_points = COALESCE((SELECT SUM(CASE WHEN points > 0 THEN points ELSE 0 END) FROM loyalty_transactions t WHERE t.user_id = m.user_id), 0)");
                    st.execute("UPDATE agri_products SET harvest = 'Thu hoạch sáng sớm theo đơn' WHERE name ILIKE '%Dâu Tây%'");
                    st.execute("UPDATE agri_products SET harvest = 'Thu hoạch đúng độ già 8.5 tuổi' WHERE name ILIKE '%Bơ Sáp%'");
                    st.execute("UPDATE agri_products SET harvest = 'Thu hoạch thủy canh hằng ngày' WHERE name ILIKE '%Xà Lách%'");
                    st.execute("UPDATE agri_products SET harvest = 'Thu hoạch tươi sáng sớm' WHERE name ILIKE '%Cải Xoăn%' OR name ILIKE '%Kale%'");
                    st.execute("UPDATE agri_products SET harvest = 'Thu hoạch lứa chín mọng' WHERE name ILIKE '%Cà Chua%'");
                    st.execute("UPDATE agri_products SET harvest = 'Chính vụ thu hoạch tươi' WHERE name ILIKE '%Cam Sành%'");
                    st.execute("UPDATE agri_products SET harvest = 'Thu hoạch tươi theo đơn' WHERE harvest = 'Hôm nay, 05:30 Sáng' OR harvest IS NULL");
                    log.info("Database schema compatibility check & Sprint 3 column auto-migration completed.");
                }
            }
        } catch (Exception ex) {
            log.debug("Skipped agri_products.image schema widening check: {}", ex.getMessage());
        }
    }
}
