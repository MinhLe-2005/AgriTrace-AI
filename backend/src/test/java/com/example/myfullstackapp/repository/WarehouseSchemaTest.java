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
            statement.execute(Files.readString(Path.of("../docs/warehouse/P04_schema.sql")));
            statement.execute(Files.readString(Path.of("../docs/warehouse/P05_schema.sql")));
            statement.execute(Files.readString(Path.of("../docs/warehouse/P06_schema.sql")));
            statement.execute(
                    Files.readString(Path.of("../docs/warehouse/P08_monitoring_schema.sql")));
            statement.execute(
                    Files.readString(Path.of("../docs/warehouse/P09_heatmap_schema.sql")));
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
            UUID location = UUID.randomUUID(),
                    balance = UUID.randomUUID(),
                    reservation = UUID.randomUUID();
            statement.execute(
                    "INSERT INTO"
                        + " storage_locations(id,warehouse_id,code,name,capacity_tons,temp_target_c,humidity_target)"
                        + " VALUES('"
                            + location
                            + "','"
                            + warehouse
                            + "','A','A',1,4,85)");
            statement.execute(
                    "INSERT INTO"
                        + " wh_stock_balances(id,warehouse_id,location_id,lot_id,product_id,lot_code,expiry_date,quantity_kg)"
                        + " VALUES('"
                            + balance
                            + "','"
                            + warehouse
                            + "','"
                            + location
                            + "','1','Rau','L1',CURRENT_DATE+7,60)");
            statement.execute(
                    "INSERT INTO"
                        + " wh_reservations(id,warehouse_id,order_id,expires_at,created_by,status)"
                        + " VALUES('"
                            + reservation
                            + "','"
                            + warehouse
                            + "',1,CURRENT_TIMESTAMP+INTERVAL '1 hour','staff','CONSUMED')");
            statement.execute(
                    "INSERT INTO wh_reservation_lines(reservation_id,balance_id,quantity_kg)"
                            + " VALUES('"
                            + reservation
                            + "','"
                            + balance
                            + "',100)");
            UUID unshippedBalance = UUID.randomUUID();
            statement.execute(
                    "INSERT INTO"
                        + " wh_stock_balances(id,warehouse_id,location_id,lot_id,product_id,lot_code,expiry_date,quantity_kg)"
                        + " VALUES('"
                            + unshippedBalance
                            + "','"
                            + warehouse
                            + "','"
                            + location
                            + "','2','Rau','L2',CURRENT_DATE+7,25)");
            statement.execute(
                    "INSERT INTO wh_reservation_lines(reservation_id,balance_id,quantity_kg)"
                        + " VALUES('"
                            + reservation
                            + "','"
                            + unshippedBalance
                            + "',25)");
            UUID outbound = UUID.randomUUID(), transfer = UUID.randomUUID();
            statement.execute(
                    "INSERT INTO"
                            + " wh_documents(id,warehouse_id,type,status,reservation_id,created_by)"
                            + " VALUES('"
                            + outbound
                            + "','"
                            + warehouse
                            + "','OUTBOUND','CONFIRMED','"
                            + reservation
                            + "','staff')");
            statement.execute(
                    "INSERT INTO wh_document_lines(id,document_id,lot_id,location_id,quantity_kg)"
                            + " VALUES(gen_random_uuid(),'"
                            + outbound
                            + "','1','"
                            + location
                            + "',40)");
            statement.execute(
                    "INSERT INTO"
                        + " wh_documents(id,warehouse_id,target_warehouse_id,type,status,created_by)"
                        + " VALUES('"
                            + transfer
                            + "','"
                            + warehouse
                            + "','"
                            + warehouse
                            + "','TRANSFER','IN_TRANSIT','staff')");
            statement.execute(
                    "INSERT INTO"
                        + " wh_document_lines(id,document_id,lot_id,location_id,target_location_id,quantity_kg)"
                        + " VALUES(gen_random_uuid(),'"
                            + transfer
                            + "','1','"
                            + location
                            + "','"
                            + location
                            + "',20)");
            for (int run = 0; run < 2; run++) {
                statement.execute(
                        Files.readString(
                                Path.of("../docs/warehouse/P10_partial_reservations.sql")));
                statement.execute(
                        Files.readString(Path.of("../docs/warehouse/P11_transfer_receiving.sql")));
                statement.execute(
                        Files.readString(Path.of("../docs/warehouse/P12_inventory_indexes.sql")));
            }
            try (var rows =
                    statement.executeQuery(
                            "select dispatched_kg from wh_reservation_lines where reservation_id='"
                                    + reservation
                                    + "' AND balance_id='"
                                    + balance
                                    + "'")) {
                assertTrue(rows.next());
                assertEquals(0, new java.math.BigDecimal("40").compareTo(rows.getBigDecimal(1)));
            }
            try (var rows =
                    statement.executeQuery(
                            "select dispatched_kg from wh_reservation_lines where balance_id='"
                                    + unshippedBalance
                                    + "'")) {
                assertTrue(rows.next());
                assertEquals(0, rows.getBigDecimal(1).signum());
            }
            try (var rows =
                    statement.executeQuery(
                            "select status from wh_reservations where id='" + reservation + "'")) {
                assertTrue(rows.next());
                assertEquals("ACTIVE", rows.getString(1));
            }
            assertThrows(
                    SQLException.class,
                    () ->
                            statement.execute(
                                    "update wh_reservation_lines set dispatched_kg=101 where"
                                            + " reservation_id='"
                                            + reservation
                                            + "'"));
            assertThrows(
                    SQLException.class,
                    () ->
                            statement.execute(
                                    "update wh_document_lines set received_quantity_kg=21 where"
                                            + " document_id='"
                                            + transfer
                                            + "'"));
            try (var rows =
                    statement.executeQuery(
                            "select in_transit from wh_documents where id='" + transfer + "'")) {
                assertTrue(rows.next());
                assertTrue(rows.getBoolean(1));
            }
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
