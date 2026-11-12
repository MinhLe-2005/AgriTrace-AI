package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.entity.*;
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
    StockMovementService.class,
    WarehouseLotQuery.class
})
@EnabledIf("databaseAvailable")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehouseInventoryIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "p03");
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private StockBalanceRepository balances;
    @Autowired
    private StockReservationRepository reservations;
    @Autowired
    private InventoryService inventory;
    @Autowired
    private StockMovementService ledger;
    @Autowired
    private JdbcTemplate jdbc;
    private UUID warehouseId, locationId;
    private StockBalance stock;

    @BeforeEach
    void setUp() {
        jdbc.execute(
                "TRUNCATE"
                    + " wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,storage_locations,warehouses,agri_harvest_lots"
                    + " CASCADE");
        warehouseId =
                warehouses
                        .create(
                                new WarehouseCreateRequest(
                                        "Test",
                                        "HCM",
                                        null,
                                        BigDecimal.TEN,
                                        new BigDecimal("4"),
                                        new BigDecimal("85")))
                        .id();
        locationId =
                locations
                        .create(
                                warehouseId,
                                new StorageLocationCreateRequest(
                                        "A",
                                        "A",
                                        BigDecimal.ONE,
                                        new BigDecimal("4"),
                                        new BigDecimal("85")))
                        .id();
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                1L,
                "Rau",
                "LOT-1",
                InventoryService.today().plusDays(5),
                "1000",
                "kg",
                "Đã duyệt xuất kho");
        stock = new StockBalance();
        stock.setWarehouseId(warehouseId);
        stock.setLocationId(locationId);
        stock.setLotId("1");
        stock.setProductId("Rau");
        stock.setLotCode("LOT-1");
        stock.setExpiryDate(InventoryService.today().plusDays(5));
        stock.setQuantityKg(new BigDecimal("100"));
        stock = balances.saveAndFlush(stock);
    }

    private void reserve(String qty, boolean expired) {
        var reservation = new StockReservation();
        reservation.setWarehouseId(warehouseId);
        reservation.setOrderId(1L);
        reservation.setCreatedBy("test");
        reservation.setExpiresAt(Instant.now().plusSeconds(expired ? -60 : 600));
        reservation.setLines(
                List.of(new StockReservation.Allocation(stock.getId(), new BigDecimal(qty))));
        reservations.saveAndFlush(reservation);
    }

    @Test
    void availableExcludesOnlyActiveUnexpiredReservations() {
        reserve("20", false);
        reserve("30", true);
        var view = inventory.getBalances(warehouseId).getFirst();
        assertEquals(0, new BigDecimal("20").compareTo(view.reservedKg()));
        assertEquals(0, new BigDecimal("80").compareTo(view.availableKg()));
    }

    @Test
    void quarantinePreservesPhysicalStockButRemovesAvailability() {
        stock.setHeld(true);
        balances.saveAndFlush(stock);
        var view = inventory.getBalances(warehouseId).getFirst();
        assertEquals(0, new BigDecimal("100").compareTo(view.quantityKg()));
        assertEquals(0, view.availableKg().signum());
    }

    @Test
    void inactiveLocationsAndWarehousesAreNotAvailable() {
        locations.setActive(warehouseId, locationId, false);
        assertEquals(0, inventory.getBalances(warehouseId).getFirst().availableKg().signum());
        locations.setActive(warehouseId, locationId, true);
        warehouses.setActive(warehouseId, false);
        assertEquals(0, inventory.getBalances(warehouseId).getFirst().availableKg().signum());
    }

    @Test
    void farmerApprovalChangesAreRespectedWithoutWritingFarmerData() {
        jdbc.update("UPDATE agri_harvest_lots SET status='Chờ duyệt xuất kho' WHERE id=1");
        assertEquals(0, inventory.getBalances(warehouseId).getFirst().availableKg().signum());
        jdbc.update("DELETE FROM agri_harvest_lots WHERE id=1");
        assertEquals(0, inventory.getBalances(warehouseId).getFirst().availableKg().signum());
        assertEquals(1, balances.count());
    }

    @Test
    void inventoryPagesFilterBeforeCountingAvailableRows() {
        addStock(2, 1, true, "Đã duyệt xuất kho");
        addStock(3, 2, false, "Chờ duyệt xuất kho");
        addStock(4, -1, false, "Đã duyệt xuất kho");
        addStock(5, 3, false, "Đã duyệt xuất kho");
        reserve("20", false);
        assertEquals(
                List.of("4", "2"),
                inventory.page(warehouseId, null, null, false, 0, 2).stream()
                        .map(WarehouseOperations.BalanceView::lotId)
                        .toList());
        assertEquals("5", inventory.page(warehouseId, null, null, true, 0, 1).getFirst().lotId());
        var second = inventory.page(warehouseId, null, null, true, 1, 1).getFirst();
        assertEquals("1", second.lotId());
        assertEquals(0, new BigDecimal("80").compareTo(second.availableKg()));
        assertTrue(inventory.page(warehouseId, null, null, true, 2, 1).isEmpty());
        assertEquals(
                "1", inventory.page(warehouseId, "1", locationId, false, 0, 2).getFirst().lotId());
        assertTrue(inventory.page(warehouseId, null, UUID.randomUUID(), false, 0, 2).isEmpty());
        reserve("80", false);
        assertTrue(inventory.page(warehouseId, null, null, true, 1, 1).isEmpty());
        assertThrows(
                com.example.myfullstackapp.exception.ResourceNotFoundException.class,
                () -> inventory.page(UUID.randomUUID(), null, null, false, 0, 2));
    }

    @Test
    void physicalPageDoesNotReadFarmerMetadataOutsideRequestedPage() {
        addStock(2, 6, false, "Đã duyệt xuất kho");
        jdbc.update("UPDATE agri_harvest_lots SET qty='invalid' WHERE id=2");
        assertEquals("1", inventory.page(warehouseId, null, null, false, 0, 1).getFirst().lotId());
        assertThrows(
                com.example.myfullstackapp.exception.WarehouseIntegrationException.class,
                () -> inventory.page(warehouseId, null, null, false, 1, 1));
    }

    private void addStock(long id, int expiresInDays, boolean held, String status) {
        var expiry = InventoryService.today().plusDays(expiresInDays);
        WarehousePostgresSupport.insertHarvestLot(
                jdbc, id, "Rau", "LOT-" + id, expiry, "1000", "kg", status);
        var balance = new StockBalance();
        balance.setWarehouseId(warehouseId);
        balance.setLocationId(locationId);
        balance.setLotId(Long.toString(id));
        balance.setProductId("Rau");
        balance.setLotCode("LOT-" + id);
        balance.setExpiryDate(expiry);
        balance.setQuantityKg(new BigDecimal("100"));
        balance.setHeld(held);
        balances.saveAndFlush(balance);
    }

    @Test
    void invalidLedgerRangesAreRejected() {
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        ledger.list(
                                warehouseId,
                                LocalDate.of(2026, 10, 2),
                                LocalDate.of(2026, 10, 1),
                                0));
    }
}
