package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.AlertOpened;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.Changed;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Dịch vụ đối soát tự động cuối ngày (End-of-Day Reconciliation) cho từng kho:
 * - Đối chiếu tổng biến động sổ cái ({@link StockMovement}) với tổng tồn hiện tại ({@link StockBalance}).
 * - Giải phóng các lượt giữ hàng quá hạn và cảnh báo phiếu DRAFT / giữ hàng bị treo quá 24 giờ.
 */
@Service
@RequiredArgsConstructor
public class WarehouseReconciliationService {
    private static final long STALE_HOURS = 24L;

    public record ReconciliationReport(
            UUID warehouseId,
            BigDecimal ledgerKg,
            BigDecimal balanceKg,
            BigDecimal diffKg,
            long staleDrafts,
            long staleReservations,
            int expiredReservations) {}

    private final InventoryService inventory;
    private final StockMovementRepository movements;
    private final StockBalanceRepository balances;
    private final WarehouseDocumentRepository documents;
    private final StockReservationRepository reservations;
    private final RiskAlertRepository alerts;
    private final AlertActionRepository actions;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Transactional
    public ReconciliationReport reconcileWarehouse(UUID warehouseId) {
        inventory.lock(warehouseId, null);
        Instant now = clock.instant();
        Instant cutoff = now.minus(STALE_HOURS, ChronoUnit.HOURS);

        int expiredReservations = reservations.expirePastDue(now);
        BigDecimal ledgerKg = movements.sumAllDeltaByWarehouse(warehouseId);
        BigDecimal balanceKg = balances.sumQuantityByWarehouse(warehouseId);
        BigDecimal diffKg = ledgerKg.subtract(balanceKg);
        long staleDrafts =
                documents.countByWarehouseIdAndStatusAndCreatedAtBefore(
                        warehouseId, WarehouseDocument.Status.DRAFT, cutoff);
        long staleReservations =
                reservations.countByWarehouseIdAndStatusAndCreatedAtBefore(
                        warehouseId, StockReservation.Status.ACTIVE, cutoff);

        List<RiskAlert> dirtyAlerts = new ArrayList<>();
        List<AlertAction> newActions = new ArrayList<>();
        List<AlertOpened> openedEvents = new ArrayList<>();

        syncAlert(
                warehouseId,
                "EOD_LEDGER_MISMATCH:" + warehouseId,
                "LEDGER_MISMATCH",
                "CRITICAL",
                diffKg.signum() != 0,
                "Lệch đối soát cuối ngày: Sổ cái "
                        + fmtKg(ledgerKg)
                        + " kg vs Tồn hiện tại "
                        + fmtKg(balanceKg)
                        + " kg (chênh "
                        + fmtKg(diffKg)
                        + " kg).",
                now,
                dirtyAlerts,
                newActions,
                openedEvents);

        syncAlert(
                warehouseId,
                "EOD_STALE_DRAFT:" + warehouseId,
                "STALE_DRAFT",
                "MEDIUM",
                staleDrafts > 0,
                "Có "
                        + staleDrafts
                        + " phiếu nháp (DRAFT) tạo quá "
                        + STALE_HOURS
                        + " giờ chưa xác nhận hoặc hủy.",
                now,
                dirtyAlerts,
                newActions,
                openedEvents);

        syncAlert(
                warehouseId,
                "EOD_STALE_RESERVATION:" + warehouseId,
                "STALE_RESERVATION",
                "MEDIUM",
                staleReservations > 0,
                "Có "
                        + staleReservations
                        + " lượt giữ hàng (FEFO) đang ACTIVE quá "
                        + STALE_HOURS
                        + " giờ chưa xuất hoặc giải phóng.",
                now,
                dirtyAlerts,
                newActions,
                openedEvents);

        if (!dirtyAlerts.isEmpty()) alerts.saveAllAndFlush(dirtyAlerts);
        if (!newActions.isEmpty()) actions.saveAll(newActions);
        for (var opened : openedEvents) events.publishEvent(opened);
        if (!dirtyAlerts.isEmpty() || expiredReservations > 0) {
            events.publishEvent(new Changed(warehouseId, "ALERTS"));
        }
        if (expiredReservations > 0) {
            events.publishEvent(new Changed(warehouseId, "RESERVATION_RELEASED"));
        }

        return new ReconciliationReport(
                warehouseId,
                ledgerKg,
                balanceKg,
                diffKg,
                staleDrafts,
                staleReservations,
                expiredReservations);
    }

    private void syncAlert(
            UUID warehouseId,
            String fingerprint,
            String type,
            String severity,
            boolean active,
            String message,
            Instant now,
            List<RiskAlert> dirtyAlerts,
            List<AlertAction> newActions,
            List<AlertOpened> openedEvents) {
        var existing = alerts.findByWarehouseIdAndFingerprint(warehouseId, fingerprint);
        if (active) {
            if (existing.isEmpty()) {
                var alert = new RiskAlert();
                alert.setWarehouseId(warehouseId);
                alert.setFingerprint(fingerprint);
                alert.setType(type);
                alert.setSeverity(severity);
                alert.setMessage(message);
                alert.setStatus("OPEN");
                alert.setUpdatedAt(now);
                dirtyAlerts.add(alert);
                newActions.add(action(alert.getId(), "OPEN", message));
                openedEvents.add(
                        new AlertOpened(
                                UUID.randomUUID(), warehouseId, alert.getId(), severity, message));
            } else {
                var alert = existing.get();
                boolean reopened = "RESOLVED".equals(alert.getStatus());
                if (reopened || !message.equals(alert.getMessage())) {
                    if (reopened) alert.setStatus("OPEN");
                    alert.setSeverity(severity);
                    alert.setMessage(message);
                    alert.setUpdatedAt(now);
                    dirtyAlerts.add(alert);
                    if (reopened) {
                        newActions.add(action(alert.getId(), "OPEN", message));
                        openedEvents.add(
                                new AlertOpened(
                                        UUID.randomUUID(),
                                        warehouseId,
                                        alert.getId(),
                                        severity,
                                        message));
                    }
                }
            }
        } else if (existing.isPresent() && !"RESOLVED".equals(existing.get().getStatus())) {
            var alert = existing.get();
            alert.setStatus("RESOLVED");
            alert.setUpdatedAt(now);
            dirtyAlerts.add(alert);
            newActions.add(action(alert.getId(), "RESOLVED", "Đối soát cuối ngày đạt chuẩn"));
        }
    }

    private AlertAction action(UUID alertId, String status, String note) {
        var action = new AlertAction();
        action.setAlertId(alertId);
        action.setStatus(status);
        action.setNote(note);
        action.setActor("SYSTEM_EOD");
        return action;
    }

    private String fmtKg(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace('.', ',');
    }
}
