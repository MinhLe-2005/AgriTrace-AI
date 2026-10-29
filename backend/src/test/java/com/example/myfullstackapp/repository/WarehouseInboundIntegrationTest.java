package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.entity.WarehouseDocument.Type;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.mapper.*;
import com.example.myfullstackapp.service.*;
import com.example.myfullstackapp.support.WarehousePostgresSupport;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.*;
import org.springframework.transaction.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;

@DataJpaTest(
        properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
@ActiveProfiles("warehouse-test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
    WarehouseService.class,
    StorageLocationService.class,
    CapacityValidationService.class,
    WarehouseMapperImpl.class,
    StorageLocationMapperImpl.class,
    InventoryService.class,
    WarehouseDocumentService.class,
    WarehouseLotQuery.class,
    FefoAllocationService.class,
    StockReservationService.class,
    WarehouseOrderQuery.class,
    WarehouseWeightService.class
})
@EnabledIf("databaseAvailable")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehouseInboundIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "p02");
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private WarehouseDocumentService receipts;
    @Autowired
    private InventoryService inventory;
    @Autowired
    private JdbcTemplate jdbc;
    private UUID warehouseId;
    private UUID locationId;

    @BeforeEach
    void setUp() {
        jdbc.execute(
                "CREATE TABLE IF NOT EXISTS agri_harvest_lots(id bigint primary key, product"
                    + " varchar(255),code varchar(64),expiry_date varchar(64),qty varchar(32),unit"
                    + " varchar(32),status varchar(64))");
        jdbc.execute(
                "TRUNCATE"
                    + " wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,storage_locations,warehouses,agri_harvest_lots"
                    + " CASCADE");
        warehouseId = warehouse();
        locationId = location(warehouseId, "A", new BigDecimal("1.00"));
        lot(1, "1000", "kg", InventoryService.today().plusDays(5), "Đã duyệt xuất kho");
    }

    private UUID warehouse() {
        return warehouses
                .create(
                        new WarehouseCreateRequest(
                                "Kho test",
                                "HCM",
                                null,
                                new BigDecimal("10"),
                                new BigDecimal("4"),
                                new BigDecimal("85")))
                .id();
    }

    private UUID location(UUID warehouse, String code, BigDecimal tons) {
        return locations
                .create(
                        warehouse,
                        new StorageLocationCreateRequest(
                                code, code, tons, new BigDecimal("4"), new BigDecimal("85")))
                .id();
    }

    private void lot(long id, String qty, String unit, LocalDate expiry, String status) {
        jdbc.update(
                "INSERT INTO agri_harvest_lots VALUES(?,?,?,?,?,?,?)",
                id,
                "Rau test",
                "LOT-" + id,
                expiry.toString(),
                qty,
                unit,
                status);
    }

    private DocumentView draft(UUID warehouse, LineInput... lines) {
        return receipts.create(
                warehouse,
                Type.INBOUND,
                new DocumentInput(null, null, "Kiểm thử", List.of(lines)),
                "staff@test");
    }

    private LineInput line(String lot, UUID location, String kg) {
        return new LineInput(lot, location, null, new BigDecimal(kg));
    }

    private long movementCount() {
        return jdbc.queryForObject("select count(*) from wh_stock_movements", Long.class);
    }

    @Test
    void draftDoesNotChangeStockAndRepeatedConfirmationIsIdempotent() {
        var receipt = draft(warehouseId, line("1", locationId, "100"));
        assertTrue(inventory.getBalances(warehouseId).isEmpty());
        receipts.confirm(warehouseId, receipt.id(), "staff@test");
        receipts.confirm(warehouseId, receipt.id(), "staff@test");
        assertEquals(1, movementCount());
        assertEquals(
                0,
                new BigDecimal("100")
                        .compareTo(inventory.getBalances(warehouseId).getFirst().quantityKg()));
        assertEquals("staff@test", receipts.get(warehouseId, receipt.id()).confirmedBy());
    }

    @Test
    void cancellationCannotBeConfirmed() {
        var receipt = draft(warehouseId, line("1", locationId, "100"));
        receipts.cancel(warehouseId, receipt.id());
        assertThrows(
                ConflictException.class,
                () -> receipts.confirm(warehouseId, receipt.id(), "staff"));
        assertEquals(0, movementCount());
    }

    @Test
    void canonicalFarmerIdsCannotBypassDuplicateLineValidation() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        draft(
                                warehouseId,
                                line("1", locationId, "100"),
                                line("01", locationId, "100")));
        assertEquals(0, movementCount());
    }

    @Test
    void ineligibleOrExpiredLotsNeverEnterInventory() {
        lot(2, "10", "kg", InventoryService.today().minusDays(1), "Đã duyệt xuất kho");
        lot(3, "10", "kg", InventoryService.today().plusDays(1), "Chờ duyệt xuất kho");
        assertThrows(ConflictException.class, () -> draft(warehouseId, line("2", locationId, "1")));
        assertThrows(ConflictException.class, () -> draft(warehouseId, line("3", locationId, "1")));
        assertEquals(0, movementCount());
    }

    @Test
    void inactiveWarehouseIsRecheckedAtConfirmation() {
        var receipt = draft(warehouseId, line("1", locationId, "100"));
        warehouses.setActive(warehouseId, false);
        assertThrows(
                ConflictException.class,
                () -> receipts.confirm(warehouseId, receipt.id(), "staff"));
        assertEquals(0, movementCount());
    }

    @Test
    void multilineCapacityFailureRollsBackEarlierLinesAndLedger() {
        lot(2, "2000", "kg", InventoryService.today().plusDays(5), "Đã duyệt xuất kho");
        var receipt =
                draft(warehouseId, line("1", locationId, "800"), line("2", locationId, "400"));
        assertThrows(
                ConflictException.class,
                () -> receipts.confirm(warehouseId, receipt.id(), "staff"));
        assertEquals(0, movementCount());
        assertTrue(inventory.getBalances(warehouseId).isEmpty());
        assertEquals(
                WarehouseDocument.Status.DRAFT, receipts.get(warehouseId, receipt.id()).status());
    }

    @Test
    void totalHarvestQuantityIsEnforcedAcrossReceiptLines() {
        UUID second = location(warehouseId, "B", new BigDecimal("1"));
        var receipt = draft(warehouseId, line("1", locationId, "600"), line("1", second, "600"));
        assertThrows(
                ConflictException.class,
                () -> receipts.confirm(warehouseId, receipt.id(), "staff"));
        assertEquals(0, movementCount());
    }

    @Test
    void weightConversionUsesTonAndGramContracts() {
        lot(2, "1", "tấn", InventoryService.today().plusDays(5), "Đã duyệt xuất kho");
        lot(3, "500", "g", InventoryService.today().plusDays(5), "Đã duyệt xuất kho");
        var receipt =
                draft(warehouseId, line("2", locationId, "500"), line("3", locationId, "0.400"));
        receipts.confirm(warehouseId, receipt.id(), "staff");
        assertEquals(2, movementCount());
        assertThrows(
                ConflictException.class,
                () -> {
                    var excess = draft(warehouseId, line("3", locationId, "0.200"));
                    receipts.confirm(warehouseId, excess.id(), "staff");
                });
    }

    @Test
    void unsupportedUnitsAndAmbiguousQuantitiesFailWithIntegrationError() {
        lot(2, "20", "hộp", InventoryService.today().plusDays(5), "Đã duyệt xuất kho");
        lot(3, "1,000", "kg", InventoryService.today().plusDays(5), "Đã duyệt xuất kho");
        assertThrows(
                WarehouseIntegrationException.class,
                () -> draft(warehouseId, line("2", locationId, "1")));
        assertThrows(
                WarehouseIntegrationException.class,
                () -> draft(warehouseId, line("3", locationId, "1")));
    }

    @Test
    void duplicateConfirmationUnderConcurrencyWritesOneMovement() throws Exception {
        var receipt = draft(warehouseId, line("1", locationId, "100"));
        runTogether(
                () -> receipts.confirm(warehouseId, receipt.id(), "staff1"),
                () -> receipts.confirm(warehouseId, receipt.id(), "staff2"));
        assertEquals(1, movementCount());
    }

    @Test
    void sameHarvestCannotBeOverReceivedAcrossWarehouses() throws Exception {
        UUID other = warehouse();
        UUID otherLocation = location(other, "B", BigDecimal.ONE);
        var first = draft(warehouseId, line("1", locationId, "600"));
        var second = draft(other, line("1", otherLocation, "600"));
        boolean[] results =
                runTogether(
                        () -> receipts.confirm(warehouseId, first.id(), "staff1"),
                        () -> receipts.confirm(other, second.id(), "staff2"));
        assertNotEquals(results[0], results[1]);
        assertEquals(1, movementCount());
        assertEquals(
                0,
                new BigDecimal("600")
                        .compareTo(
                                jdbc.queryForObject(
                                        "select sum(quantity_kg) from wh_stock_balances",
                                        BigDecimal.class)));
    }

    private boolean[] runTogether(Callable<?> first, Callable<?> second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Boolean> a = () -> attempt(first, ready, start),
                    b = () -> attempt(second, ready, start);
            var one = executor.submit(a);
            var two = executor.submit(b);
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            return new boolean[] {one.get(20, TimeUnit.SECONDS), two.get(20, TimeUnit.SECONDS)};
        } finally {
            start.countDown();
        }
    }

    private boolean attempt(Callable<?> call, CountDownLatch ready, CountDownLatch start)
            throws Exception {
        ready.countDown();
        if (!start.await(5, TimeUnit.SECONDS)) throw new TimeoutException();
        try {
            call.call();
            return true;
        } catch (ConflictException expected) {
            return false;
        }
    }
}
