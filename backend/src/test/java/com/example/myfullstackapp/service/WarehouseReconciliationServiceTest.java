package com.example.myfullstackapp.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.AlertOpened;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.Changed;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.repository.*;

import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

class WarehouseReconciliationServiceTest {

    @Test
    void opensAlertsOnMismatchAndStaleItemsAndAutoResolvesWhenClean() {
        var inventory = mock(InventoryService.class);
        var movements = mock(StockMovementRepository.class);
        var balances = mock(StockBalanceRepository.class);
        var documents = mock(WarehouseDocumentRepository.class);
        var reservations = mock(StockReservationRepository.class);
        var alerts = mock(RiskAlertRepository.class);
        var actions = mock(AlertActionRepository.class);
        var events = mock(ApplicationEventPublisher.class);
        var clock = Clock.fixed(Instant.parse("2026-11-27T16:30:00Z"), ZoneOffset.UTC);

        var service =
                new WarehouseReconciliationService(
                        inventory,
                        movements,
                        balances,
                        documents,
                        reservations,
                        alerts,
                        actions,
                        events,
                        clock);

        UUID warehouseId = UUID.randomUUID();

        // Case 1: Ledger != Balance, 2 stale drafts, 1 stale reservation
        when(reservations.expirePastDue(any())).thenReturn(1);
        when(movements.sumAllDeltaByWarehouse(warehouseId)).thenReturn(new BigDecimal("100.000"));
        when(balances.sumQuantityByWarehouse(warehouseId)).thenReturn(new BigDecimal("95.000"));
        when(documents.countByWarehouseIdAndStatusAndCreatedAtBefore(
                        eq(warehouseId), eq(WarehouseDocument.Status.DRAFT), any()))
                .thenReturn(2L);
        when(reservations.countByWarehouseIdAndStatusAndCreatedAtBefore(
                        eq(warehouseId), eq(StockReservation.Status.ACTIVE), any()))
                .thenReturn(1L);
        when(alerts.findByWarehouseIdAndFingerprint(eq(warehouseId), any()))
                .thenReturn(Optional.empty());

        var report = service.reconcileWarehouse(warehouseId);
        assertEquals(new BigDecimal("5.000"), report.diffKg());
        assertEquals(2L, report.staleDrafts());
        assertEquals(1L, report.staleReservations());
        assertEquals(1, report.expiredReservations());
        verify(alerts).saveAllAndFlush(argThat(list -> ((List<?>) list).size() == 3));
        verify(events, times(3)).publishEvent(any(AlertOpened.class));
        verify(events).publishEvent(new Changed(warehouseId, "ALERTS"));
        verify(events).publishEvent(new Changed(warehouseId, "RESERVATION_RELEASED"));

        // Case 2: Clean state -> auto-resolves existing open alert
        reset(alerts, actions, events);
        var openMismatch = new RiskAlert();
        openMismatch.setWarehouseId(warehouseId);
        openMismatch.setFingerprint("EOD_LEDGER_MISMATCH:" + warehouseId);
        openMismatch.setType("LEDGER_MISMATCH");
        openMismatch.setStatus("OPEN");
        when(reservations.expirePastDue(any())).thenReturn(0);
        when(movements.sumAllDeltaByWarehouse(warehouseId)).thenReturn(new BigDecimal("100.000"));
        when(balances.sumQuantityByWarehouse(warehouseId)).thenReturn(new BigDecimal("100.000"));
        when(documents.countByWarehouseIdAndStatusAndCreatedAtBefore(
                        eq(warehouseId), eq(WarehouseDocument.Status.DRAFT), any()))
                .thenReturn(0L);
        when(reservations.countByWarehouseIdAndStatusAndCreatedAtBefore(
                        eq(warehouseId), eq(StockReservation.Status.ACTIVE), any()))
                .thenReturn(0L);
        when(alerts.findByWarehouseIdAndFingerprint(
                        warehouseId, "EOD_LEDGER_MISMATCH:" + warehouseId))
                .thenReturn(Optional.of(openMismatch));
        when(alerts.findByWarehouseIdAndFingerprint(
                        warehouseId, "EOD_STALE_DRAFT:" + warehouseId))
                .thenReturn(Optional.empty());
        when(alerts.findByWarehouseIdAndFingerprint(
                        warehouseId, "EOD_STALE_RESERVATION:" + warehouseId))
                .thenReturn(Optional.empty());

        var cleanReport = service.reconcileWarehouse(warehouseId);
        assertEquals(0, cleanReport.diffKg().signum());
        assertEquals("RESOLVED", openMismatch.getStatus());
        verify(alerts).saveAllAndFlush(argThat(list -> ((List<?>) list).size() == 1));
        verify(events, never()).publishEvent(any(AlertOpened.class));
    }
}
