package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.WarehouseDocument.Type;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
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
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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
    WarehouseDocumentService.class,
    WarehouseLotQuery.class,
    FefoAllocationService.class,
    StockReservationService.class,
    WarehouseOrderQuery.class,
    WarehouseWeightService.class,
    WarehouseQualityService.class,
    WarehouseRiskService.class
})
@EnabledIf("databaseAvailable")
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehouseRiskIntegrationTest {
    static boolean databaseAvailable() {
        return WarehousePostgresSupport.available();
    }

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        WarehousePostgresSupport.configure(registry, "p06");
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private WarehouseDocumentService documents;
    @Autowired
    private WarehouseQualityService quality;
    @Autowired
    private WarehouseRiskService risk;
    @Autowired
    private InventoryService inventory;
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
                    + " wh_alert_actions,wh_risk_alerts,wh_risk_rules,wh_quality_inspections,wh_reservation_lines,wh_reservations,wh_stock_movements,wh_stock_balances,wh_document_lines,wh_documents,wh_unit_conversions,storage_locations,warehouses,agri_harvest_lots"
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
                InventoryService.today().plusDays(2).toString());
        var receipt =
                documents.create(
                        warehouseId,
                        Type.INBOUND,
                        new DocumentInput(
                                null,
                                null,
                                "Nhập thử",
                                List.of(
                                        new LineInput(
                                                "1", locationId, null, new BigDecimal("100")))),
                        "staff");
        documents.confirm(warehouseId, receipt.id(), "staff");
    }

    @Test
    void repeatedRefreshDoesNotDuplicateAlertsOrAudit() {
        var first = risk.refresh(warehouseId);
        var second = risk.refresh(warehouseId);
        assertEquals(1, first.size());
        assertEquals(first.getFirst().id(), second.getFirst().id());
        assertEquals(1, risk.history(warehouseId, first.getFirst().id()).size());
    }

    @Test
    void acknowledgedAlertStaysAcknowledgedAndKeepsActor() {
        var alert = risk.refresh(warehouseId).getFirst();
        risk.act(
                warehouseId,
                alert.id(),
                new AlertInput("ACKNOWLEDGED", "Đã kiểm tra"),
                "inspector");
        assertEquals("ACKNOWLEDGED", risk.refresh(warehouseId).getFirst().status());
        var history = risk.history(warehouseId, alert.id());
        assertEquals(2, history.size());
        assertEquals("inspector", history.getLast().actor());
    }

    @Test
    void disappearedConditionResolvesAndRecurrenceReopensSameAlert() {
        var alert = risk.refresh(warehouseId).getFirst();
        risk.updateRule(warehouseId, new RuleInput(0, 14, BigDecimal.ZERO));
        assertEquals("RESOLVED", risk.refresh(warehouseId).getFirst().status());
        risk.updateRule(warehouseId, new RuleInput(3, 14, BigDecimal.ZERO));
        var reopened = risk.refresh(warehouseId).getFirst();
        assertEquals(alert.id(), reopened.id());
        assertEquals("OPEN", reopened.status());
        assertEquals(
                List.of("OPEN", "RESOLVED", "OPEN"),
                risk.history(warehouseId, alert.id()).stream()
                        .map(AlertActionView::status)
                        .toList());
    }

    @Test
    void alertCannotBeChangedThroughAnotherWarehouse() {
        var alert = risk.refresh(warehouseId).getFirst();
        var other =
                warehouses
                        .create(
                                new WarehouseCreateRequest(
                                        "Other",
                                        "HCM",
                                        null,
                                        BigDecimal.ONE,
                                        new BigDecimal("4"),
                                        new BigDecimal("85")))
                        .id();
        assertThrows(
                ResourceNotFoundException.class,
                () ->
                        risk.act(
                                other,
                                alert.id(),
                                new AlertInput("RESOLVED", "Wrong warehouse"),
                                "staff"));
        assertThrows(ResourceNotFoundException.class, () -> risk.history(other, alert.id()));
        assertEquals("OPEN", risk.list(warehouseId).getFirst().status());
    }

    @Test
    void expiredStaleAndHeldBalancesGenerateSeparateRisks() {
        var balance = inventory.getBalances(warehouseId).getFirst();
        quality.inspect(
                warehouseId, new InspectionInput(balance.id(), true, "Cần kiểm tra"), "staff");
        jdbc.update(
                "UPDATE wh_stock_balances SET expiry_date=?,received_at=? WHERE id=?",
                InventoryService.today().minusDays(1),
                java.sql.Timestamp.from(Instant.now().minus(30, ChronoUnit.DAYS)),
                balance.id());
        var alerts = risk.refresh(warehouseId);
        assertEquals(
                Set.of("EXPIRY", "STALE", "QUALITY_HOLD", "LOW_STOCK"),
                new HashSet<>(alerts.stream().map(AlertView::type).toList()));
        assertTrue(
                alerts.stream()
                        .anyMatch(
                                a -> a.type().equals("EXPIRY") && a.severity().equals("CRITICAL")));
    }

    @Test
    void lowStockUsesBoundedFingerprintForLongProductNamesAndZeroStock() {
        String product = "R".repeat(255);
        jdbc.update("UPDATE wh_stock_balances SET product_id=?,quantity_kg=0", product);
        risk.updateRule(warehouseId, new RuleInput(0, 14, BigDecimal.ONE));
        var alerts = risk.refresh(warehouseId);
        assertEquals(1, alerts.size());
        assertEquals("LOW_STOCK", alerts.getFirst().type());
        assertTrue(
                jdbc.queryForObject("SELECT length(fingerprint) FROM wh_risk_alerts", Integer.class)
                        < 150);
    }

    @Test
    void forecastRequiresHistoryAndUsesOnlyRecentOutbound() {
        assertEquals("INSUFFICIENT_HISTORY", risk.forecast(warehouseId).getFirst().evidence());
        assertNull(risk.forecast(warehouseId).getFirst().daysToClear());
        for (int i = 0; i < 3; i++) {
            var doc =
                    documents.create(
                            warehouseId,
                            Type.OUTBOUND,
                            new DocumentInput(
                                    null,
                                    null,
                                    "Xuất thử",
                                    List.of(
                                            new LineInput(
                                                    "1", locationId, null, new BigDecimal("10")))),
                            "staff");
            documents.confirm(warehouseId, doc.id(), "staff");
        }
        var result = risk.forecast(warehouseId).getFirst();
        assertEquals("14_DAY_AVERAGE", result.evidence());
        assertEquals(0, new BigDecimal("2.143").compareTo(result.dailyOutboundKg()));
        assertTrue(result.recommendation().startsWith("Ưu tiên"));
        jdbc.update(
                "UPDATE wh_stock_movements SET occurred_at=? WHERE type='OUTBOUND'",
                java.sql.Timestamp.from(Instant.now().minus(15, ChronoUnit.DAYS)));
        assertEquals("INSUFFICIENT_HISTORY", risk.forecast(warehouseId).getFirst().evidence());
    }
}
