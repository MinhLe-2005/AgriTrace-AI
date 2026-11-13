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
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS self_locked BOOLEAN NOT NULL DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS admin_locked BOOLEAN NOT NULL DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(500)");
                    st.execute("ALTER TABLE IF EXISTS agri_harvest_lots ADD COLUMN IF NOT EXISTS transport_destination VARCHAR(255)");
                    st.execute("ALTER TABLE IF EXISTS agri_harvest_lots ADD COLUMN IF NOT EXISTS transport_status VARCHAR(64) DEFAULT 'Chưa vận chuyển'");
                    st.execute("ALTER TABLE IF EXISTS wh_reservation_lines ADD COLUMN IF NOT EXISTS dispatched_kg NUMERIC(14,3) NOT NULL DEFAULT 0");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS in_transit BOOLEAN NOT NULL DEFAULT FALSE");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS received_by VARCHAR(254)");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ");
                    st.execute("ALTER TABLE IF EXISTS wh_documents ADD COLUMN IF NOT EXISTS receiving_note VARCHAR(500)");
                    st.execute("ALTER TABLE IF EXISTS wh_document_lines ADD COLUMN IF NOT EXISTS received_quantity_kg NUMERIC(14,3) NOT NULL DEFAULT 0");
                    log.info("Database schema compatibility check & Sprint 3 column auto-migration completed.");
                }
            }
        } catch (Exception ex) {
            log.debug("Skipped agri_products.image schema widening check: {}", ex.getMessage());
        }
    }
}
