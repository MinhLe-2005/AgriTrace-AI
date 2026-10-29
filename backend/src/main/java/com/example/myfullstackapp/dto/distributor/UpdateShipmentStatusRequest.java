package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateShipmentStatusRequest(
        @NotBlank @Size(max = 32) String status,
        @NotBlank @Size(max = 255) String location,
        @DecimalMin(value = ShipmentValidation.MIN_TEMPERATURE_C, message = "Nhiệt độ phải từ -30 đến 40°C")
        @DecimalMax(value = ShipmentValidation.MAX_TEMPERATURE_C, message = "Nhiệt độ phải từ -30 đến 40°C") Double temperatureC,
        @DecimalMin(value = ShipmentValidation.MIN_HUMIDITY_PERCENT, message = "Độ ẩm phải từ 0 đến 100%")
        @DecimalMax(value = ShipmentValidation.MAX_HUMIDITY_PERCENT, message = "Độ ẩm phải từ 0 đến 100%") Double humidityPercent,
        @Size(max = 2000) String note,
        @ValidShipmentTimestamp String actualArrival
) { }
