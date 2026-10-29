package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;
import java.util.List;

public record ShipmentResponse(
        Long id,
        String shipmentCode,
        List<String> orderCodes,
        String driverName,
        String driverPhone,
        String vehicleNumber,
        String origin,
        String destination,
        String productSummary,
        String lotCode,
        Double temperatureC,
        String status,
        Instant dispatchTime,
        Instant estimatedArrival,
        Instant actualArrival,
        Instant createdAt,
        List<TrackingEventResponse> trackingEvents,
        ShipmentReceiptResponse receipt
) { }
