package com.example.myfullstackapp.service;

import com.example.myfullstackapp.config.WarehouseMonitoringProperties;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseMonitoringService {
    private static final ObjectMapper SNAPSHOTS = new ObjectMapper();
    private final InventoryService inventory;
    private final WarehouseMonitoringSettingsRepository settings;
    private final WarehouseSensorDeviceRepository devices;
    private final WarehouseSensorReadingRepository readings;
    private final WarehouseMonitoringRuleRepository rules;
    private final WarehouseMonitoringRuleRevisionRepository revisions;
    private final RiskAlertRepository alerts;
    private final WarehouseMonitoringAlerts alertOperations;
    private final WarehouseMonitoringProperties properties;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Transactional(readOnly = true)
    public SettingsView settings(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        var value = settings.findById(warehouseId).orElseGet(WarehouseMonitoringSettings::new);
        return new SettingsView(
                value.getMaxGapSeconds(),
                value.isTelegramEnabled(),
                value.getTelegramChatId(),
                !properties.getTelegramBotToken().isBlank());
    }

    @Transactional
    public SettingsView settings(UUID warehouseId, SettingsInput input) {
        inventory.lock(warehouseId, null);
        if (input.telegramEnabled()
                && (properties.getTelegramBotToken().isBlank()
                        || input.telegramChatId() == null
                        || input.telegramChatId().isBlank()))
            throw new IllegalArgumentException(
                    "Configure the server bot token and a Telegram chat ID before enabling"
                            + " notifications");
        if (input.telegramChatId() != null
                && !input.telegramChatId().isBlank()
                && !input.telegramChatId().matches("-?[0-9]{1,20}|@[A-Za-z0-9_]{5,32}"))
            throw new IllegalArgumentException("Invalid Telegram chat ID");
        var value = settings.findById(warehouseId).orElseGet(WarehouseMonitoringSettings::new);
        value.setWarehouseId(warehouseId);
        value.setMaxGapSeconds(input.maxGapSeconds());
        value.setTelegramEnabled(input.telegramEnabled());
        value.setTelegramChatId(
                input.telegramChatId() == null ? null : input.telegramChatId().trim());
        settings.saveAndFlush(value);
        events.publishEvent(new Changed(warehouseId, "SETTINGS"));
        return settings(warehouseId);
    }

    @Transactional(readOnly = true)
    public List<DeviceView> devices(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        return devices.findByWarehouseIdOrderByCreatedAtAsc(warehouseId).stream()
                .map(this::deviceView)
                .toList();
    }

    @Transactional
    public DeviceSecret createDevice(UUID warehouseId, DeviceInput input, String actor) {
        inventory.lock(warehouseId, null);
        if (input.locationId() != null) inventory.location(warehouseId, input.locationId(), true);
        var current = devices.findByWarehouseIdOrderByCreatedAtAsc(warehouseId);
        if (current.stream().filter(WarehouseSensorDevice::isActive).count() >= 50)
            throw new ConflictException("At most 50 active sensors per warehouse");
        if (current.stream()
                .anyMatch(
                        d -> d.isActive() && Objects.equals(d.getLocationId(), input.locationId())))
            throw new ConflictException(
                    "This scope already has an active sensor; disable it before replacement");
        byte[] secret = new byte[32];
        new SecureRandom().nextBytes(secret);
        String key = Base64.getUrlEncoder().withoutPadding().encodeToString(secret);
        var device = new WarehouseSensorDevice();
        device.setWarehouseId(warehouseId);
        device.setLocationId(input.locationId());
        device.setName(input.name().trim());
        device.setSimulated(input.simulated());
        device.setKeyHash(hash(key));
        device.setCreatedBy(actor);
        device.setCreatedAt(clock.instant());
        devices.saveAndFlush(device);
        events.publishEvent(new Changed(warehouseId, "DEVICES"));
        return new DeviceSecret(deviceView(device), key);
    }

    @Transactional
    public DeviceView disableDevice(UUID warehouseId, UUID id, String actor) {
        inventory.lock(warehouseId, null);
        var device =
                devices.findByIdAndWarehouseId(id, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Sensor not found"));
        device.setActive(false);
        devices.saveAndFlush(device);
        for (var alert : alerts.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId))
            if (id.equals(alert.getDeviceId()))
                alertOperations.resolve(alert, "Thiết bị đã được ngừng sử dụng", actor);
        events.publishEvent(new Changed(warehouseId, "DEVICES"));
        return deviceView(device);
    }

    @Transactional(readOnly = true)
    public List<RuleView> rules(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        return rules.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId).stream()
                .map(this::ruleView)
                .toList();
    }

    @Transactional
    public RuleView saveRule(UUID warehouseId, UUID id, RuleInput input, String actor) {
        inventory.lock(warehouseId, null);
        if (input.locationId() != null) inventory.location(warehouseId, input.locationId(), false);
        boolean stock = input.kind() == RuleKind.NEAR_EXPIRY_HIGH_STOCK;
        if (stock) {
            if (input.threshold().scale() > 0 && input.threshold().stripTrailingZeros().scale() > 0)
                throw new IllegalArgumentException("Remaining days must be an integer");
            if (input.threshold().signum() < 0
                    || input.threshold().compareTo(new BigDecimal("365")) > 0
                    || input.minQuantityKg() == null)
                throw new IllegalArgumentException(
                        "Stock rule requires 0-365 remaining days and a quantity threshold");
            if (input.durationMinutes() != 0 || input.recoveryMinutes() != 0)
                throw new IllegalArgumentException(
                        "Stock rules are evaluated from current balances without sensor-duration"
                                + " settings");
        } else {
            boolean humidity =
                    input.kind() == RuleKind.HUMIDITY_HIGH || input.kind() == RuleKind.HUMIDITY_LOW;
            if (input.threshold().compareTo(humidity ? BigDecimal.ZERO : new BigDecimal("-100")) < 0
                    || input.threshold().compareTo(new BigDecimal("100")) > 0)
                throw new IllegalArgumentException(
                        "Sensor threshold is outside its supported range");
        }
        if (id == null && rules.countByWarehouseId(warehouseId) >= 20)
            throw new ConflictException("At most 20 monitoring rules per warehouse");
        var rule =
                id == null
                        ? new WarehouseMonitoringRule()
                        : rules.findByIdAndWarehouseId(id, warehouseId)
                                .orElseThrow(() -> new ResourceNotFoundException("Rule not found"));
        boolean changed =
                id == null
                        || rule.getKind() != input.kind()
                        || !Objects.equals(rule.getLocationId(), input.locationId())
                        || rule.getThreshold().compareTo(input.threshold()) != 0
                        || rule.getDurationMinutes() != input.durationMinutes()
                        || rule.getRecoveryMinutes() != input.recoveryMinutes()
                        || !rule.getSeverity().equals(input.severity())
                        || rule.isEnabled() != input.enabled()
                        || !sameNumber(
                                rule.getMinQuantityKg(), stock ? input.minQuantityKg() : null);
        boolean modified = changed || !Objects.equals(rule.getName(), input.name().trim());
        if (!modified) return ruleView(rule);
        rule.setWarehouseId(warehouseId);
        rule.setName(input.name().trim());
        rule.setKind(input.kind());
        rule.setLocationId(input.locationId());
        rule.setThreshold(input.threshold());
        rule.setDurationMinutes(input.durationMinutes());
        rule.setRecoveryMinutes(input.recoveryMinutes());
        rule.setMinQuantityKg(stock ? input.minQuantityKg() : null);
        rule.setSeverity(input.severity());
        rule.setEnabled(input.enabled());
        rule.setUpdatedBy(actor);
        rule.setUpdatedAt(clock.instant());
        rules.saveAndFlush(rule);
        var revision = new WarehouseMonitoringRuleRevision();
        revision.setWarehouseId(warehouseId);
        revision.setRuleId(rule.getId());
        revision.setActor(actor);
        revision.setCreatedAt(clock.instant());
        try {
            revision.setDefinition(
                    SNAPSHOTS.writeValueAsString(
                            new RuleInput(
                                    rule.getName(),
                                    rule.getKind(),
                                    rule.getLocationId(),
                                    rule.getThreshold(),
                                    rule.getDurationMinutes(),
                                    rule.getRecoveryMinutes(),
                                    rule.getMinQuantityKg(),
                                    rule.getSeverity(),
                                    rule.isEnabled())));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Cannot save rule revision", e);
        }
        revisions.save(revision);
        // A changed definition starts a new assessment; retain its previous audit trail.
        for (var alert : alerts.findByWarehouseIdOrderByUpdatedAtDesc(warehouseId))
            if (changed && rule.getId().equals(alert.getRuleId()))
                alertOperations.resolve(
                        alert,
                        input.enabled() ? "Cấu hình quy tắc thay đổi" : "Quy tắc đã tắt",
                        actor);
        events.publishEvent(new Changed(warehouseId, "RULES"));
        return ruleView(rule);
    }

    @Transactional(readOnly = true)
    public List<RuleRevisionView> ruleHistory(UUID warehouseId, UUID id, int page) {
        inventory.requireWarehouse(warehouseId);
        rules.findByIdAndWarehouseId(id, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Rule not found"));
        return revisions
                .findByWarehouseIdAndRuleIdOrderByCreatedAtDesc(
                        warehouseId, id, PageRequest.of(page, 100))
                .stream()
                .map(
                        r -> {
                            try {
                                return new RuleRevisionView(
                                        r.getId(),
                                        SNAPSHOTS.readValue(r.getDefinition(), RuleInput.class),
                                        r.getActor(),
                                        r.getCreatedAt());
                            } catch (JsonProcessingException e) {
                                throw new IllegalStateException("Cannot read rule revision", e);
                            }
                        })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReadingView> readings(UUID warehouseId, UUID deviceId, Instant from, Instant to) {
        inventory.requireWarehouse(warehouseId);
        var device =
                devices.findByIdAndWarehouseId(deviceId, warehouseId)
                        .orElseThrow(() -> new ResourceNotFoundException("Sensor not found"));
        if (from.isAfter(to) || Duration.between(from, to).compareTo(Duration.ofHours(24)) > 0)
            throw new IllegalArgumentException(
                    "Reading range must be ordered and at most 24 hours");
        int gap =
                settings.findById(warehouseId)
                        .map(WarehouseMonitoringSettings::getMaxGapSeconds)
                        .orElse(120);
        return readings
                .findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtDescReceivedAtDesc(
                        deviceId, from, to, PageRequest.of(0, 2000))
                .stream()
                .map(r -> readingView(r, device, gap, clock.instant()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReadingView> latest(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        int gap =
                settings.findById(warehouseId)
                        .map(WarehouseMonitoringSettings::getMaxGapSeconds)
                        .orElse(120);
        var now = clock.instant();
        return devices.findByWarehouseIdOrderByCreatedAtAsc(warehouseId).stream()
                .filter(WarehouseSensorDevice::isActive)
                .flatMap(
                        d ->
                                readings
                                        .findFirstByDeviceIdOrderByRecordedAtDescReceivedAtDesc(
                                                d.getId())
                                        .stream()
                                        .map(r -> readingView(r, d, gap, now)))
                .toList();
    }

    @Transactional(readOnly = true)
    public StatusView status(UUID warehouseId) {
        var deviceList = devices(warehouseId);
        return new StatusView(
                clock.instant(),
                (int) deviceList.stream().filter(DeviceView::active).count(),
                (int) latest(warehouseId).stream().filter(ReadingView::fresh).count(),
                settings(warehouseId).maxGapSeconds());
    }

    private DeviceView deviceView(WarehouseSensorDevice d) {
        var latest =
                readings.findFirstByDeviceIdOrderByRecordedAtDescReceivedAtDesc(d.getId())
                        .orElse(null);
        return new DeviceView(
                d.getId(),
                d.getWarehouseId(),
                d.getLocationId(),
                d.getName(),
                d.isActive(),
                d.isSimulated(),
                d.getCreatedAt(),
                latest == null ? null : latest.getRecordedAt(),
                latest == null ? null : latest.getReceivedAt());
    }

    private RuleView ruleView(WarehouseMonitoringRule r) {
        return new RuleView(
                r.getId(),
                r.getName(),
                r.getKind(),
                r.getLocationId(),
                r.getThreshold(),
                r.getDurationMinutes(),
                r.getRecoveryMinutes(),
                r.getMinQuantityKg(),
                r.getSeverity(),
                r.isEnabled(),
                r.getUpdatedBy(),
                r.getUpdatedAt());
    }

    public static ReadingView readingView(
            WarehouseSensorReading r, WarehouseSensorDevice d, int gap, Instant now) {
        return new ReadingView(
                r.getId(),
                r.getDeviceId(),
                r.getLocationId(),
                d.getName(),
                r.getRecordedAt(),
                r.getReceivedAt(),
                r.getTemperature(),
                r.getHumidity(),
                !r.getRecordedAt().isBefore(now.minusSeconds(gap))
                        && !r.getRecordedAt().isAfter(now),
                d.isSimulated());
    }

    public static String hash(String key) {
        try {
            return HexFormat.of()
                    .formatHex(
                            MessageDigest.getInstance("SHA-256")
                                    .digest(key.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }

    private boolean sameNumber(BigDecimal a, BigDecimal b) {
        return a == null ? b == null : b != null && a.compareTo(b) == 0;
    }
}
