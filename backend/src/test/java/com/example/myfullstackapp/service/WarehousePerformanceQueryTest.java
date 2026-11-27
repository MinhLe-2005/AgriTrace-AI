package com.example.myfullstackapp.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.config.WarehouseMonitoringProperties;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.BalanceView;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.repository.*;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

class WarehousePerformanceQueryTest {
    @Test
    void monitoringStatusUsesSingleBatchQueryForAllDevices() {
        InventoryService inventory = mock(InventoryService.class);
        WarehouseMonitoringSettingsRepository settings =
                mock(WarehouseMonitoringSettingsRepository.class);
        WarehouseSensorDeviceRepository devices = mock(WarehouseSensorDeviceRepository.class);
        WarehouseSensorReadingRepository readings = mock(WarehouseSensorReadingRepository.class);
        WarehouseMonitoringRuleRepository rules = mock(WarehouseMonitoringRuleRepository.class);
        WarehouseMonitoringRuleRevisionRepository revisions =
                mock(WarehouseMonitoringRuleRevisionRepository.class);
        RiskAlertRepository alerts = mock(RiskAlertRepository.class);
        WarehouseMonitoringAlerts alertOps = mock(WarehouseMonitoringAlerts.class);
        WarehouseMonitoringProperties props = new WarehouseMonitoringProperties();
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        Clock clock = Clock.fixed(Instant.parse("2026-11-26T16:00:00Z"), ZoneOffset.UTC);

        WarehouseMonitoringService service =
                new WarehouseMonitoringService(
                        inventory,
                        settings,
                        devices,
                        readings,
                        rules,
                        revisions,
                        alerts,
                        alertOps,
                        props,
                        events,
                        clock);

        UUID warehouseId = UUID.randomUUID();
        WarehouseSensorDevice d1 = new WarehouseSensorDevice();
        d1.setWarehouseId(warehouseId);
        d1.setName("S1");
        d1.setKeyHash("h1");
        d1.setCreatedBy("staff");
        d1.setCreatedAt(clock.instant());
        WarehouseSensorDevice d2 = new WarehouseSensorDevice();
        d2.setWarehouseId(warehouseId);
        d2.setName("S2");
        d2.setKeyHash("h2");
        d2.setCreatedBy("staff");
        d2.setCreatedAt(clock.instant());

        WarehouseSensorReading r1 = new WarehouseSensorReading();
        r1.setWarehouseId(warehouseId);
        r1.setDeviceId(d1.getId());
        r1.setRecordedAt(clock.instant().minusSeconds(10));
        r1.setReceivedAt(clock.instant().minusSeconds(9));

        when(settings.findById(warehouseId)).thenReturn(Optional.empty());
        when(devices.findByWarehouseIdOrderByCreatedAtAsc(warehouseId)).thenReturn(List.of(d1, d2));
        when(readings.findLatestForDevices(List.of(d1.getId(), d2.getId()))).thenReturn(List.of(r1));

        var status = service.status(warehouseId);
        assertEquals(2, status.activeDevices());
        assertEquals(1, status.freshDevices());
        verify(readings, times(1)).findLatestForDevices(anyCollection());
        verify(readings, never()).findFirstByDeviceIdOrderByRecordedAtDescReceivedAtDesc(any());
    }

    @Test
    void reservationListBatchesStockBalanceLookups() {
        InventoryService inventory = mock(InventoryService.class);
        FefoAllocationService fefo = mock(FefoAllocationService.class);
        StockReservationRepository reservations = mock(StockReservationRepository.class);
        WarehouseOrderQuery orders = mock(WarehouseOrderQuery.class);

        StockReservationService service =
                new StockReservationService(inventory, fefo, reservations, orders);

        UUID warehouseId = UUID.randomUUID();
        UUID balanceId1 = UUID.randomUUID();
        UUID balanceId2 = UUID.randomUUID();

        StockReservation res1 = new StockReservation();
        res1.setWarehouseId(warehouseId);
        res1.setOrderId(10L);
        res1.setExpiresAt(Instant.now().plusSeconds(300));
        res1.setCreatedBy("staff");
        res1.setLines(List.of(new StockReservation.Allocation(balanceId1, BigDecimal.ONE)));

        StockReservation res2 = new StockReservation();
        res2.setWarehouseId(warehouseId);
        res2.setOrderId(11L);
        res2.setExpiresAt(Instant.now().plusSeconds(300));
        res2.setCreatedBy("staff");
        res2.setLines(List.of(new StockReservation.Allocation(balanceId2, BigDecimal.TEN)));

        StockBalance b1 = new StockBalance();
        b1.setId(balanceId1);
        b1.setWarehouseId(warehouseId);
        b1.setLocationId(UUID.randomUUID());
        b1.setLotId("1");
        b1.setLotCode("L1");
        b1.setProductId("Rau");
        b1.setExpiryDate(LocalDate.now().plusDays(5));

        StockBalance b2 = new StockBalance();
        b2.setId(balanceId2);
        b2.setWarehouseId(warehouseId);
        b2.setLocationId(UUID.randomUUID());
        b2.setLotId("2");
        b2.setLotCode("L2");
        b2.setProductId("Rau");
        b2.setExpiryDate(LocalDate.now().plusDays(6));

        when(reservations.findByWarehouseIdOrderByCreatedAtDesc(warehouseId, PageRequest.of(0, 100)))
                .thenReturn(List.of(res1, res2));
        when(orders.codes(anyCollection())).thenReturn(Map.of(10L, "ORD-10", 11L, "ORD-11"));
        when(inventory.balancesById(eq(warehouseId), anyCollection()))
                .thenReturn(Map.of(balanceId1, b1, balanceId2, b2));

        var views = service.list(warehouseId, 0);
        assertEquals(2, views.size());
        verify(inventory, times(1)).balancesById(eq(warehouseId), anyCollection());
        verify(inventory, never()).balance(any(), any());
    }

