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
                "CREATE TABLE IF NOT EXISTS agri_harvest_lots(id bigint primary key,product"
                    + " varchar(255),code varchar(64),expiry_date varchar(64),qty varchar(32),unit"
                    + " varchar(32),status varchar(64))");
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
        jdbc.update(
                "INSERT INTO agri_harvest_lots VALUES(1,'Rau','LOT-1',?,'1000','kg','Đã duyệt xuất"
                        + " kho')",
                InventoryService.today().plusDays(5).toString());
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
