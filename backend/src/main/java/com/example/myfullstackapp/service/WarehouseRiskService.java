package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.math.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseRiskService {
    private final InventoryService inventory;
    private final RiskRuleRepository rules;
    private final RiskAlertRepository alerts;
    private final AlertActionRepository actions;
    private final StockMovementRepository movements;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public RuleInput rule(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        var rule = rules.findById(warehouseId).orElseGet(RiskRule::new);
        return new RuleInput(
                rule.getExpiryWarningDays(), rule.getStaleDays(), rule.getLowStockKg());
    }

    @Transactional
    public RuleInput updateRule(UUID warehouseId, RuleInput input) {
        inventory.lock(warehouseId, null);
        var rule = rules.findById(warehouseId).orElseGet(RiskRule::new);
        rule.setWarehouseId(warehouseId);
        rule.setExpiryWarningDays(input.expiryWarningDays());
        rule.setStaleDays(input.staleDays());
        rule.setLowStockKg(input.lowStockKg());
        rules.saveAndFlush(rule);
        events.publishEvent(
                new com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.Changed(
                        warehouseId, "RULES"));
        return input;
    }

    @Transactional(readOnly = true)
    public List<AlertView> list(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        return alerts.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId).stream()
                .map(this::view)
                .toList();
    }

    @Transactional
    public List<AlertView> refresh(UUID warehouseId) {
        inventory.lock(warehouseId, null);
        var rule = rule(warehouseId);
        var stock = inventory.getBalances(warehouseId);
        Set<String> live = new HashSet<>();
        for (var b : stock) {
            if (b.quantityKg().signum() <= 0) continue;
            long days = ChronoUnit.DAYS.between(InventoryService.today(), b.expiryDate());
            if (days <= rule.expiryWarningDays())
                upsert(
                        warehouseId,
                        live,
                        "EXPIRY:" + b.id(),
                        "EXPIRY",
                        days < 0 ? "CRITICAL" : "HIGH",
                        b.lotCode()
                                + (days < 0
                                        ? ": đã quá hạn " + (-days) + " ngày"
                                        : ": còn " + days + " ngày đến hạn")
                                + ", tồn "
                                + kilograms(b.quantityKg())
                                + " kg");
            if (b.receivedAt().isBefore(Instant.now().minus(rule.staleDays(), ChronoUnit.DAYS)))
                upsert(
                        warehouseId,
                        live,
                        "STALE:" + b.id(),
                        "STALE",
                        "MEDIUM",
                        b.lotCode() + ": tồn tại vị trí từ " + b.receivedAt());
            if (b.held())
                upsert(
                        warehouseId,
                        live,
                        "HOLD:" + b.id(),
                        "QUALITY_HOLD",
                        "HIGH",
                        b.lotCode() + ": hàng đang bị giữ để kiểm tra chất lượng");
        }
        // Low-stock is scoped per known product, including zero balances so stock-outs remain
        // visible.
        Map<String, BigDecimal> totals = new HashMap<>();
        for (var b : stock) totals.merge(b.productId(), b.availableKg(), BigDecimal::add);
        for (var product : totals.entrySet())
            if (product.getValue().compareTo(rule.lowStockKg()) < 0)
                upsert(
                        warehouseId,
                        live,
                        "LOW:"
                                + UUID.nameUUIDFromBytes(
                                        product.getKey().getBytes(StandardCharsets.UTF_8)),
                        "LOW_STOCK",
                        "MEDIUM",
                        product.getKey()
                                + ": còn "
                                + kilograms(product.getValue())
                                + " kg khả dụng");
        for (var alert : alerts.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId)) {
            if (Set.of("EXPIRY", "STALE", "QUALITY_HOLD", "LOW_STOCK").contains(alert.getType())
                    && !live.contains(alert.getFingerprint())
                    && !"RESOLVED".equals(alert.getStatus())) {
                alert.setStatus("RESOLVED");
                alert.setUpdatedAt(Instant.now());
                alerts.save(alert);
                audit(alert, "RESOLVED", "Điều kiện cảnh báo không còn", "SYSTEM");
            }
        }
        alerts.flush();
        events.publishEvent(
                new com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.Changed(
                        warehouseId, "ALERTS"));
        return list(warehouseId);
    }

    private String kilograms(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace('.', ',');
    }

    private void upsert(
            UUID warehouseId,
            Set<String> live,
            String fingerprint,
            String type,
            String severity,
            String message) {
        live.add(fingerprint);
        var alert =
                alerts.findByWarehouseIdAndFingerprint(warehouseId, fingerprint)
                        .orElseGet(RiskAlert::new);
        boolean fresh = alert.getWarehouseId() == null;
        boolean reopen = "RESOLVED".equals(alert.getStatus());
        alert.setWarehouseId(warehouseId);
        alert.setFingerprint(fingerprint);
        alert.setType(type);
        alert.setSeverity(severity);
        alert.setMessage(message);
        alert.setUpdatedAt(Instant.now());
        if (reopen) alert.setStatus("OPEN");
        alerts.saveAndFlush(alert);
        if (fresh || reopen) {
            audit(
                    alert,
                    "OPEN",
                    fresh ? "Phát hiện điều kiện cảnh báo" : "Điều kiện cảnh báo xuất hiện lại",
                    "SYSTEM");
            events.publishEvent(
                    new com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.AlertOpened(
                            UUID.randomUUID(), warehouseId, alert.getId(), severity, message));
        }
    }

    @Transactional
    public AlertView act(UUID warehouseId, UUID id, AlertInput input, String actor) {
        inventory.lock(warehouseId, null);
        var alert =
                alerts.findByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Alert not found"));
        alert.setStatus(input.status());
        alert.setUpdatedAt(Instant.now());
        alerts.save(alert);
        audit(alert, input.status(), input.note().trim(), actor);
        events.publishEvent(
                new com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.Changed(
                        warehouseId, "ALERTS"));
        return view(alert);
    }

    @Transactional(readOnly = true)
    public List<AlertActionView> history(UUID warehouseId, UUID id) {
        if (alerts.findByIdAndWarehouseId(id, warehouseId).isEmpty())
            throw new ResourceNotFoundException("Alert not found");
        return actions.findByAlertIdOrderByCreatedAtAsc(id).stream()
                .map(
                        a ->
                                new AlertActionView(
                                        a.getId(),
                                        a.getStatus(),
                                        a.getNote(),
                                        a.getActor(),
                                        a.getCreatedAt()))
                .toList();
    }

    private void audit(RiskAlert alert, String status, String note, String actor) {
        var action = new AlertAction();
        action.setAlertId(alert.getId());
        action.setStatus(status);
        action.setNote(note);
        action.setActor(actor);
        actions.save(action);
    }

    private AlertView view(RiskAlert a) {
        return new AlertView(
                a.getId(),
                a.getType(),
                a.getSeverity(),
                a.getMessage(),
                a.getStatus(),
                a.getUpdatedAt(),
                a.getLocationId(),
                a.getRuleId(),
                a.getDeviceId(),
                a.getLotId());
    }

    /** An explainable historical-rate estimate; this is not a trained AI model. */
    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<Forecast> forecast(UUID warehouseId) {
        var stock = inventory.getBalances(warehouseId);
        Map<String, String> lotProducts = new HashMap<>();
        Map<String, BigDecimal> available = new HashMap<>(), outbound = new HashMap<>();
        Map<String, Long> observations = new HashMap<>();
        Map<String, LocalDate> expiry = new HashMap<>();
        for (var b : stock) {
            lotProducts.put(b.lotId(), b.productId());
            available.merge(b.productId(), b.availableKg(), BigDecimal::add);
            if (b.availableKg().signum() > 0)
                expiry.merge(b.productId(), b.expiryDate(), (a, c) -> a.isBefore(c) ? a : c);
        }
        for (var row :
                movements.outboundHistory(warehouseId, Instant.now().minus(14, ChronoUnit.DAYS))) {
            String product = lotProducts.get((String) row[0]);
            if (product == null) continue;
            outbound.merge(product, ((BigDecimal) row[1]).abs(), BigDecimal::add);
            observations.merge(product, (Long) row[2], Long::sum);
        }
        return available.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(
                        e -> {
                            String product = e.getKey();
                            BigDecimal rate =
                                    outbound.getOrDefault(product, BigDecimal.ZERO)
                                            .divide(new BigDecimal("14"), 3, RoundingMode.HALF_UP);
                            boolean enough =
                                    observations.getOrDefault(product, 0L) >= 3
                                            && rate.signum() > 0;
                            BigDecimal days =
                                    enough
                                            ? e.getValue().divide(rate, 2, RoundingMode.HALF_UP)
                                            : null;
                            LocalDate nearest = expiry.get(product);
                            String recommendation =
                                    !enough
                                            ? "Chưa đủ lịch sử: cần ít nhất 3 biến động xuất kho"
                                                    + " trong 14 ngày"
                                            : nearest != null
                                                            && days.compareTo(
                                                                            BigDecimal.valueOf(
                                                                                    ChronoUnit.DAYS
                                                                                            .between(
                                                                                                    InventoryService
                                                                                                            .today(),
                                                                                                    nearest)))
                                                                    > 0
                                                    ? "Ưu tiên xuất FEFO và xem lại lượng dư trước"
                                                            + " hạn dùng"
                                                    : "Tiếp tục theo dõi nhu cầu và hạn dùng";
                            return new Forecast(
                                    product,
                                    e.getValue(),
                                    rate,
                                    days,
                                    nearest,
                                    enough ? "14_DAY_AVERAGE" : "INSUFFICIENT_HISTORY",
                                    recommendation);
                        })
                .toList();
    }
}
