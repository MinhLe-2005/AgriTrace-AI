package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.config.*;
import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.RuleInput;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicReference;

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
    WarehouseDocumentService.class,
    WarehouseLotQuery.class,
    FefoAllocationService.class,
    StockReservationService.class,
    WarehouseOrderQuery.class,
    WarehouseWeightService.class,
    WarehouseQualityService.class,
    WarehouseRiskService.class,
    WarehouseMonitoringConfiguration.class,
    WarehouseMonitoringService.class,
    WarehouseMonitoringAlerts.class,
    WarehouseMonitoringEvaluator.class,
    WarehouseTelemetryService.class,
    WarehouseNotificationService.class
})
@EnabledIf("databaseAvailable")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehouseMonitoringIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "monitoring");
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private WarehouseDocumentService documents;
    @Autowired
    private WarehouseMonitoringService monitoring;
    @Autowired
    private WarehouseTelemetryService telemetry;
    @Autowired
    private WarehouseMonitoringEvaluator evaluator;
    @Autowired
    private WarehouseRiskService legacy;
    @Autowired
    private WarehouseQualityService quality;
    @Autowired
    private InventoryService inventory;
    @Autowired
    private WarehouseNotificationService notifications;
    @Autowired
    private WarehouseAlertDeliveryRepository deliveries;
    @Autowired
    private WarehouseSensorDeviceRepository devices;
    @Autowired
    private WarehouseMonitoringProperties properties;
    @Autowired
    private JdbcTemplate jdbc;
    @MockitoBean
    private Clock clock;
    @MockitoBean
    private WarehouseTelegramClient telegram;
    private final AtomicReference<Instant> now = new AtomicReference<>();
    private UUID warehouseId, locationId;

    @BeforeEach
    void setUp() {
        now.set(Instant.now().truncatedTo(ChronoUnit.MICROS));
        when(clock.instant()).thenAnswer(call -> now.get());
        properties.setTelegramBotToken("");
        jdbc.execute(
                "TRUNCATE"
                    + " wh_monitor_rule_revisions,wh_alert_deliveries,wh_sensor_readings,wh_sensor_devices,wh_monitoring_rules,wh_monitoring_settings,wh_alert_actions,wh_risk_alerts,wh_risk_rules,wh_quality_inspections,wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,wh_unit_conversions,storage_locations,warehouses,agri_harvest_lots"
                    + " CASCADE");
        warehouseId = warehouse();
        locationId = location(warehouseId, "A");
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

    private DeviceSecret sensor() {
        return monitoring.createDevice(
                warehouseId, new DeviceInput("DEMO sensor", locationId, true), "staff");
    }

    private RuleInput temperatureRule(int minutes, int recovery) {
        return new RuleInput(
                "Nóng kéo dài",
                RuleKind.TEMPERATURE_HIGH,
                null,
                new BigDecimal("10"),
                minutes,
                recovery,
                null,
                "CRITICAL",
                true);
    }

    private ReadingView ingest(DeviceSecret sensor, UUID message, Instant time, String temp) {
        return telemetry.ingest(
                new TelemetryInput(
                        sensor.device().id(),
                        sensor.deviceKey(),
                        message,
                        time,
                        new BigDecimal(temp),
                        new BigDecimal("85"),
                        true));
    }

    private void seed(DeviceSecret sensor, Instant time, String temp) {
        jdbc.update(
                "INSERT INTO"
                    + " wh_sensor_readings(id,warehouse_id,device_id,location_id,message_id,recorded_at,received_at,temperature,humidity)"
                    + " VALUES(?,?,?,?,?,?,?,?,85)",
                UUID.randomUUID(),
                warehouseId,
                sensor.device().id(),
                locationId,
                UUID.randomUUID(),
                java.sql.Timestamp.from(time),
                java.sql.Timestamp.from(now.get()),
                new BigDecimal(temp));
    }

    private void hotHistory(DeviceSecret sensor, boolean gap) {
        for (int minute = 120; minute >= 1; minute--)
            if (!gap || minute < 60 || minute > 63)
                seed(sensor, now.get().minusSeconds(minute * 60L), "12");
    }

    private List<AlertView> temperatureAlerts() {
        return legacy.list(warehouseId).stream()
                .filter(a -> a.type().equals("TEMPERATURE_HIGH"))
                .toList();
    }

    @Test
    void sensorKeysAreHashedAndInvalidCredentialsCannotWrite() {
        var sensor = sensor();
        assertNotEquals(
                sensor.deviceKey(),
                devices.findById(sensor.device().id()).orElseThrow().getKeyHash());
        assertThrows(
                WarehouseSensorAuthenticationException.class,
                () ->
                        telemetry.ingest(
                                new TelemetryInput(
                                        sensor.device().id(),
                                        "invalid",
                                        UUID.randomUUID(),
                                        now.get(),
                                        BigDecimal.ONE,
                                        BigDecimal.TEN,
                                        true)));
        assertEquals(0, jdbc.queryForObject("select count(*) from wh_sensor_readings", Long.class));
        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        monitoring.readings(
                                warehouse(),
                                sensor.device().id(),
                                now.get().minusSeconds(60),
                                now.get()));
    }

    @Test
    void deviceScopeAndSimulationSourceAreEnforced() {
        UUID other = warehouse();
        UUID otherLocation = location(other, "B");
        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        monitoring.createDevice(
                                warehouseId,
                                new DeviceInput("Wrong", otherLocation, true),
                                "staff"));
        var sensor = sensor();
        assertThrows(ConflictException.class, () -> sensor());
        assertThrows(
                IllegalArgumentException.class,
                () ->
                        telemetry.ingest(
                                new TelemetryInput(
                                        sensor.device().id(),
                                        sensor.deviceKey(),
                                        UUID.randomUUID(),
                                        now.get(),
                                        BigDecimal.ONE,
                                        BigDecimal.TEN,
                                        false)));
        monitoring.disableDevice(warehouseId, sensor.device().id(), "manager");
        assertThrows(
                WarehouseSensorAuthenticationException.class,
                () -> ingest(sensor, UUID.randomUUID(), now.get(), "4"));
    }

    @Test
    void repeatedMessageIsIdempotentAndCannotBeReusedWithDifferentData() {
        var sensor = sensor();
        UUID message = UUID.randomUUID();
        Instant precise = now.get().minusNanos(23);
        var first = ingest(sensor, message, precise, "4");
        var second = ingest(sensor, message, precise, "4");
        assertEquals(first.id(), second.id());
        assertEquals(1, jdbc.queryForObject("select count(*) from wh_sensor_readings", Long.class));
        assertThrows(ConflictException.class, () -> ingest(sensor, message, precise, "5"));
        assertThrows(
                IllegalArgumentException.class,
                () -> ingest(sensor, UUID.randomUUID(), now.get().minusSeconds(86401), "4"));
    }

    @Test
    void twoHoursRequireContinuousHistoryAndRepeatedEvaluationKeepsOneAlert() {
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(120, 5), "manager");
        hotHistory(sensor, false);
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        assertEquals(1, temperatureAlerts().size());
        var alert = temperatureAlerts().getFirst();
        assertEquals("CRITICAL", alert.severity());
        evaluator.evaluateWarehouse(warehouseId);
        legacy.refresh(warehouseId);
        assertEquals("OPEN", temperatureAlerts().getFirst().status());
        assertEquals(1, legacy.history(warehouseId, alert.id()).size());
        legacy.act(
                warehouseId, alert.id(), new AlertInput("ACKNOWLEDGED", "Đã tiếp nhận"), "manager");
        evaluator.evaluateWarehouse(warehouseId);
        assertEquals("ACKNOWLEDGED", temperatureAlerts().getFirst().status());
    }

    @Test
    void missingSamplesCannotProveContinuousViolation() {
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(120, 5), "manager");
        hotHistory(sensor, true);
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        assertTrue(temperatureAlerts().isEmpty());
    }

    @Test
    void fractionalGapCannotProveContinuousViolation() {
        var sensor = sensor();
        monitoring.settings(warehouseId, new SettingsInput(10, false, null));
        monitoring.saveRule(warehouseId, null, temperatureRule(1, 0), "manager");
        for (long millis : new long[] {60000, 49500, 40000, 30000, 20000, 10000})
            seed(sensor, now.get().minusMillis(millis), "12");
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        assertTrue(temperatureAlerts().isEmpty());
    }

    @Test
    void ruleRevisionsRetainDefinitionsAndActorsAndAreWarehouseScoped() {
        var input = temperatureRule(120, 5);
        var rule = monitoring.saveRule(warehouseId, null, input, "manager");
        monitoring.saveRule(warehouseId, rule.id(), input, "same-request");
        assertEquals(1, monitoring.ruleHistory(warehouseId, rule.id(), 0).size());
        now.set(now.get().plusSeconds(1));
        monitoring.saveRule(
                warehouseId,
                rule.id(),
                new RuleInput(
                        "Đổi tên",
                        input.kind(),
                        null,
                        input.threshold(),
                        120,
                        5,
                        null,
                        "CRITICAL",
                        true),
                "supervisor");
        var history = monitoring.ruleHistory(warehouseId, rule.id(), 0);
        assertEquals(2, history.size());
        assertEquals("Đổi tên", history.getFirst().definition().name());
        assertEquals("supervisor", history.getFirst().actor());
        assertEquals(input.name(), history.getLast().definition().name());
        assertEquals("manager", history.getLast().actor());
        assertThrows(
                ResourceNotFoundException.class,
                () -> monitoring.ruleHistory(warehouse(), rule.id(), 0));
    }

    @Test
    void offlineIsSeparateAndDoesNotResolveAnExistingTemperatureIncident() {
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(0, 5), "manager");
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        now.set(now.get().plusSeconds(121));
        evaluator.evaluateWarehouse(warehouseId);
        assertEquals("OPEN", temperatureAlerts().getFirst().status());
        assertTrue(
                legacy.list(warehouseId).stream()
                        .anyMatch(
                                a ->
                                        a.type().equals("SENSOR_OFFLINE")
                                                && a.status().equals("OPEN")));
    }

    @Test
    void recoveryRequiresStableHistoryAndDoesNotReleaseQualityHolds() {
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                1L,
                "Rau",
                "LOT-1",
                InventoryService.today().plusDays(2),
                "1000",
                "kg",
                "Đã duyệt xuất kho");
        var receipt =
                documents.create(
                        warehouseId,
                        WarehouseDocument.Type.INBOUND,
                        new DocumentInput(
                                null,
                                null,
                                "Test",
                                List.of(
                                        new LineInput(
                                                "1", locationId, null, new BigDecimal("100")))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        var balance = inventory.getBalances(warehouseId).getFirst();
        quality.inspect(warehouseId, new InspectionInput(balance.id(), true, "Chờ kiểm tra"), "qa");
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(0, 5), "manager");
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        now.set(now.get().plusSeconds(60));
        ingest(sensor, UUID.randomUUID(), now.get(), "4");
        assertEquals("OPEN", temperatureAlerts().getFirst().status());
        for (int minute = 1; minute <= 5; minute++) {
            now.set(now.get().plusSeconds(60));
            ingest(sensor, UUID.randomUUID(), now.get(), "4");
        }
        assertEquals("RESOLVED", temperatureAlerts().getFirst().status());
        assertTrue(inventory.getBalances(warehouseId).getFirst().held());
        assertEquals(
                0,
                new BigDecimal("100")
                        .compareTo(inventory.getBalances(warehouseId).getFirst().quantityKg()));
    }

    @Test
    void stockRuleAggregatesLotAcrossLocationsAndResolvesAtBoundary() {
        UUID second = location(warehouseId, "B");
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                1L,
                "Rau",
                "LOT-1",
                InventoryService.today().plusDays(2),
                "1000",
                "kg",
                "Đã duyệt xuất kho");
        var receipt =
                documents.create(
                        warehouseId,
                        WarehouseDocument.Type.INBOUND,
                        new DocumentInput(
                                null,
                                null,
                                "Test",
                                List.of(
                                        new LineInput("1", locationId, null, new BigDecimal("300")),
                                        new LineInput("1", second, null, new BigDecimal("300")))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        monitoring.saveRule(
                warehouseId,
                null,
                new RuleInput(
                        "Gần hạn, tồn lớn",
                        RuleKind.NEAR_EXPIRY_HIGH_STOCK,
                        null,
                        new BigDecimal("3"),
                        0,
                        0,
                        new BigDecimal("500"),
                        "HIGH",
                        true),
                "manager");
        evaluator.evaluateWarehouse(warehouseId);
        var alert =
                legacy.list(warehouseId).stream()
                        .filter(a -> a.type().equals("NEAR_EXPIRY_HIGH_STOCK"))
                        .findFirst()
                        .orElseThrow();
        assertEquals("1", alert.lotId());
        assertTrue(alert.message().contains("600"));
        jdbc.update("UPDATE wh_stock_balances SET quantity_kg=250");
        evaluator.evaluateWarehouse(warehouseId);
        assertEquals(
                "RESOLVED",
                legacy.list(warehouseId).stream()
                        .filter(a -> a.id().equals(alert.id()))
                        .findFirst()
                        .orElseThrow()
                        .status());
    }

    @Test
    void shelfLifePercentUsesHarvestDateAndStrictPercentAndWeightBoundaries() {
        UUID second = location(warehouseId, "B");
        LocalDate today = LocalDate.ofInstant(now.get(), ZoneId.of("Asia/Ho_Chi_Minh"));
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                1L,
                "Rau",
                "LOT-1",
                today.plusDays(2),
                "1000",
                "kg",
                "Đã duyệt xuất kho",
                today.minusDays(18).toString());
        var receipt =
                documents.create(
                        warehouseId,
                        WarehouseDocument.Type.INBOUND,
                        new DocumentInput(
                                null,
                                null,
                                "Test",
                                List.of(
                                        new LineInput("1", locationId, null, new BigDecimal("300")),
                                        new LineInput("1", second, null, new BigDecimal("300")))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        monitoring.saveRule(
                warehouseId,
                null,
                new RuleInput(
                        "Dưới 10%, trên 500kg",
                        RuleKind.SHELF_LIFE_LOW_HIGH_STOCK,
                        null,
                        new BigDecimal("10"),
                        0,
                        0,
                        new BigDecimal("500"),
                        "HIGH",
                        true),
                "manager");
        evaluator.evaluateWarehouse(warehouseId);
        assertTrue(
                legacy.list(warehouseId).stream()
                        .noneMatch(a -> a.type().equals("SHELF_LIFE_LOW_HIGH_STOCK")));
        jdbc.update(
                "UPDATE agri_harvest_lots SET harvest_date=? WHERE id=1",
                today.minusDays(19)
                        .format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/uuuu")));
        evaluator.evaluateWarehouse(warehouseId);
        var incident =
                legacy.list(warehouseId).stream()
                        .filter(a -> a.type().equals("SHELF_LIFE_LOW_HIGH_STOCK"))
                        .findFirst()
                        .orElseThrow();
        assertEquals("OPEN", incident.status());
        assertTrue(incident.message().contains("9,5%"));
        jdbc.update("UPDATE wh_stock_balances SET quantity_kg=200 WHERE location_id=?", second);
        evaluator.evaluateWarehouse(warehouseId);
        assertEquals(
                "RESOLVED",
                legacy.list(warehouseId).stream()
                        .filter(a -> a.id().equals(incident.id()))
                        .findFirst()
                        .orElseThrow()
                        .status());
    }

    @Test
    void missingHarvestMetadataCreatesDataAlertWithoutLosingSensorReadings() {
        WarehousePostgresSupport.insertHarvestLot(
                jdbc,
                1L,
                "Rau",
                "LOT-1",
                InventoryService.today().plusDays(2),
                "1000",
                "kg",
                "Đã duyệt xuất kho");
        var receipt =
                documents.create(
                        warehouseId,
                        WarehouseDocument.Type.INBOUND,
                        new DocumentInput(
                                null,
                                null,
                                "Test",
                                List.of(
                                        new LineInput(
                                                "1", locationId, null, new BigDecimal("600")))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
        monitoring.saveRule(
                warehouseId,
                null,
                new RuleInput(
                        "Thiếu dữ liệu",
                        RuleKind.SHELF_LIFE_LOW_HIGH_STOCK,
                        null,
                        new BigDecimal("10"),
                        0,
                        0,
                        new BigDecimal("500"),
                        "HIGH",
                        true),
                "manager");
        var sensor = sensor();
        ingest(sensor, UUID.randomUUID(), now.get(), "4");
        assertEquals(1, monitoring.latest(warehouseId).size());
        var data =
                legacy.list(warehouseId).stream()
                        .filter(a -> a.type().equals("SHELF_LIFE_DATA_MISSING"))
                        .findFirst()
                        .orElseThrow();
        assertEquals("OPEN", data.status());
        jdbc.update(
                "UPDATE agri_harvest_lots SET harvest_date=? WHERE id=1",
                InventoryService.today().minusDays(30).toString());
        evaluator.evaluateWarehouse(warehouseId);
        assertTrue(
                legacy.list(warehouseId).stream()
                        .anyMatch(
                                a ->
                                        a.type().equals("SHELF_LIFE_LOW_HIGH_STOCK")
                                                && a.status().equals("OPEN")));
        assertEquals(
                "RESOLVED",
                legacy.list(warehouseId).stream()
                        .filter(a -> a.id().equals(data.id()))
                        .findFirst()
                        .orElseThrow()
                        .status());
    }

    @Test
    void editingSameRuleDoesNotCreateANewIncidentAndDisablingResolvesIt() {
        var sensor = sensor();
        var input = temperatureRule(0, 0);
        var rule = monitoring.saveRule(warehouseId, null, input, "manager");
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        UUID alert = temperatureAlerts().getFirst().id();
        monitoring.saveRule(warehouseId, rule.id(), input, "manager");
        evaluator.evaluateWarehouse(warehouseId);
        assertEquals(1, legacy.history(warehouseId, alert).size());
        monitoring.saveRule(
                warehouseId,
                rule.id(),
                new RuleInput(
                        input.name(),
                        input.kind(),
                        input.locationId(),
                        input.threshold(),
                        0,
                        0,
                        null,
                        "CRITICAL",
                        false),
                "manager");
        assertEquals("RESOLVED", temperatureAlerts().getFirst().status());
    }

    @Test
    void telegramOutboxRetriesWithoutDuplicatingAlertsOrRewritingStock() {
        properties.setTelegramBotToken("test-placeholder");
        monitoring.settings(warehouseId, new SettingsInput(120, true, "-10012345"));
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(0, 0), "manager");
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        evaluator.evaluateWarehouse(warehouseId);
        var queued = notifications.list(warehouseId, 0);
        assertEquals(1, queued.size());
        UUID id = queued.getFirst().id();
        when(telegram.send(anyString(), anyString())).thenReturn(false);
        for (int i = 0; i < 5; i++) {
            notifications.deliver(id);
            now.set(deliveries.findById(id).orElseThrow().getNextAttemptAt());
        }
        assertEquals("FAILED", deliveries.findById(id).orElseThrow().getStatus());
        notifications.retry(warehouseId, id);
        when(telegram.send(anyString(), anyString())).thenReturn(true);
        notifications.deliver(id);
        assertEquals("SENT", deliveries.findById(id).orElseThrow().getStatus());
        notifications.deliver(id);
        verify(telegram, times(6)).send(anyString(), anyString());
        assertEquals(1, temperatureAlerts().size());
    }

    @Test
    void disabledNotificationsCancelQueuedDelivery() {
        properties.setTelegramBotToken("test-placeholder");
        monitoring.settings(warehouseId, new SettingsInput(120, true, "-10012345"));
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(0, 0), "manager");
        ingest(sensor, UUID.randomUUID(), now.get(), "12");
        UUID id = notifications.list(warehouseId, 0).getFirst().id();
        monitoring.settings(warehouseId, new SettingsInput(120, false, "-10012345"));
        notifications.deliver(id);
        assertEquals("CANCELLED", deliveries.findById(id).orElseThrow().getStatus());
        verifyNoInteractions(telegram);
    }

    @Test
    void concurrentRetriesPersistOneMessageAndOneAlert() throws Exception {
        var sensor = sensor();
        monitoring.saveRule(warehouseId, null, temperatureRule(0, 0), "manager");
        UUID message = UUID.randomUUID();
        CountDownLatch ready = new CountDownLatch(2), start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            var a =
                    executor.submit(
                            () -> {
                                ready.countDown();
                                start.await();
                                return ingest(sensor, message, now.get(), "12");
                            });
            var b =
                    executor.submit(
                            () -> {
                                ready.countDown();
                                start.await();
                                return ingest(sensor, message, now.get(), "12");
                            });
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            assertEquals(a.get(30, TimeUnit.SECONDS).id(), b.get(30, TimeUnit.SECONDS).id());
        } finally {
            start.countDown();
        }
        assertEquals(1, jdbc.queryForObject("select count(*) from wh_sensor_readings", Long.class));
        assertEquals(1, temperatureAlerts().size());
    }
}
