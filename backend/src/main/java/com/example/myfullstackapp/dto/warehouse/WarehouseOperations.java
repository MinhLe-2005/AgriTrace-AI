package com.example.myfullstackapp.dto.warehouse;

import com.example.myfullstackapp.entity.WarehouseDocument;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public final class WarehouseOperations {
    private WarehouseOperations() {}

    public record LineInput(
            @NotNull
            String lotId,
            @NotNull
            UUID locationId,
            UUID targetLocationId,
            @NotNull
            @DecimalMin("0")
            @Digits(integer = 11, fraction = 3)
            BigDecimal quantityKg) {}

    public record DocumentInput(
            UUID targetWarehouseId,
            UUID reservationId,
            @Size(max = 500)
            String note,
            @NotEmpty
            @Size(max = 100)
            List<@Valid LineInput> lines) {}

    public record LineView(
            UUID id,
            String lotId,
            UUID locationId,
            UUID targetLocationId,
            BigDecimal quantityKg,
            BigDecimal expectedKg) {}

    public record DocumentView(
            UUID id,
            UUID warehouseId,
            UUID targetWarehouseId,
            WarehouseDocument.Type type,
            WarehouseDocument.Status status,
            UUID reservationId,
            String note,
            String handoverReference,
            String createdBy,
            String confirmedBy,
            Instant createdAt,
            Instant confirmedAt,
            List<LineView> lines) {}

    public record BalanceView(
            UUID id,
            UUID warehouseId,
            UUID locationId,
            String lotId,
            String productId,
            String lotCode,
            LocalDate expiryDate,
            BigDecimal quantityKg,
            BigDecimal reservedKg,
            BigDecimal availableKg,
            boolean held,
            Instant receivedAt) {}

    public record MovementView(
            UUID id,
            String lotId,
            UUID locationId,
            UUID documentId,
            String type,
            BigDecimal deltaKg,
            BigDecimal balanceAfterKg,
            String actor,
            Instant occurredAt) {}

    public record ReserveInput(
            @NotNull
            @Positive
            Long orderId,
            @NotNull
            String productId,
            @NotNull
            @DecimalMin("0.001")
            @Digits(integer = 11, fraction = 3)
            BigDecimal quantityKg,
            @Min(1)
            @Max(1440)
            int ttlMinutes) {}

    public record AllocationView(
            UUID balanceId,
            String lotId,
            UUID locationId,
            String lotCode,
            LocalDate expiryDate,
            BigDecimal quantityKg) {}

    public record ReservationView(
            UUID id, Long orderId, String status, Instant expiresAt, List<AllocationView> lines) {}

    public record FefoInput(
            @NotNull
            String productId,
            @NotNull
            @DecimalMin("0.001")
            @Digits(integer = 11, fraction = 3)
                    BigDecimal quantityKg) {}

    public record InspectionInput(
            @NotNull
            UUID balanceId, boolean held, @NotBlank @Size(max = 500) String note) {}

    public record InspectionView(
            UUID id, UUID balanceId, boolean held, String note, String actor, Instant createdAt) {}

    public record HandoverInput(@NotBlank @Size(max = 150) String reference) {}

    public record RuleInput(
            @Min(0)
            @Max(365)
            int expiryWarningDays,
            @Min(1)
            @Max(3650)
            int staleDays,
            @NotNull
            @DecimalMin("0")
            @Digits(integer = 11, fraction = 3)
            BigDecimal lowStockKg) {}

    public record AlertInput(
            @NotBlank
            @Pattern(regexp = "ACKNOWLEDGED|RESOLVED")
            String status,
            @NotBlank
            @Size(max = 500)
            String note) {}

    public record AlertView(
            UUID id,
            String type,
            String severity,
            String message,
            String status,
            Instant updatedAt) {}

    public record AlertActionView(
            UUID id, String status, String note, String actor, Instant createdAt) {}

    public record Forecast(
            String productId,
            BigDecimal availableKg,
            BigDecimal dailyOutboundKg,
            BigDecimal daysToClear,
            LocalDate earliestExpiry,
            String evidence,
            String recommendation) {}

    public record Dashboard(
            BigDecimal onHandKg,
            BigDecimal reservedKg,
            BigDecimal availableKg,
            BigDecimal inboundKg,
            BigDecimal outboundKg,
            BigDecimal capacityKg,
            long heldBalances,
            long expiringBalances,
            long openAlerts,
            long draftDocuments,
            LocalDate from,
            LocalDate to) {}

    public record LotSummary(
            String id,
            String productId,
            String lotCode,
            LocalDate expiryDate,
            BigDecimal initialQuantity,
            String unit,
            String status) {}
}
