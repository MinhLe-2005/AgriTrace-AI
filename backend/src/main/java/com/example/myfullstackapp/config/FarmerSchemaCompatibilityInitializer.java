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
