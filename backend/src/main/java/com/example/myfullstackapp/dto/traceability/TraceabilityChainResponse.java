package com.example.myfullstackapp.dto.traceability;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * A read-only, end-to-end view of the information that is already recorded
 * for a harvested batch.  Nullable fields mean that the corresponding step
 * has not been recorded yet; they are not synthesized from seed data.
 */
public record TraceabilityChainResponse(
        String batchCode,
        String productName,
        FarmInfo farm,
        HarvestInfo harvest,
        WarehouseInfo warehouse,
        List<ShipmentInfo> shipments,
        DeliveryInfo delivery,
        List<TimelineEvent> timeline
) {
    public record FarmInfo(
            String name,
            String location,
            String certification,
            String cultivation
    ) { }

    public record HarvestInfo(
            String harvestDate,
            String expiryDate,
            String qualityResult
    ) { }

    public record WarehouseInfo(List<WarehouseStop> stops) { }

    public record WarehouseStop(
            UUID warehouseId,
            String warehouseName,
            String location,
            Instant receivedAt,
            Double targetTemperatureC,
            BigDecimal quantityKg
    ) { }

    public record ShipmentInfo(
            String shipmentCode,
            String status,
            String driverName,
            String vehicleNumber,
            String origin,
            String destination,
            Double temperatureC,
            Instant dispatchTime,
            Instant estimatedArrival,
            Instant actualArrival,
            List<TrackingEventInfo> trackingEvents
    ) { }

    public record TrackingEventInfo(
            String location,
            Double temperatureC,
            Double humidityPercent,
            String status,
            String note,
            Instant timestamp
    ) { }

    public record DeliveryInfo(
            String receiverName,
            String receiverPhone,
            String receiverAddress,
            Instant receivedAt,
            String qrValue
    ) { }

    public record TimelineEvent(
            String stage,
            String title,
            String description,
            String location,
            Double temperatureC,
            Instant timestamp
    ) { }
}
