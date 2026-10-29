package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.example.myfullstackapp.support.WarehousePostgresSupport;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIf;

import java.nio.file.*;
import java.sql.*;
import java.util.*;
import java.util.function.Supplier;

@EnabledIf("databaseAvailable")
class WarehouseSchemaTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @Test
    void reviewedSqlCreatesWarehouseTablesAndRejectsInvalidWrites() throws Exception {
        Map<String, Supplier<Object>> properties = new HashMap<>();
        WarehousePostgresSupport.configure(properties::put, "schema");
        try (var connection =
                        DriverManager.getConnection(
                                (String) properties.get("spring.datasource.url").get(),
                                (String) properties.get("spring.datasource.username").get(),
                                (String) properties.get("spring.datasource.password").get());
                var statement = connection.createStatement()) {
            assertTrue(connection.getCatalog().startsWith("warehouse_test_"));
            statement.execute(
                    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; CREATE TABLE users(id UUID"
                        + " PRIMARY KEY)");
            statement.execute(Files.readString(Path.of("../docs/warehouse/P01_schema.sql")));
            statement.execute(Files.readString(Path.of("../docs/warehouse/P02_schema.sql")));
            try (var rows =
                    statement.executeQuery(
                            "select count(*) from information_schema.tables where"
                                + " table_schema='public' and table_name in"
                                + " ('warehouses','storage_locations','wh_documents','wh_document_lines','wh_stock_balances','wh_stock_movements','wh_reservations','wh_reservation_lines')")) {
                rows.next();
                assertEquals(8, rows.getInt(1));
            }
            UUID warehouse = UUID.randomUUID();
            statement.execute(
                    "INSERT INTO warehouses(id,name,location,capacity_tons) VALUES('"
                            + warehouse
                            + "','Test','HCM',1)");
            assertThrows(
                    SQLException.class,
                    () ->
                            statement.execute(
                                    "INSERT INTO warehouses(id,name,location,capacity_tons)"
                                        + " VALUES(gen_random_uuid(),'Invalid','HCM',-1)"));
            assertThrows(
                    SQLException.class,
                    () ->
                            statement.execute(
                                    "INSERT INTO"
                                        + " storage_locations(id,warehouse_id,code,name,capacity_tons,temp_target_c,humidity_target)"
                                        + " VALUES(gen_random_uuid(),'"
                                            + warehouse
                                            + "','lower','Bad',1,4,85)"));
        }
    }
}
