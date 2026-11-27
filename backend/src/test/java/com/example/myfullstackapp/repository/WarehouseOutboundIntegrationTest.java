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
    WarehouseWeightService.class, BatchWarehouseTraceQuery.class
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
    @Autowired private BatchWarehouseTraceQuery trace;
    @Autowired private ShipmentRepository shipments;
    @Autowired private WarehouseLotQuery lotLookup;
    private UUID warehouseId, locationId;

    @BeforeEach
    void setUp() {
        jdbc.execute(
                "TRUNCATE"
                    + " wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,wh_unit_conversions,storage_locations,warehouses,agri_harvest_lots,agri_order_items,agri_orders"
                    + " CASCADE");
        warehouseId = warehouse();
        locationId = location(warehouseId);
        for (long lot = 1; lot <= 2; lot++)
            WarehousePostgresSupport.insertHarvestLot(
                    jdbc,
                    lot,
                    "Rau",
                    "LOT-" + lot,
                    InventoryService.today().plusDays(lot * 2),
                    "1000",
                    "kg",
                    "Đã duyệt xuất kho");
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

    @Test
    void exactQrAndStockSearchReachRowsBeyondTheInitialPage() {
        jdbc.update("""
                insert into agri_harvest_lots(id,code,product,expiry_date,qty,unit,status,harvest_date,created_at)
                select n, 'Q-'||n, 'Rau', current_date+10, '1','kg','Đã duyệt xuất kho',current_date,now()
                from generate_series(3000,3501) n
                """);
        assertEquals("1", lotLookup.eligibleByCode("LOT-1").id());
        jdbc.update("""
                insert into wh_stock_balances(id,warehouse_id,location_id,lot_id,lot_code,product_id,expiry_date,quantity_kg,held,version,received_at)
                select gen_random_uuid(),?, ?, n::text,'Q-'||n,'Rau',current_date+10,1,false,0,now()
                from generate_series(3000,3501) n
                """, warehouseId, locationId);
        assertTrue(inventory.search(warehouseId, "", 0, 500).hasNext());
        assertEquals("Q-3501", inventory.search(warehouseId, "q-3501", 0, 100).rows().getFirst().lotCode());
        var labels = inventory.labels(warehouseId, new InventoryLabelRequest(List.of(), List.of("3501")));
        assertEquals("Q-3501", labels.getFirst().lotCode());
    }

    @Test
    void refundedOrderCannotReserveOrConfirmEarlierDraft() {
        assertEquals(1L, reservations.lookupOrder(warehouseId, "order-1").id());
        var draft = outbound(reservations.create(warehouseId, request(1L, "8"), "staff"));
        jdbc.update("update agri_orders set status='REFUNDED' where id=1");
        assertThrows(ConflictException.class, () -> reservations.lookupOrder(warehouseId, "1"));
        assertThrows(ConflictException.class, () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
        assertThrows(ConflictException.class, () -> documents.confirm(warehouseId, draft.id(), "staff"));
        assertEquals(0, jdbc.queryForObject("select count(*) from wh_stock_movements where type='OUTBOUND'", Integer.class));
    }

    @Test
    void oneHandoverLinksBothFefoLotsWithTheirOwnWeights() {
        String code = "SHIP-" + UUID.randomUUID();
        shipments.saveAndFlush(Shipment.builder().shipmentCode(code).orderCodes("ORDER-1")
                .driverName("Test").vehicleNumber("Test").origin("A").destination("B").productSummary("Rau").build());
        var draft = outbound(reservations.create(warehouseId, request(1L, "150"), "staff"));
        documents.confirm(warehouseId, draft.id(), "staff");
        assertTrue(trace.dispatches("LOT-1").isEmpty());
        documents.handover(warehouseId, draft.id(), new HandoverInput("BB-1", code), "staff");
        assertEquals(0, trace.dispatches("LOT-1").getFirst().quantityKg().compareTo(new BigDecimal("100")));
        assertEquals(0, trace.dispatches("LOT-2").getFirst().quantityKg().compareTo(new BigDecimal("50")));
        assertEquals(trace.dispatches("LOT-1").getFirst().shipmentId(), trace.dispatches("LOT-2").getFirst().shipmentId());
        assertNull(trace.warehouseStops("LOT-2").getFirst().measurement());
        assertEquals("1", lotLookup.eligibleByCode("lot-1").id());
        assertEquals(1, inventory.search(warehouseId, "lot-2", 0, 1).rows().size());
        assertTrue(inventory.search(warehouseId, "", 0, 1).hasNext());
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
    void partialDispatchKeepsOnlyTheRemainderReserved() {
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        var first =
                documents.create(
                        warehouseId,
                        Type.OUTBOUND,
                        new DocumentInput(
                                null, reservation.id(), "Partial", List.of(line("1", "40"))),
                        "staff");
        documents.confirm(warehouseId, first.id(), "staff");
        documents.confirm(warehouseId, first.id(), "staff");
        var partial = reservations.list(warehouseId, 0).getFirst();
        assertEquals("PARTIALLY_CONSUMED", partial.status());
        assertEquals(0, new BigDecimal("40").compareTo(partial.lines().getFirst().dispatchedKg()));
        assertEquals(
                0,
                new BigDecimal("60")
                        .compareTo(
                                inventory.getBalances(warehouseId).stream()
                                        .map(BalanceView::reservedKg)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)));
        var second =
                documents.create(
                        warehouseId,
                        Type.OUTBOUND,
                        new DocumentInput(
                                null, reservation.id(), "Remainder", List.of(line("1", "60"))),
                        "staff");
        documents.confirm(warehouseId, second.id(), "staff");
        assertEquals("CONSUMED", reservations.list(warehouseId, 0).getFirst().status());
        reservations.create(warehouseId, request(1L, "50"), "staff");
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
    }

    @Test
    void sameDayExpiryIsAvailableForFefoReservationAndDispatch() {
        jdbc.update(
                "update agri_harvest_lots set expiry_date=? where id=1",
                InventoryService.today().toString());
        jdbc.update(
                "update wh_stock_balances set expiry_date=? where warehouse_id=? and lot_id='1'",
                InventoryService.today(),
                warehouseId);
        var current =
                inventory.getBalances(warehouseId).stream()
                        .filter(b -> b.lotId().equals("1"))
                        .findFirst()
                        .orElseThrow();
        assertEquals(0, new BigDecimal("100").compareTo(current.availableKg()));
        assertEquals(
                "1",
                reservations
                        .preview(warehouseId, new FefoInput("Rau", new BigDecimal("100")))
                        .getFirst()
                        .lotId());
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        var receipt = outbound(reservation);
        documents.confirm(warehouseId, receipt.id(), "staff");
        assertEquals("CONSUMED", reservations.list(warehouseId, 0).getFirst().status());
    }

    @Test
    void yesterdayExpiryIsExcludedFromAvailabilityAndAllocation() {
        jdbc.update(
                "update agri_harvest_lots set expiry_date=? where id=1",
                InventoryService.today().minusDays(1).toString());
        jdbc.update(
                "update wh_stock_balances set expiry_date=? where warehouse_id=? and lot_id='1'",
                InventoryService.today().minusDays(1),
                warehouseId);
        assertEquals(
                0,
                inventory.getBalances(warehouseId).stream()
                        .filter(b -> b.lotId().equals("1"))
                        .findFirst()
                        .orElseThrow()
                        .availableKg()
                        .signum());
        assertEquals(
                "2",
                reservations
                        .preview(warehouseId, new FefoInput("Rau", new BigDecimal("100")))
                        .getFirst()
                        .lotId());
        assertThrows(
                ConflictException.class,
                () ->
                        documents.create(
                                warehouseId,
                                Type.OUTBOUND,
                                new DocumentInput(null, null, "Expired", List.of(line("1", "1"))),
                                "staff"));
    }

    @Test
    void releasingOrExpiringAPartialReservationStillCountsDispatchedStock() {
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        var first =
                documents.create(
                        warehouseId,
                        Type.OUTBOUND,
                        new DocumentInput(
                                null, reservation.id(), "Partial", List.of(line("1", "40"))),
                        "staff");
        documents.confirm(warehouseId, first.id(), "staff");
        reservations.release(warehouseId, reservation.id());
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "111"), "staff"));
        reservations.create(warehouseId, request(1L, "110"), "staff");
    }

    @Test
    void expiredPartialReservationRetainsTheDispatchedOrderQuantity() {
        var reservation = reservations.create(warehouseId, request(1L, "100"), "staff");
        var receipt =
                documents.create(
                        warehouseId,
                        Type.OUTBOUND,
                        new DocumentInput(
                                null, reservation.id(), "Partial", List.of(line("1", "40"))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        jdbc.update(
                "update wh_reservations set expires_at=? where id=?",
                java.sql.Timestamp.from(Instant.now().minusSeconds(1)),
                reservation.id());
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "111"), "staff"));
        reservations.create(warehouseId, request(1L, "110"), "staff");
    }

    @Test
    void reconciliationProtectsValidAllocationsAndDoesNotLoseUnfilledDemand() {
        var reservation = reservations.create(warehouseId, request(1L, "150"), "staff");
        jdbc.update(
                "update wh_stock_balances set held=true where warehouse_id=? and lot_id='1'",
                warehouseId);
        var reconciled = reservations.reconcile(warehouseId, reservation.id());
        assertEquals(
                0,
                new BigDecimal("150")
                        .compareTo(
                                reconciled.lines().stream()
                                        .map(AllocationView::quantityKg)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)));
        assertEquals(
                0,
                new BigDecimal("100")
                        .compareTo(
                                reconciled.lines().stream()
                                        .filter(l -> l.lotId().equals("2"))
                                        .map(AllocationView::quantityKg)
                                        .reduce(BigDecimal.ZERO, BigDecimal::add)));
        var first =
                documents.create(
                        warehouseId,
                        Type.OUTBOUND,
                        new DocumentInput(
                                null, reservation.id(), "Eligible part", List.of(line("2", "100"))),
                        "staff");
        documents.confirm(warehouseId, first.id(), "staff");
        assertEquals("PARTIALLY_CONSUMED", reservations.list(warehouseId, 0).getFirst().status());
        assertThrows(
                ConflictException.class,
                () -> reservations.create(warehouseId, request(1L, "1"), "staff"));
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
    void linkShipmentAfterPaperHandoverKeepsOriginalAuditAndDispatch() {
        String code = "SHIP-" + UUID.randomUUID();
        for (String order : List.of("ORDER-1", "ORDER-2")) {
            shipments.saveAndFlush(Shipment.builder().shipmentCode(code + order).orderCodes(order)
                    .driverName("Test").vehicleNumber("Test").origin("A").destination("B").productSummary("Rau").build());
        }
        var draft = outbound(reservations.create(warehouseId, request(1L, "12"), "staff"));
        documents.confirm(warehouseId, draft.id(), "staff");
        documents.handover(warehouseId, draft.id(), new HandoverInput("BB-2"), "sender");
        var original = documents.get(warehouseId, draft.id());
        assertTrue(trace.dispatches("LOT-1").isEmpty());
        var wrong = new HandoverInput("BB-2", code + "ORDER-2");
        assertThrows(ConflictException.class, () -> documents.handover(warehouseId, draft.id(), wrong, "other"));
        var valid = new HandoverInput("BB-2", code + "ORDER-1");
        var linked = documents.handover(warehouseId, draft.id(), valid, "other");
        assertEquals(original.handedOverAt(), linked.handedOverAt());
        assertEquals("sender", linked.handoverBy());
        assertEquals(valid.shipmentCode(), documents.handover(warehouseId, draft.id(), valid, "retry").shipmentCode());
        assertThrows(ConflictException.class, () -> documents.handover(warehouseId, draft.id(), wrong, "other"));
        assertEquals(0, trace.dispatches("LOT-1").getFirst().quantityKg().compareTo(new BigDecimal("12")));
        assertEquals(1, jdbc.queryForObject("select count(*) from wh_stock_movements where type='OUTBOUND' and warehouse_id=?", Integer.class, warehouseId));
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
