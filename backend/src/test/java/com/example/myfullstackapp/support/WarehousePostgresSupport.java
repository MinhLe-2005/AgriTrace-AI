package com.example.myfullstackapp.support;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.*;

/** Only disposable loopback databases named warehouse_test_* may be used. */
public final class WarehousePostgresSupport {
    private static PostgreSQLContainer<?> postgres;

    private WarehousePostgresSupport() {}

    public static boolean available() {
        String url = System.getenv("WAREHOUSE_TEST_DATABASE_URL");
        if (url != null && !url.isBlank()) {
            validate(url);
            return true;
        }
        return DockerClientFactory.instance().isDockerAvailable();
    }

    private static void validate(String url) {
        if (!url.matches(
                "jdbc:postgresql://(127\\.0\\.0\\.1|localhost):[0-9]+/warehouse_test_[a-z0-9_]+"))
            throw new IllegalArgumentException(
                    "Warehouse tests require a disposable loopback warehouse_test_* database");
    }

    public static synchronized void configure(DynamicPropertyRegistry registry, String suffix) {
        String base = System.getenv("WAREHOUSE_TEST_DATABASE_URL");
        String user =
                System.getenv()
                        .getOrDefault("WAREHOUSE_TEST_DATABASE_USER", "warehouse_test_admin");
        String password = System.getenv().getOrDefault("WAREHOUSE_TEST_DATABASE_PASSWORD", "");
        if (base == null || base.isBlank()) {
            if (postgres == null) {
                postgres = new PostgreSQLContainer<>("postgres:16-alpine");
                postgres.start();
                Runtime.getRuntime().addShutdownHook(new Thread(postgres::stop));
            }
            base = postgres.getJdbcUrl().replaceAll("/[^/]+$", "/warehouse_test_run");
            user = postgres.getUsername();
            password = postgres.getPassword();
        }
        validate(base);
        if (!suffix.matches("[a-z0-9_]+"))
            throw new IllegalArgumentException("Invalid database suffix");
        String url = base + "_" + suffix;
        String database = url.substring(url.lastIndexOf('/') + 1);
        try (var connection =
                DriverManager.getConnection(
                        base.substring(0, base.lastIndexOf('/') + 1) + "postgres",
                        user,
                        password)) {
            try (var check =
                    connection.prepareStatement("select 1 from pg_database where datname=?")) {
                check.setString(1, database);
                try (var rows = check.executeQuery()) {
                    if (!rows.next())
                        try (var create = connection.createStatement()) {
                            create.execute("CREATE DATABASE " + database);
                        }
                }
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Cannot prepare isolated Warehouse test database", ex);
        }
        String jdbcUrl = url, jdbcUser = user, jdbcPassword = password;
        registry.add("spring.datasource.url", () -> jdbcUrl);
        registry.add("spring.datasource.username", () -> jdbcUser);
        registry.add("spring.datasource.password", () -> jdbcPassword);
    }
}
