package com.example.myfullstackapp.dto.warehouse;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public final class WarehouseMonitoring {
    private WarehouseMonitoring() {}

    public enum RuleKind {
        TEMPERATURE_HIGH,
        TEMPERATURE_LOW,
        HUMIDITY_HIGH,
        HUMIDITY_LOW,
        NEAR_EXPIRY_HIGH_STOCK,
        SHELF_LIFE_LOW_HIGH_STOCK
    }

    public record SettingsInput(
            @Min(10) @Max(3600) int maxGapSeconds,
            boolean telegramEnabled,
            @Size(max = 100) String telegramChatId) {}

    public record SettingsView(
            int maxGapSeconds,
            boolean telegramEnabled,
            String telegramChatId,
            boolean telegramConfigured) {}

    public record DeviceInput(
            @NotBlank @Size(max = 100) String name, UUID locationId, boolean simulated) {}

    public record DeviceView(
            UUID id,
            UUID warehouseId,
            UUID locationId,
            String name,
            boolean active,
            boolean simulated,
            Instant createdAt,
            Instant latestRecordedAt,
            Instant lastReceivedAt) {}

    public record DeviceSecret(DeviceView device, String deviceKey) {}

    public record RuleInput(
            @NotBlank @Size(max = 100) String name,
            @NotNull RuleKind kind,
            UUID locationId,
            @NotNull @Digits(integer = 4, fraction = 1) BigDecimal threshold,
            @Min(0) @Max(1440) int durationMinutes,
            @Min(0) @Max(1440) int recoveryMinutes,
            @DecimalMin("0") @Digits(integer = 11, fraction = 3) BigDecimal minQuantityKg,
            @NotBlank @Pattern(regexp = "MEDIUM|HIGH|CRITICAL") String severity,
            boolean enabled) {}

    public record RuleView(
            UUID id,
            String name,
            RuleKind kind,
            UUID locationId,
            BigDecimal threshold,
            int durationMinutes,
            int recoveryMinutes,
            BigDecimal minQuantityKg,
            String severity,
            boolean enabled,
            String updatedBy,
            Instant updatedAt) {}

    public record RuleRevisionView(
            UUID id, RuleInput definition, String actor, Instant createdAt) {}

    public record TelemetryInput(
            @NotNull UUID deviceId,
            @NotBlank @Size(max = 100) String deviceKey,
            @NotNull UUID messageId,
            @NotNull Instant recordedAt,
            @NotNull @DecimalMin("-100") @DecimalMax("100") @Digits(integer = 3, fraction = 1)
                    BigDecimal temperature,
            @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 1)
                    BigDecimal humidity,
            boolean simulated) {}

    public record ReadingView(
            UUID id,
            UUID deviceId,
            UUID locationId,
            String deviceName,
            Instant recordedAt,
            Instant receivedAt,
            BigDecimal temperature,
            BigDecimal humidity,
            boolean fresh,
            boolean simulated) {}

    public record DeliveryView(
            UUID id,
            UUID alertId,
            String status,
            int attempts,
            String lastError,
            Instant nextAttemptAt,
            Instant sentAt) {}

    public record StatusView(
            Instant serverTime, int activeDevices, int freshDevices, int maxGapSeconds) {}

    public record AlertOpened(
            UUID eventId, UUID warehouseId, UUID alertId, String severity, String message) {}

    public record Changed(UUID warehouseId, String reason) {}
}
