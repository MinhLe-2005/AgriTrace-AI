package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.*;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseMonitoringEvaluator {
    private final InventoryService inventory;
    private final WarehouseMonitoringSettingsRepository settings;
    private final WarehouseSensorDeviceRepository devices;
    private final WarehouseSensorReadingRepository readings;
    private final WarehouseMonitoringRuleRepository rules;
    private final StockBalanceRepository balances;
    private final RiskAlertRepository alerts;
    private final WarehouseMonitoringAlerts alertOperations;
    private final Clock clock;

    @Transactional
    public void evaluateWarehouse(UUID warehouseId) {
        inventory.lock(warehouseId, null);
        if (!inventory.requireWarehouse(warehouseId).isActive()) return;
        var now = clock.instant();
        int gap =
                settings.findById(warehouseId)
                        .map(WarehouseMonitoringSettings::getMaxGapSeconds)
                        .orElse(120);
        var active =
                devices.findByWarehouseIdOrderByCreatedAtAsc(warehouseId).stream()
                        .filter(WarehouseSensorDevice::isActive)
                        .toList();
        var definitions =
                rules.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId).stream()
                        .filter(WarehouseMonitoringRule::isEnabled)
                        .toList();
        for (var device : active) {
            var latest =
                    readings.findFirstByDeviceIdOrderByRecordedAtDescReceivedAtDesc(device.getId())
                            .orElse(null);
            boolean fresh =
                    latest != null
                            && !latest.getRecordedAt().isBefore(now.minusSeconds(gap))
                            && !latest.getRecordedAt().isAfter(now);
            String offline = "SENSOR_OFFLINE:" + device.getId();
            if (!fresh && !device.getCreatedAt().isAfter(now.minusSeconds(gap))) {
                alertOperations.raise(
                        warehouseId,
                        offline,
                        "SENSOR_OFFLINE",
                        "HIGH",
                        (device.isSimulated() ? "[GIẢ LẬP] " : "")
                                + device.getName()
                                + ": không có số đo mới trong "
                                + gap
                                + " giây",
                        device.getLocationId(),
                        null,
                        device.getId(),
                        null);
            } else if (fresh)
                alertOperations.resolveFingerprint(warehouseId, offline, "Đã nhận được số đo mới");
        }
        Map<UUID, List<WarehouseSensorReading>> history = new HashMap<>();
        int maxMinutes =
                definitions.stream()
                        .mapToInt(r -> Math.max(r.getDurationMinutes(), r.getRecoveryMinutes()))
                        .max()
                        .orElse(0);
        for (var rule : definitions) {
            if (rule.getKind() == RuleKind.NEAR_EXPIRY_HIGH_STOCK) {
                evaluateStock(warehouseId, rule);
                continue;
            }
            for (var device : active) {
                if (rule.getLocationId() != null
                        && !rule.getLocationId().equals(device.getLocationId())) continue;
                var samples =
                        history.computeIfAbsent(
                                device.getId(),
                                id -> {
                                    var list =
                                            new ArrayList<>(
                                                    readings
                                                            .findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtDescReceivedAtDesc(
                                                                    id,
                                                                    now.minusSeconds(
                                                                            maxMinutes * 60L + gap),
                                                                    now,
                                                                    PageRequest.of(0, 20000)));
                                    Collections.reverse(list);
                                    return list;
                                });
                if (samples.isEmpty()
                        || samples.getLast().getRecordedAt().isBefore(now.minusSeconds(gap)))
                    continue;
                String fingerprint = "RULE:" + rule.getId() + ":DEVICE:" + device.getId();
                boolean violation = violates(rule, samples.getLast());
                int minutes = violation ? rule.getDurationMinutes() : rule.getRecoveryMinutes();
                if (!continuous(rule, samples, violation, minutes, gap, now)) continue;
                if (violation) {
                    var last = samples.getLast();
                    boolean temperature =
                            rule.getKind() == RuleKind.TEMPERATURE_HIGH
                                    || rule.getKind() == RuleKind.TEMPERATURE_LOW;
                    String value = plain(temperature ? last.getTemperature() : last.getHumidity());
                    String message =
                            (device.isSimulated() ? "[GIẢ LẬP] " : "")
                                    + rule.getName()
                                    + " · "
                                    + device.getName()
                                    + ": "
                                    + value
                                    + (temperature ? " °C" : " %")
                                    + ", đủ điều kiện liên tục "
                                    + minutes
                                    + " phút. Cần kiểm tra chất lượng lô liên quan.";
                    alertOperations.raise(
                            warehouseId,
                            fingerprint,
                            rule.getKind().name(),
                            rule.getSeverity(),
                            message,
                            device.getLocationId(),
                            rule.getId(),
                            device.getId(),
                            null);
                } else
                    alertOperations.resolveFingerprint(
                            warehouseId,
                            fingerprint,
                            "Số đo đã ổn định trong khoảng phục hồi của quy tắc");
            }
        }
    }

    private boolean continuous(
            WarehouseMonitoringRule rule,
            List<WarehouseSensorReading> samples,
            boolean violation,
            int minutes,
            int gap,
            Instant now) {
        Instant start = null, previous = null;
        for (var sample : samples) {
            var time = sample.getRecordedAt();
            if (violates(rule, sample) != violation) {
                start = null;
                previous = time;
                continue;
            }
            if (start == null
                    || (previous != null
                            && Duration.between(previous, time).compareTo(Duration.ofSeconds(gap))
                                    > 0)) start = time;
            previous = time;
        }
        return start != null && !start.isAfter(now.minusSeconds(minutes * 60L));
    }

    private boolean violates(WarehouseMonitoringRule rule, WarehouseSensorReading reading) {
        return switch (rule.getKind()) {
            case TEMPERATURE_HIGH -> reading.getTemperature().compareTo(rule.getThreshold()) > 0;
            case TEMPERATURE_LOW -> reading.getTemperature().compareTo(rule.getThreshold()) < 0;
            case HUMIDITY_HIGH -> reading.getHumidity().compareTo(rule.getThreshold()) > 0;
            case HUMIDITY_LOW -> reading.getHumidity().compareTo(rule.getThreshold()) < 0;
            default -> false;
        };
    }

    private void evaluateStock(UUID warehouseId, WarehouseMonitoringRule rule) {
        Map<String, BigDecimal> quantity = new HashMap<>();
        Map<String, LocalDate> expiry = new HashMap<>();
        Map<String, String> codes = new HashMap<>();
        for (var b :
                balances.findByWarehouseIdOrderByExpiryDateAscLotIdAscLocationIdAsc(warehouseId)) {
            if (rule.getLocationId() != null && !rule.getLocationId().equals(b.getLocationId()))
                continue;
            quantity.merge(b.getLotId(), b.getQuantityKg(), BigDecimal::add);
            expiry.merge(b.getLotId(), b.getExpiryDate(), (a, c) -> a.isBefore(c) ? a : c);
            codes.put(b.getLotId(), b.getLotCode());
        }
        Set<String> live = new HashSet<>();
        var today = LocalDate.ofInstant(clock.instant(), ZoneId.of("Asia/Ho_Chi_Minh"));
        for (var entry : quantity.entrySet()) {
            long days = ChronoUnit.DAYS.between(today, expiry.get(entry.getKey()));
            if (days <= rule.getThreshold().intValueExact()
                    && entry.getValue().compareTo(rule.getMinQuantityKg()) > 0) {
                String fingerprint = "RULE:" + rule.getId() + ":LOT:" + entry.getKey();
                live.add(fingerprint);
                alertOperations.raise(
                        warehouseId,
                        fingerprint,
                        rule.getKind().name(),
                        rule.getSeverity(),
                        rule.getName()
                                + " · "
                                + codes.get(entry.getKey())
                                + ": còn "
                                + days
                                + " ngày, tồn thực tế "
                                + plain(entry.getValue())
                                + " kg",
                        rule.getLocationId(),
                        rule.getId(),
                        null,
                        entry.getKey());
            }
        }
        for (var alert : alerts.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId))
            if (rule.getId().equals(alert.getRuleId()) && !live.contains(alert.getFingerprint()))
                alertOperations.resolve(alert, "Tồn và hạn dùng không còn thỏa quy tắc", "SYSTEM");
    }

    private String plain(BigDecimal value) {
        return value.stripTrailingZeros().toPlainString().replace('.', ',');
    }
}