    @Test
    void riskRefreshBatchesAlertLookupAndPersistence() {
        InventoryService inventory = mock(InventoryService.class);
        RiskRuleRepository rules = mock(RiskRuleRepository.class);
        RiskAlertRepository alerts = mock(RiskAlertRepository.class);
        AlertActionRepository actions = mock(AlertActionRepository.class);
        StockMovementRepository movements = mock(StockMovementRepository.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);

        WarehouseRiskService service =
                new WarehouseRiskService(inventory, rules, alerts, actions, movements, events);

        UUID warehouseId = UUID.randomUUID();
        BalanceView b1 =
                new BalanceView(
                        UUID.randomUUID(),
                        warehouseId,
                        UUID.randomUUID(),
                        "1",
                        "Rau",
                        "LOT-1",
                        InventoryService.today().plusDays(1),
                        new BigDecimal("10"),
                        BigDecimal.ZERO,
                        new BigDecimal("10"),
                        true,
                        Instant.now().minusSeconds(10));

        when(rules.findById(warehouseId)).thenReturn(Optional.empty());
        when(inventory.getBalances(warehouseId)).thenReturn(List.of(b1));
        when(alerts.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId)).thenReturn(List.of());

        service.refresh(warehouseId);

        verify(alerts, never()).findByWarehouseIdAndFingerprint(any(), any());
        verify(alerts, times(1)).saveAllAndFlush(any());
        verify(actions, times(1)).saveAll(any());
    }

    @Test
    void reconcileBatchesBalancesAndUsesNonZeroViews() {
        InventoryService inventory = mock(InventoryService.class);
        FefoAllocationService fefo = mock(FefoAllocationService.class);
        StockReservationRepository reservations = mock(StockReservationRepository.class);
        WarehouseOrderQuery orders = mock(WarehouseOrderQuery.class);

        StockReservationService service =
                new StockReservationService(inventory, fefo, reservations, orders);

        UUID warehouseId = UUID.randomUUID();
        UUID balanceId = UUID.randomUUID();

        StockReservation reservation = new StockReservation();
        reservation.setWarehouseId(warehouseId);
        reservation.setOrderId(25L);
        reservation.setExpiresAt(Instant.now().plusSeconds(600));
        reservation.setCreatedBy("staff");
        reservation.setStatus(StockReservation.Status.ACTIVE);
        reservation.setLines(List.of(new StockReservation.Allocation(balanceId, new BigDecimal("5"))));

        StockBalance balance = new StockBalance();
        balance.setId(balanceId);
        balance.setWarehouseId(warehouseId);
        balance.setLocationId(UUID.randomUUID());
        balance.setLotId("1");
        balance.setLotCode("L1");
        balance.setProductId("Rau");
        balance.setExpiryDate(InventoryService.today().plusDays(4));

        BalanceView view =
                new BalanceView(
                        balanceId,
                        warehouseId,
                        balance.getLocationId(),
                        "1",
                        "Rau",
                        "L1",
                        balance.getExpiryDate(),
                        new BigDecimal("10"),
                        BigDecimal.ZERO,
                        new BigDecimal("10"),
                        false,
                        Instant.now().minusSeconds(10));

        when(reservations.findByIdAndWarehouseId(reservation.getId(), warehouseId))
                .thenReturn(Optional.of(reservation));
        when(inventory.nonZeroViews(warehouseId, reservation.getId())).thenReturn(List.of(view));
        when(inventory.balancesById(eq(warehouseId), anyCollection()))
                .thenReturn(Map.of(balanceId, balance));
        when(reservations.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
        when(orders.codes(anyCollection())).thenReturn(Map.of(25L, "ORD-25"));
        when(orders.demandKg(warehouseId, 25L, "Rau")).thenReturn(new BigDecimal("5"));

        var result = service.reconcile(warehouseId, reservation.getId());
        assertEquals(reservation.getId(), result.id());
        verify(inventory, times(1)).nonZeroViews(warehouseId, reservation.getId());
        verify(inventory, times(3)).balancesById(eq(warehouseId), anyCollection());
        verify(inventory, never()).balance(any(), any());
        verify(inventory, never()).views(any(), any(), anyBoolean());
    }
}
