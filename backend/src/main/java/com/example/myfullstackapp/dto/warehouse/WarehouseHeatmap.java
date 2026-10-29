package com.example.myfullstackapp.dto.warehouse;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.ReadingView;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;

public final class WarehouseHeatmap {
    private WarehouseHeatmap() {}

    public record LayoutInput(
            @Min(1) @Max(30) int row, @Min(1) @Max(30) int column, @Min(1) @Max(10) int level) {}

    public record LayoutView(int row, int column, int level, String updatedBy, Instant updatedAt) {}

    public record Signal(String state, String label) {}

    public record Cell(
            UUID locationId,
            String code,
            String name,
            boolean active,
            LayoutView layout,
            BigDecimal capacityKg,
            BigDecimal quantityKg,
            BigDecimal heldKg,
            BigDecimal reservedKg,
            BigDecimal availableKg,
            BigDecimal occupancyPercent,
            LocalDate earliestExpiry,
            Signal capacity,
            Signal expiry,
            Signal temperature,
            Signal overall,
            ReadingView reading,
            String measurementScope,
            String temperaturePolicy,
            List<BalanceView> lots,
            List<AlertView> alerts) {}

    public record MapView(
            UUID warehouseId,
            Instant generatedAt,
            int expiryWarningDays,
            List<Cell> cells,
            long warehouseAlerts) {}
}
