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
                }
            }
        } catch (Exception ex) {
            log.debug("Skipped agri_products.image schema widening check: {}", ex.getMessage());
        }
    }
}
