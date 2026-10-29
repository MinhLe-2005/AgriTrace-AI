package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateShipmentRequest(
        @Size(max = 64) String shipmentCode,
        List<@Size(max = 64) String> orderCodes,
        @NotBlank @Size(max = 128) String driverName,
        @Size(max = 32) String driverPhone,
        @NotBlank @Size(max = 64) String vehicleNumber,
        @NotBlank @Size(max = 255) String origin,
        @NotBlank @Size(max = 255) String destination,
        @NotBlank @Size(max = 500) String productSummary,
        @Size(max = 64) String lotCode,
        @DecimalMin(value = "-10.0", message = "Nhiệt độ phải từ -10 đến 40°C")
        @DecimalMax(value = "40.0", message = "Nhiệt độ phải từ -10 đến 40°C") Double temperatureC,
        String dispatchTime,
        String estimatedArrival
) { }
