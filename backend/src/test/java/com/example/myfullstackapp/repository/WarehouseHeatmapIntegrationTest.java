package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.config.*;
import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseHeatmap.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.entity.*;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@DataJpaTest(
        properties = {
            "spring.flyway.enabled=false",
            "spring.jpa.hibernate.ddl-auto=create-drop",
            "spring.jpa.show-sql=false"
        })
@ActiveProfiles("warehouse-test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
    WarehouseService.class,
    StorageLocationService.class,
    CapacityValidationService.class,
    WarehouseMapperImpl.class,
    StorageLocationMapperImpl.class,
    InventoryService.class,
    WarehouseLotQuery.class,
    WarehouseRiskService.class,
    WarehouseMonitoringConfiguration.class,
    WarehouseMonitoringService.class,
    WarehouseMonitoringAlerts.class,
    WarehouseHeatmapService.class
})
@EnabledIf("databaseAvailable")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehouseHeatmapIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "heatmap");
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private WarehouseHeatmapService heatmap;
    @Autowired
    private WarehouseMonitoringService monitoring;
    @Autowired
    private WarehouseRiskService risks;
    @Autowired
    private StockBalanceRepository balances;
    @Autowired
    private StockReservationRepository reservations;
    @Autowired
    private WarehouseSensorReadingRepository readings;
    @Autowired
    private RiskAlertRepository alerts;
    @Autowired
    private JdbcTemplate jdbc;
    @MockitoBean
    private Clock clock;
    private Instant now;
    private UUID warehouseId, locationId;

    @BeforeEach
    void setUp() {
        now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        when(clock.instant()).thenReturn(now);
        jdbc.execute(
                "TRUNCATE"
                    + " wh_location_layouts,wh_monitor_rule_revisions,wh_alert_deliveries,wh_sensor_readings,wh_sensor_devices,wh_monitoring_rules,wh_monitoring_settings,wh_alert_actions,wh_risk_alerts,wh_risk_rules,wh_quality_inspections,wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,wh_unit_conversions,storage_locations,warehouses,agri_harvest_lots"
                    + " CASCADE");
        warehouseId = warehouse();
        locationId = location(warehouseId, "A01");
    }

    private UUID warehouse() {
        return warehouses
                .create(
                        new WarehouseCreateRequest(
                                "Test",
                                "HCM",
                                null,
                                new BigDecimal("100"),
                                new BigDecimal("4"),
                                new BigDecimal("85")))
                .id();
    }

    private UUID location(UUID wh, String code) {
        return locations
                .create(
                        wh,
                        new StorageLocationCreateRequest(
                                code,
                                code,
                                BigDecimal.ONE,
                                new BigDecimal("4"),
                                new BigDecimal("85")))
                .id();
    }

    private LocalDate today() {
        return LocalDate.ofInstant(now, ZoneId.of("Asia/Ho_Chi_Minh"));
    }

    private StockBalance stock(UUID location, String lot, String qty, boolean held, int days) {
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                Long.parseLong(lot),
                "Rau",
                "LOT-" + lot,
                today().plusDays(days),
                "10000",
                "kg",
                "Đã duyệt xuất kho");
        var b = new StockBalance();
        b.setWarehouseId(warehouseId);
        b.setLocationId(location);
        b.setLotId(lot);
        b.setProductId("Rau");
        b.setLotCode("LOT-" + lot);
        b.setQuantityKg(new BigDecimal(qty));
        b.setHeld(held);
        b.setExpiryDate(today().plusDays(days));
        return balances.saveAndFlush(b);
    }

    private DeviceSecret sensor(UUID location, String temp, Instant at) {
        var d =
                monitoring.createDevice(
                        warehouseId, new DeviceInput("DEMO", location, true), "staff");
        var r = new WarehouseSensorReading();
        r.setWarehouseId(warehouseId);
        r.setLocationId(location);
        r.setDeviceId(d.device().id());
        r.setMessageId(UUID.randomUUID());
        r.setRecordedAt(at);
        r.setReceivedAt(now);
        r.setTemperature(new BigDecimal(temp));
        r.setHumidity(new BigDecimal("85"));
        readings.saveAndFlush(r);
        return d;
    }

    private Cell cell() {
        return heatmap.map(warehouseId).cells().stream()
                .filter(c -> c.locationId().equals(locationId))
                .findFirst()
                .orElseThrow();
    }

    @Test
    void layoutIsIndependentOfStockAndCannotOverlapOrCrossWarehouses() {
        stock(locationId, "1", "50", false, 8);
        var second = location(warehouseId, "B01");
        heatmap.place(warehouseId, locationId, new LayoutInput(2, 3, 1), "staff");
        assertThrows(
                ConflictException.class,
                () -> heatmap.place(warehouseId, second, new LayoutInput(2, 3, 1), "staff"));
        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        heatmap.place(
                                warehouseId,
                                location(warehouse(), "OTHER"),
                                new LayoutInput(1, 1, 1),
                                "staff"));
        assertThrows(
                IllegalArgumentException.class,
                () -> heatmap.place(warehouseId, second, new LayoutInput(0, 31, 11), "staff"));
        heatmap.place(warehouseId, locationId, new LayoutInput(30, 30, 10), "manager");
        assertEquals(10, cell().layout().level());
        assertEquals("manager", cell().layout().updatedBy());
        heatmap.unplace(warehouseId, locationId);
        assertNull(cell().layout());
        assertEquals(new BigDecimal("50.000"), cell().quantityKg());
    }

    @Test
    void physicalCapacityIncludesHeldAndReservedWithoutDoubleCounting() {
        var b = stock(locationId, "1", "300", false, 8);
        stock(locationId, "2", "400", true, 8);
        var reservation = new StockReservation();
        reservation.setWarehouseId(warehouseId);
        reservation.setOrderId(1L);
        reservation.setCreatedBy("staff");
        reservation.setExpiresAt(Instant.now().plusSeconds(3600));
        reservation
                .getLines()
                .add(new StockReservation.Allocation(b.getId(), new BigDecimal("200")));
        reservations.saveAndFlush(reservation);
        var cell = cell();
        assertEquals(0, cell.quantityKg().compareTo(new BigDecimal("700")));
        assertEquals(0, cell.heldKg().compareTo(new BigDecimal("400")));
        assertEquals(0, cell.reservedKg().compareTo(new BigDecimal("200")));
        assertEquals(0, cell.availableKg().compareTo(new BigDecimal("100")));
        assertEquals("WARNING", cell.capacity().state());
    }

    @Test
    void overloadAndExpiredStockAreRedWhileEmptyBalancesDoNotAffectExpiry() {
        stock(locationId, "1", "1001", true, -1);
        stock(locationId, "2", "0", true, -50);
        var cell = cell();
        assertEquals("DANGER", cell.capacity().state());
        assertEquals("DANGER", cell.expiry().state());
        assertEquals(today().minusDays(1), cell.earliestExpiry());
        assertEquals(1, cell.lots().size());
        assertEquals("DANGER", cell.overall().state());
    }

    @Test
    void noReadingAndStaleReadingAreUnknownRatherThanGreen() {
        assertEquals("UNKNOWN", cell().temperature().state());
        assertEquals("EMPTY", cell().capacity().state());
        sensor(null, "4", now);
        assertEquals("GOOD", cell().temperature().state());
        assertEquals("WAREHOUSE", cell().measurementScope());
        sensor(locationId, "20", now.minusSeconds(121));
        var cell = cell();
        assertEquals("UNKNOWN", cell.temperature().state());
        assertEquals("LOCATION", cell.measurementScope());
        assertFalse(cell.reading().fresh());
    }

    @Test
    void exactSensorWinsAndRuleDurationIsNotBypassedByTheMap() {
        sensor(null, "4", now);
        var device = sensor(locationId, "12", now);
        var rule =
                monitoring.saveRule(
                        warehouseId,
                        null,
                        new RuleInput(
                                "Hot",
                                RuleKind.TEMPERATURE_HIGH,
                                locationId,
                                new BigDecimal("10"),
                                120,
                                5,
                                null,
                                "CRITICAL",
                                true),
                        "manager");
        assertEquals("WARNING", cell().temperature().state());
        assertTrue(cell().reading().simulated());
        var alert = new RiskAlert();
        alert.setWarehouseId(warehouseId);
        alert.setFingerprint("RULE:" + rule.id());
        alert.setType("TEMPERATURE_HIGH");
        alert.setSeverity("CRITICAL");
        alert.setMessage("Hot");
        alert.setLocationId(locationId);
        alert.setDeviceId(device.device().id());
        alert.setRuleId(rule.id());
        alerts.saveAndFlush(alert);
        assertEquals("DANGER", cell().temperature().state());
        assertEquals(1, cell().alerts().size());
        alert.setStatus("RESOLVED");
        alerts.saveAndFlush(alert);
        assertEquals("WARNING", cell().temperature().state());
    }

    @Test
    void expiryUsesConfiguredWarningAndInactiveLocationsKeepTheirStockVisible() {
        stock(locationId, "1", "50", false, 5);
        assertEquals("GOOD", cell().expiry().state());
        risks.updateRule(
                warehouseId,
                new com.example.myfullstackapp.dto.warehouse.WarehouseOperations.RuleInput(
                        7, 14, BigDecimal.ZERO));
        locations.setActive(warehouseId, locationId, false);
        assertEquals("WARNING", cell().expiry().state());
        assertFalse(cell().active());
        assertEquals(1, cell().lots().size());
    }

    @Test
    void unrelatedWarehouseStockAndSensorsNeverLeakIntoTheMap() {
        UUID other = warehouse();
        location(other, "OTHER");
        sensor(locationId, "4", now);
        assertEquals(1, heatmap.map(warehouseId).cells().size());
        var foreign = heatmap.map(other);
        assertEquals(1, foreign.cells().size());
        assertNull(foreign.cells().getFirst().reading());
        assertTrue(foreign.cells().getFirst().lots().isEmpty());
    }
}
