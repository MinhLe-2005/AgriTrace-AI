package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.util.List;

/** Partial edit request for the non-status fields of a shipment. */
public record UpdateShipmentRequest(
        List<@Size(max = 64) String> orderCodes,
        @Size(max = 128) String driverName,
        @Size(max = 32) String driverPhone,
        @Size(max = 64) String vehicleNumber,
        @Size(max = 255) String origin,
        @Size(max = 255) String destination,
        @Size(max = 500) String productSummary,
        @Size(max = 64) String lotCode,
        @DecimalMin(value = ShipmentValidation.MIN_TEMPERATURE_C, message = "Nhiệt độ phải từ -30 đến 40°C")
        @DecimalMax(value = ShipmentValidation.MAX_TEMPERATURE_C, message = "Nhiệt độ phải từ -30 đến 40°C") Double temperatureC,
        @ValidShipmentTimestamp String dispatchTime,
        @ValidShipmentTimestamp String estimatedArrival
) { }
