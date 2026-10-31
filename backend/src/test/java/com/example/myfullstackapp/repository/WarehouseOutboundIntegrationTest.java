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
import java.time.*;
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
class WarehouseOutboundIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "p04");
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private InventoryService inventory;
    @Autowired
    private WarehouseDocumentService documents;
    @Autowired
    private StockReservationService reservations;
    @Autowired
    private WarehouseWeightService weights;
    @Autowired
    private JdbcTemplate jdbc;
    private UUID warehouseId, locationId;

    @BeforeEach
    void setUp() {
        jdbc.execute(
                "CREATE TABLE IF NOT EXISTS agri_harvest_lots(id bigint primary key,product"
                    + " varchar(255),code varchar(64),expiry_date varchar(64),qty varchar(32),unit"
                    + " varchar(32),status varchar(64))");
        jdbc.execute(
                "TRUNCATE"
                    + " wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,wh_unit_conversions,storage_locations,warehouses,agri_harvest_lots,agri_order_items,agri_orders"
                    + " CASCADE");
        warehouseId = warehouse();
        locationId = location(warehouseId);
        for (long lot = 1; lot <= 2; lot++)
            jdbc.update(
                    "INSERT INTO agri_harvest_lots VALUES(?,'Rau',?,?,'1000','kg','Đã duyệt xuất"
                            + " kho')",
                    lot,
                    "LOT-" + lot,
                    InventoryService.today().plusDays(lot * 2).toString());
        var receipt =
                documents.create(
                        warehouseId,
                        Type.INBOUND,
                        new DocumentInput(
                                null, null, "Seed", List.of(line("1", "100"), line("2", "100"))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        order(1L, "150 kg");
    }

    private UUID warehouse() {
        return warehouses
                .create(
                        new WarehouseCreateRequest(
                                "Test",
                                "HCM",
                                null,
                                BigDecimal.TEN,
                                new BigDecimal("4"),
                                new BigDecimal("85")))
                .id();
    }

    private UUID location(UUID id) {
        return locations
                .create(
                        id,
                        new StorageLocationCreateRequest(
                                "A",
                                "A",
                                BigDecimal.ONE,
                                new BigDecimal("4"),
                                new BigDecimal("85")))
                .id();
    }

    private LineInput line(String lot, String kg) {
        return new LineInput(lot, locationId, null, new BigDecimal(kg));
    }

    private void order(long id, String qty) {
        jdbc.update(
                "INSERT INTO"
                    + " agri_orders(id,order_code,receiver_name,receiver_phone,receiver_address,status)"
                    + " VALUES(?,?,?,?,?,'SHIPPING')",
                id,
                "ORDER-" + id,
                "Test",
                "000",
                "Test");
        jdbc.update(
                "INSERT INTO agri_order_items(order_id,name,qty,price) VALUES(?,'Rau',?,1)",
                id,
                qty);
    }

    private ReserveInput request(Long order, String kg) {
        return new ReserveInput(order, "Rau", new BigDecimal(kg), 30);
    }

    private DocumentView outbound(ReservationView reservation) {
        return documents.create(
                warehouseId,
                Type.OUTBOUND,
                new DocumentInput(
                        null,
                        reservation.id(),
                        "Order",
                        reservation.lines().stream()
                                .map(
                                        a ->
                                                new LineInput(
                                                        a.lotId(),
                                                        a.locationId(),
                                                        null,
                                                        a.quantityKg()))
                                .toList()),
                "staff");
    }

    @Test
    void fefoAllocatesEarlierExpiryAndRejectsManualSkipping() {
        var proposal =
                reservations.preview(warehouseId, new FefoInput("Rau", new BigDecimal("150")));
        assertEquals("1", proposal.getFirst().lotId());
        assertEquals(0, new BigDecimal("100").compareTo(proposal.getFirst().quantityKg()));
        var wrong =
                documents.create(
                        warehouseId,
                        Type.OUTBOUND,
                        new DocumentInput(null, null, "Wrong FEFO", List.of(line("2", "50"))),
                        "staff");
        assertThrows(
                ConflictException.class, () -> documents.confirm(warehouseId, wrong.id(), "staff"));
        assertEquals(
                0,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where type='OUTBOUND'",
                        Long.class));
    }

    @Test
    void reservationIsConsumedOnceAndOrderCannotBeOverfilled() {
        var reservation = reservations.create(warehouseId, request(1L, "150"), "staff");
        assertEquals(
                0,
                new BigDecimal("50")
                        .compareTo(
                                inventory.getBalances(warehouseId).stream()
                                        .map(BalanceView::availableKg)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)));
        var receipt = outbound(reservation);
        documents.confirm(warehouseId, receipt.id(), "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        assertEquals("CONSUMED", reservations.list(warehouseId, 0).getFirst().status());
        assertEquals(
                2,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where type='OUTBOUND'",
                        Long.class));
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
    }

    @Test
    void releaseReturnsAvailabilityAndConsumedReservationCannotBeReleased() {
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        reservations.release(warehouseId, reservation.id());
        assertEquals(
                0,
                new BigDecimal("200")
                        .compareTo(
                                inventory.getBalances(warehouseId).stream()
                                        .map(BalanceView::availableKg)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)));
        var next = reservations.create(warehouseId, request(1L, "100"), "staff");
        documents.confirm(warehouseId, outbound(next).id(), "staff");
        assertThrows(ConflictException.class, () -> reservations.release(warehouseId, next.id()));
    }

    @Test
    void expiredReservationCannotBeDispatched() {
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        var receipt = outbound(reservation);
        jdbc.update(
                "UPDATE wh_reservations SET expires_at=CURRENT_TIMESTAMP-interval '1 minute' WHERE"
                        + " id=?",
                reservation.id());
        assertThrows(
                ConflictException.class,
                () -> documents.confirm(warehouseId, receipt.id(), "staff"));
        assertEquals(
                0,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where type='OUTBOUND'",
                        Long.class));
    }

    @Test
    void changedOrderQuantityAndProductMismatchAreRejected() {
        assertThrows(
                ConflictException.class,
                () ->
                        reservations.create(
                                warehouseId,
                                new ReserveInput(1L, "Other", BigDecimal.ONE, 30),
                                "staff"));
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        var receipt = outbound(reservation);
        jdbc.update("UPDATE agri_order_items SET qty='50 kg' WHERE order_id=1");
        assertThrows(
                ConflictException.class,
                () -> documents.confirm(warehouseId, receipt.id(), "staff"));
    }

    @Test
    void measuredPackagingConversionIsRequiredAndAudited() {
        jdbc.update("UPDATE agri_order_items SET qty='4 bó' WHERE order_id=1");
        assertThrows(
                WarehouseIntegrationException.class,
                () -> reservations.create(warehouseId, request(1L, "2"), "staff"));
        var conversion =
                weights.save(
                        warehouseId,
                        new UnitConversionInput("Rau", "bó", new BigDecimal("0.5")),
                        "warehouse-manager");
        assertEquals("warehouse-manager", conversion.updatedBy());
        assertNotNull(reservations.create(warehouseId, request(1L, "2"), "staff").id());
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
    }

    @Test
    void closedOrdersAndQuarantinedStockCannotBeAllocated() {
        jdbc.update("UPDATE agri_orders SET status='CANCELLED' WHERE id=1");
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
        jdbc.update("UPDATE agri_orders SET status='SHIPPING' WHERE id=1");
        jdbc.update("UPDATE wh_stock_balances SET held=true");
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
    }

    @Test
    void handoverRecordsActorAndIsIdempotentForSameReference() {
        var reserved = reservations.create(warehouseId, request(1L, "100"), "staff");
        var receipt = outbound(reserved);
        documents.confirm(warehouseId, receipt.id(), "staff");
        var handed =
                documents.handover(
                        warehouseId, receipt.id(), new HandoverInput("REF-001"), "handover-staff");
        assertEquals("handover-staff", handed.handoverBy());
        assertNotNull(handed.handedOverAt());
        assertEquals(
                WarehouseDocument.Status.HANDED_OVER,
                documents
                        .handover(warehouseId, receipt.id(), new HandoverInput("REF-001"), "other")
                        .status());
        assertThrows(
                ConflictException.class,
                () ->
                        documents.handover(
                                warehouseId, receipt.id(), new HandoverInput("OTHER"), "staff"));
    }

    @Test
    void concurrentDispatchesCannotConsumeOneReservationTwice() throws Exception {
        var reserved = reservations.create(warehouseId, request(1L, "150"), "staff");
        var first = outbound(reserved);
        var second = outbound(reserved);
        var results =
                together(
                        () -> documents.confirm(warehouseId, first.id(), "one"),
                        () -> documents.confirm(warehouseId, second.id(), "two"));
        assertNotEquals(results[0], results[1]);
        assertEquals(
                2,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where type='OUTBOUND'",
                        Long.class));
    }

    @Test
    void concurrentWarehousesCannotOverReserveOneOrder() throws Exception {
        UUID other = warehouse(), otherLocation = location(other);
        var receipt =
                documents.create(
                        other,
                        Type.INBOUND,
                        new DocumentInput(
                                null,
                                null,
                                "Seed",
                                List.of(
                                        new LineInput(
                                                "1", otherLocation, null, new BigDecimal("100")))),
                        "staff");
        documents.confirm(other, receipt.id(), "staff");
        var results =
                together(
                        () -> reservations.create(warehouseId, request(1L, "100"), "one"),
                        () -> reservations.create(other, request(1L, "100"), "two"));
        assertNotEquals(results[0], results[1]);
        assertEquals(1, jdbc.queryForObject("select count(*) from wh_reservations", Long.class));
    }

    private boolean[] together(Callable<?> first, Callable<?> second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a = executor.submit(() -> attempt(first, ready, start));
            var b = executor.submit(() -> attempt(second, ready, start));
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            return new boolean[] {a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS)};
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
