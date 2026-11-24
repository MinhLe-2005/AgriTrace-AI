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
    WarehouseWeightService.class,
    WarehouseQualityService.class
})
@EnabledIf("databaseAvailable")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehouseAuditIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "p05");
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
    private WarehouseQualityService quality;
    @Autowired
    private JdbcTemplate jdbc;
    private UUID warehouseId, locationId, other, otherLocation;

    @BeforeEach
    void setUp() {
        jdbc.execute(
                "TRUNCATE"
                    + " wh_quality_inspections,wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,wh_unit_conversions,storage_locations,warehouses,agri_harvest_lots,agri_order_items,agri_orders"
                    + " CASCADE");
        warehouseId = warehouse();
        locationId = location(warehouseId);
        other = warehouse();
        otherLocation = location(other);
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                1L,
                "Rau",
                "LOT-1",
                InventoryService.today().plusDays(5),
                "1000",
                "kg",
                "Đã duyệt xuất kho");
        var receipt = create(warehouseId, Type.INBOUND, null, locationId, null, "100");
        documents.confirm(warehouseId, receipt.id(), "staff");
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

    private DocumentView create(
            UUID warehouse,
            Type type,
            UUID target,
            UUID sourceLocation,
            UUID targetLocation,
            String kg) {
        return documents.create(
                warehouse,
                type,
                new DocumentInput(
                        target,
                        null,
                        "Kết quả kiểm đếm / chuyển kho",
                        List.of(
                                new LineInput(
                                        "1", sourceLocation, targetLocation, new BigDecimal(kg)))),
                "staff");
    }

    private BigDecimal total(UUID warehouse) {
        return inventory.getBalances(warehouse).stream()
                .map(BalanceView::quantityKg)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private DocumentView transit(String kg) {
        return documents.create(
                warehouseId,
                Type.TRANSFER,
                new DocumentInput(
                        other,
                        null,
                        "Transport",
                        List.of(new LineInput("1", locationId, otherLocation, new BigDecimal(kg))),
                        true),
                "sender");
    }

    private TransferReceiveInput receiveInput(
            DocumentView transfer, String cumulative, String note) {
        return new TransferReceiveInput(
                List.of(
                        new TransferReceiveLine(
                                transfer.lines().getFirst().id(), new BigDecimal(cumulative))),
                note);
    }

    @Test
    void transitIsVisibleAtDestinationAndPartialReceiptsAreIdempotent() {
        var transfer = transit("100");
        assertThrows(ConflictException.class, () -> documents.cancel(other, transfer.id()));
        documents.confirm(warehouseId, transfer.id(), "sender");
        assertEquals(
                WarehouseDocument.Status.IN_TRANSIT,
                documents.confirm(warehouseId, transfer.id(), "sender").status());
        assertEquals(0, total(warehouseId).signum());
        assertEquals(0, total(other).signum());
        assertTrue(documents.list(other, 0).stream().anyMatch(d -> d.id().equals(transfer.id())));
        assertEquals(transfer.id(), documents.get(other, transfer.id()).id());
        UUID unrelated = warehouse();
        assertThrows(
                ResourceNotFoundException.class, () -> documents.get(unrelated, transfer.id()));
        documents.handover(warehouseId, transfer.id(), new HandoverInput("TR-001"), "sender");
        assertEquals(
                "sender",
                documents
                        .handover(warehouseId, transfer.id(), new HandoverInput("TR-001"), "retry")
                        .handoverBy());
        var partial =
                documents.receiveTransfer(
                        other,
                        transfer.id(),
                        receiveInput(transfer, "98", "2 kg pending"),
                        "receiver");
        assertEquals(WarehouseDocument.Status.IN_TRANSIT, partial.status());
        assertEquals(0, new BigDecimal("98").compareTo(total(other)));
        documents.receiveTransfer(
                other, transfer.id(), receiveInput(transfer, "98", "retry"), "receiver");
        assertThrows(
                ConflictException.class,
                () ->
                        documents.receiveTransfer(
                                other,
                                transfer.id(),
                                receiveInput(transfer, "101", "invalid"),
                                "receiver"));
        assertEquals(0, new BigDecimal("98").compareTo(total(other)));
        var received =
                documents.receiveTransfer(
                        other,
                        transfer.id(),
                        receiveInput(transfer, "100", "Complete"),
                        "receiver");
        assertEquals(WarehouseDocument.Status.RECEIVED, received.status());
        documents.receiveTransfer(
                other, transfer.id(), receiveInput(transfer, "100", "retry"), "receiver");
        assertEquals(0, new BigDecimal("100").compareTo(total(other)));
        assertEquals(
                2L,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where document_id=? and"
                                + " type='TRANSFER_IN'",
                        Long.class,
                        transfer.id()));
    }

    @Test
    void receiptCapacityFailureKeepsGoodsInTransit() {
        var transfer = transit("100");
        documents.confirm(warehouseId, transfer.id(), "sender");
        locations.update(
                other,
                otherLocation,
                new StorageLocationUpdateRequest(
                        "A",
                        "A",
                        new BigDecimal("0.05"),
                        new BigDecimal("4"),
                        new BigDecimal("85")));
        assertThrows(
                ConflictException.class,
                () ->
                        documents.receiveTransfer(
                                other,
                                transfer.id(),
                                receiveInput(transfer, "100", "Full"),
                                "receiver"));
        assertEquals(0, total(other).signum());
        assertEquals(
                WarehouseDocument.Status.IN_TRANSIT, documents.get(other, transfer.id()).status());
    }

    @Test
    void concurrentRepeatedReceiptsCannotCreditDestinationTwice() throws Exception {
        var transfer = transit("100");
        documents.confirm(warehouseId, transfer.id(), "sender");
        try (var executor = Executors.newFixedThreadPool(2)) {
            var start = new CyclicBarrier(2);
            Callable<DocumentView> receive =
                    () -> {
                        start.await(20, TimeUnit.SECONDS);
                        return documents.receiveTransfer(
                                other,
                                transfer.id(),
                                receiveInput(transfer, "98", "2 kg pending"),
                                "receiver");
                    };
            var first = executor.submit(receive);
            var second = executor.submit(receive);
            first.get(30, TimeUnit.SECONDS);
            second.get(30, TimeUnit.SECONDS);
        }
        assertEquals(0, new BigDecimal("98").compareTo(total(other)));
        assertEquals(
                1L,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where document_id=? and"
                            + " type='TRANSFER_IN'",
                        Long.class,
                        transfer.id()));
    }

    @Test
    void approvalChangedDuringTransitIsReceivedIntoQualityHold() {
        var transfer = transit("100");
        documents.confirm(warehouseId, transfer.id(), "sender");
        jdbc.update("update agri_harvest_lots set status='Chờ duyệt xuất kho' where id=1");
        documents.receiveTransfer(
                other, transfer.id(), receiveInput(transfer, "100", "Review quality"), "receiver");
        var received = inventory.getBalances(other).getFirst();
        assertTrue(received.held());
        assertEquals(0, received.availableKg().signum());
        assertEquals(0, new BigDecimal("100").compareTo(received.quantityKg()));
        assertEquals(1, quality.list(other, 0).size());
    }

    @Test
    void countRecordsOnlyDifferenceAndPreservesFarmerQuantity() {
        var count = create(warehouseId, Type.COUNT, null, locationId, null, "90");
        assertEquals(0, new BigDecimal("100").compareTo(total(warehouseId)));
        documents.confirm(warehouseId, count.id(), "counter");
        assertEquals(0, new BigDecimal("90").compareTo(total(warehouseId)));
        assertEquals(
                0,
                new BigDecimal("-10")
                        .compareTo(
                                jdbc.queryForObject(
                                        "select delta_kg from wh_stock_movements where"
                                                + " type='COUNT'",
                                        BigDecimal.class)));
        assertEquals(
                "1000",
                jdbc.queryForObject("select qty from agri_harvest_lots where id=1", String.class));
    }

    @Test
    void staleCountCannotOverwriteNewReceipts() {
        var count = create(warehouseId, Type.COUNT, null, locationId, null, "90");
        var receipt = create(warehouseId, Type.INBOUND, null, locationId, null, "10");
        documents.confirm(warehouseId, receipt.id(), "receiver");
        assertThrows(
                ConflictException.class,
                () -> documents.confirm(warehouseId, count.id(), "counter"));
        assertEquals(0, new BigDecimal("110").compareTo(total(warehouseId)));
    }

    @Test
    void adjustmentCannotRemoveStockReservedForOrders() {
        jdbc.update(
                "INSERT INTO"
                    + " agri_orders(id,order_code,receiver_name,receiver_phone,receiver_address,status)"
                    + " VALUES(1,'ORDER-1','Test','000','Test','SHIPPING')");
        jdbc.update(
                "INSERT INTO agri_order_items(order_id,name,qty,price) VALUES(1,'Rau','80 kg',1)");
        reservations.create(
                warehouseId, new ReserveInput(1L, "Rau", new BigDecimal("80"), 30), "staff");
        var adjustment = create(warehouseId, Type.ADJUSTMENT, null, locationId, null, "50");
        assertThrows(
                ConflictException.class,
                () -> documents.confirm(warehouseId, adjustment.id(), "counter"));
        assertEquals(0, new BigDecimal("100").compareTo(total(warehouseId)));
    }

    @Test
    void quarantineBlocksTransfersAndReleaseIsAudited() {
        UUID balance = inventory.getBalances(warehouseId).getFirst().id();
        quality.inspect(
                warehouseId,
                new InspectionInput(balance, true, "Nghi ngờ chất lượng"),
                "inspector");
        assertEquals(0, inventory.getBalances(warehouseId).getFirst().availableKg().signum());
        var transfer = create(warehouseId, Type.TRANSFER, other, locationId, otherLocation, "10");
        assertThrows(
                ConflictException.class,
                () -> documents.confirm(warehouseId, transfer.id(), "staff"));
        quality.inspect(
                warehouseId, new InspectionInput(balance, false, "Đạt sau kiểm tra"), "inspector");
        assertEquals(2, quality.list(warehouseId, 0).size());
        assertEquals(
                0,
                new BigDecimal("100")
                        .compareTo(inventory.getBalances(warehouseId).getFirst().availableKg()));
    }

    @Test
    void inspectionCannotUseBalanceFromAnotherWarehouse() {
        UUID balance = inventory.getBalances(warehouseId).getFirst().id();
        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        quality.inspect(
                                other, new InspectionInput(balance, true, "Wrong scope"), "staff"));
    }

    @Test
    void transferFailureRollsBackSourceAndSuccessPreservesTotal() {
        locations.update(
                other,
                otherLocation,
                new StorageLocationUpdateRequest(
                        "A",
                        "A",
                        new BigDecimal("0.05"),
                        new BigDecimal("4"),
                        new BigDecimal("85")));
        var transfer = create(warehouseId, Type.TRANSFER, other, locationId, otherLocation, "60");
        assertThrows(
                ConflictException.class,
                () -> documents.confirm(warehouseId, transfer.id(), "staff"));
        assertEquals(0, new BigDecimal("100").compareTo(total(warehouseId)));
        assertEquals(0, total(other).signum());
        locations.update(
                other,
                otherLocation,
                new StorageLocationUpdateRequest(
                        "A", "A", BigDecimal.ONE, new BigDecimal("4"), new BigDecimal("85")));
        documents.confirm(warehouseId, transfer.id(), "staff");
        documents.confirm(warehouseId, transfer.id(), "staff");
        assertEquals(0, new BigDecimal("40").compareTo(total(warehouseId)));
        assertEquals(0, new BigDecimal("60").compareTo(total(other)));
        assertEquals(
                2,
                jdbc.queryForObject(
                        "select count(*) from wh_stock_movements where type like 'TRANSFER_%'",
                        Long.class));
    }

    @Test
    void oppositeTransfersUseStableWarehouseLockOrder() throws Exception {
        var receipt = create(other, Type.INBOUND, null, otherLocation, null, "100");
        documents.confirm(other, receipt.id(), "staff");
        var first = create(warehouseId, Type.TRANSFER, other, locationId, otherLocation, "10");
        var second = create(other, Type.TRANSFER, warehouseId, otherLocation, locationId, "20");
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a =
                    executor.submit(
                            () -> {
                                ready.countDown();
                                start.await();
                                return documents.confirm(warehouseId, first.id(), "one");
                            });
            var b =
                    executor.submit(
                            () -> {
                                ready.countDown();
                                start.await();
                                return documents.confirm(other, second.id(), "two");
                            });
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            a.get(20, TimeUnit.SECONDS);
            b.get(20, TimeUnit.SECONDS);
        } finally {
            start.countDown();
        }
        assertEquals(0, new BigDecimal("200").compareTo(total(warehouseId).add(total(other))));
    }

    @Test
    void deletedFarmerLotCanStillBeCountedFromWarehouseSnapshot() {
        jdbc.update("DELETE FROM agri_harvest_lots WHERE id=1");
        var count = create(warehouseId, Type.COUNT, null, locationId, null, "90");
        documents.confirm(warehouseId, count.id(), "counter");
        assertEquals(0, new BigDecimal("90").compareTo(total(warehouseId)));
        assertEquals(0, jdbc.queryForObject("select count(*) from agri_harvest_lots", Long.class));
    }
}
