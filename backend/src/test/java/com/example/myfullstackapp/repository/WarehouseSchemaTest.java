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
            statement.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
            statement.execute(
                    Files.readString(
                            Path.of("src/main/resources/db/migration/V1__create_core_schema.sql")));
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
                statement.execute(
                        Files.readString(
                                Path.of("../docs/warehouse/P13_legacy_schema_alignment.sql")));
                statement.execute(
                        Files.readString(
                                Path.of(
                                        "src/main/resources/db/migration/V5__restore_core_lookup_indexes.sql")));
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

    @Test
    void upgradesLegacyChecksBeforeExpiredPartialBackfillAndPreservesForeignKeys()
            throws Exception {
        try (var connection = legacyDatabase("schema_legacy");
                var statement = connection.createStatement()) {
            statement.execute(
                    """
INSERT INTO warehouses(id,name,location,capacity_tons)
VALUES ('00000000-0000-0000-0000-000000000001','Test','HCM',1);
INSERT INTO storage_locations(id,warehouse_id,code,name,capacity_tons,temp_target_c,humidity_target)
VALUES ('00000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000001','A','A',1,4,85);
INSERT INTO wh_stock_balances(id,warehouse_id,location_id,lot_id,product_id,lot_code,expiry_date,quantity_kg)
VALUES ('00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002','1','Rau','L1',CURRENT_DATE+7,60);
INSERT INTO wh_reservations(id,warehouse_id,order_id,expires_at,created_by,status)
VALUES ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000001',
    1,CURRENT_TIMESTAMP-INTERVAL '1 hour','staff','CONSUMED');
INSERT INTO wh_reservation_lines(reservation_id,balance_id,quantity_kg)
VALUES ('00000000-0000-0000-0000-000000000004','00000000-0000-0000-0000-000000000003',100);
INSERT INTO wh_documents(id,warehouse_id,type,status,reservation_id,created_by)
VALUES ('00000000-0000-0000-0000-000000000005','00000000-0000-0000-0000-000000000001',
    'OUTBOUND','CONFIRMED','00000000-0000-0000-0000-000000000004','staff');
INSERT INTO wh_document_lines(id,document_id,lot_id,location_id,quantity_kg)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000005','1',
    '00000000-0000-0000-0000-000000000002',40);
""");
            assertSqlState(statement, "23514", "UPDATE wh_documents SET status='IN_TRANSIT'");
            assertSqlState(statement, "23514", "UPDATE wh_reservations SET status='EXPIRED'");
            for (int run = 0; run < 2; run++) {
                upgrade(statement);
            }
            try (var rows =
                    statement.executeQuery(
                            """
                            SELECT r.status,l.dispatched_kg,b.quantity_kg FROM wh_reservations r
                            JOIN wh_reservation_lines l ON l.reservation_id=r.id
                            JOIN wh_stock_balances b ON b.id=l.balance_id
                            """)) {
                assertTrue(rows.next());
                assertEquals("EXPIRED", rows.getString(1));
                assertEquals(0, new java.math.BigDecimal("40").compareTo(rows.getBigDecimal(2)));
                assertEquals(0, new java.math.BigDecimal("60").compareTo(rows.getBigDecimal(3)));
            }
            statement.execute(
                    "UPDATE wh_documents SET type='TRANSFER',status='IN_TRANSIT',in_transit=TRUE");
            statement.execute("UPDATE wh_document_lines SET received_quantity_kg=quantity_kg");
            statement.execute("UPDATE wh_documents SET status='RECEIVED',in_transit=FALSE");
            assertSqlState(statement, "23514", "UPDATE wh_documents SET status='UNKNOWN'");
            assertSqlState(statement, "23514", "UPDATE wh_reservations SET status='UNKNOWN'");
            assertSqlState(statement, "23514", "UPDATE warehouses SET capacity_tons=0");
            assertSqlState(statement, "23514", "UPDATE warehouses SET humidity_target=101");
            assertSqlState(
                    statement,
                    "23514",
                    "UPDATE wh_reservation_lines SET quantity_kg=0,dispatched_kg=0");
            assertSqlState(
                    statement, "23503", "UPDATE wh_documents SET warehouse_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_documents SET target_warehouse_id=gen_random_uuid()");
            assertSqlState(
                    statement, "23503", "UPDATE wh_documents SET reservation_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_document_lines SET location_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_document_lines SET target_location_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_stock_balances SET warehouse_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_stock_balances SET location_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_reservations SET warehouse_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_reservation_lines SET balance_id=gen_random_uuid()");
            statement.execute(
                    """
INSERT INTO wh_stock_movements(id,warehouse_id,location_id,lot_id,document_id,type,delta_kg,balance_after_kg,actor)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002','1','00000000-0000-0000-0000-000000000005',
    'OUTBOUND',-40,60,'staff');
INSERT INTO wh_unit_conversions(id,warehouse_id,product_key,unit,kg_per_unit,updated_by)
VALUES (gen_random_uuid(),'00000000-0000-0000-0000-000000000001','Rau','BOX',1,'staff');
""");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_stock_movements SET warehouse_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_stock_movements SET location_id=gen_random_uuid()");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_stock_movements SET document_id=gen_random_uuid()");
            assertSqlState(statement, "23514", "UPDATE wh_stock_movements SET balance_after_kg=-1");
            assertSqlState(
                    statement,
                    "23503",
                    "UPDATE wh_unit_conversions SET warehouse_id=gen_random_uuid()");
            try (var rows =
                    statement.executeQuery(
                            """
                            SELECT count(*) FROM pg_indexes WHERE schemaname='public'
                            AND indexname IN ('idx_projects_owner_id','idx_refresh_tokens_user_id')
                            """)) {
                assertTrue(rows.next());
                assertEquals(2, rows.getInt(1));
            }
        }
    }

    @Test
    void alignmentRejectsOrphanedLegacyDataAndRollsBackAllConstraints() throws Exception {
        try (var connection = legacyDatabase("schema_orphan");
                var statement = connection.createStatement()) {
            statement.execute(
                    """
INSERT INTO wh_unit_conversions(id,warehouse_id,product_key,unit,kg_per_unit,updated_by)
VALUES (gen_random_uuid(),gen_random_uuid(),'Rau','BOX',1,'staff')
""");
            assertEquals(
                    "23503",
                    assertThrows(
                                    SQLException.class,
                                    () ->
                                            statement.execute(
                                                    Files.readString(
                                                            Path.of(
                                                                    "../docs/warehouse/P13_legacy_schema_alignment.sql"))))
                            .getSQLState());
            statement.execute("ROLLBACK");
            try (var rows =
                    statement.executeQuery(
                            """
SELECT (SELECT count(*) FROM wh_unit_conversions),
    (SELECT count(*) FROM pg_constraint WHERE conrelid='wh_documents'::regclass AND contype='f')
""")) {
                assertTrue(rows.next());
                assertEquals(
                        1,
                        rows.getInt(1),
                        "An invalid legacy row must never be deleted automatically");
                assertEquals(0, rows.getInt(2), "Earlier DDL must roll back when validation fails");
            }
        }
    }

    private Connection legacyDatabase(String suffix) throws Exception {
        Map<String, Supplier<Object>> properties = new HashMap<>();
        WarehousePostgresSupport.configure(properties::put, suffix);
        var connection =
                DriverManager.getConnection(
                        (String) properties.get("spring.datasource.url").get(),
                        (String) properties.get("spring.datasource.username").get(),
                        (String) properties.get("spring.datasource.password").get());
        try (var statement = connection.createStatement()) {
            assertTrue(connection.getCatalog().startsWith("warehouse_test_"));
            statement.execute("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
            statement.execute(
                    Files.readString(
                            Path.of("src/main/resources/db/migration/V1__create_core_schema.sql")));
            for (var file : List.of("P01_schema.sql", "P02_schema.sql", "P04_schema.sql")) {
                statement.execute(Files.readString(Path.of("../docs/warehouse/" + file)));
            }
            // Reproduce Hibernate-era Supabase: only entity association FKs existed here.
            statement.execute(
                    """
DO $$ DECLARE item RECORD; BEGIN
    FOR item IN SELECT conrelid::regclass AS table_name,conname FROM pg_constraint
        WHERE contype='f' AND conrelid IN ('wh_documents'::regclass,'wh_document_lines'::regclass,
            'wh_stock_balances'::regclass,'wh_stock_movements'::regclass,
            'wh_reservations'::regclass,'wh_reservation_lines'::regclass,'wh_unit_conversions'::regclass)
        AND NOT (conrelid='wh_document_lines'::regclass AND confrelid='wh_documents'::regclass)
        AND NOT (conrelid='wh_reservation_lines'::regclass AND confrelid='wh_reservations'::regclass)
    LOOP EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',item.table_name,item.conname); END LOOP;
END $$;
ALTER TABLE warehouses DROP CONSTRAINT ck_warehouses_capacity;
ALTER TABLE warehouses DROP CONSTRAINT ck_warehouses_conditions;
ALTER TABLE wh_stock_movements DROP CONSTRAINT wh_stock_movements_balance_after_kg_check;
ALTER TABLE wh_reservation_lines DROP CONSTRAINT wh_reservation_lines_quantity_kg_check;
ALTER TABLE wh_reservations ADD CONSTRAINT wh_reservations_status_check
    CHECK(status IN ('ACTIVE','RELEASED','CONSUMED'));
ALTER TABLE wh_documents ADD CONSTRAINT wh_documents_status_check
    CHECK(status IN ('DRAFT','CONFIRMED','CANCELLED','HANDED_OVER'));
DROP INDEX idx_projects_owner_id;
DROP INDEX idx_refresh_tokens_user_id;
""");
            return connection;
        } catch (Exception failure) {
            connection.close();
            throw failure;
        }
    }

    private void upgrade(Statement statement) throws Exception {
        for (var file :
                List.of(
                        "P10_partial_reservations.sql",
                        "P11_transfer_receiving.sql",
                        "P12_inventory_indexes.sql",
                        "P13_legacy_schema_alignment.sql")) {
            statement.execute(Files.readString(Path.of("../docs/warehouse/" + file)));
        }
        statement.execute(
                Files.readString(
                        Path.of(
                                "src/main/resources/db/migration/V5__restore_core_lookup_indexes.sql")));
    }

    private void assertSqlState(Statement statement, String expected, String sql) {
        assertEquals(
                expected,
                assertThrows(SQLException.class, () -> statement.execute(sql)).getSQLState());
    }
}
