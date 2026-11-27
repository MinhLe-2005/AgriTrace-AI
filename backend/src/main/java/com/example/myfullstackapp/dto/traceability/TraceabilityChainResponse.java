package com.example.myfullstackapp.dto.traceability;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Public information only. Missing stages and measurements are left empty. */
public record TraceabilityChainResponse(
        String batchCode, String productName, String source, FarmInfo farm, HarvestInfo harvest,
        WarehouseInfo warehouse, List<ShipmentInfo> shipments, DeliveryInfo delivery,
        List<TimelineEvent> timeline) {
    public record FarmInfo(String name, String location, String certification, String cultivation) {}

    public record HarvestInfo(String harvestDate, String expiryDate, String qualityResult) {}

    public record WarehouseInfo(List<WarehouseStop> stops) {}

    public record WarehouseStop(UUID warehouseId, String warehouseName, String location,
            Instant receivedAt, Double targetTemperatureC, BigDecimal quantityKg, Measurement measurement) {}

    /** A representative warehouse-wide reading recorded during the lot's stay. */
    public record Measurement(BigDecimal temperatureC, BigDecimal humidityPercent, Instant recordedAt,
            boolean simulated) {}

    public record ShipmentInfo(String shipmentCode, String status, BigDecimal quantityKg,
            Instant dispatchTime, Instant estimatedArrival, Instant actualArrival,
            List<TrackingEventInfo> trackingEvents) {}

    public record TrackingEventInfo(Double temperatureC, Double humidityPercent, String status, Instant timestamp) {}

    public record DeliveryInfo(Instant receivedAt) {}

    public record TimelineEvent(String stage, String title, String description, String location,
            Double temperatureC, Instant timestamp) {}
}
