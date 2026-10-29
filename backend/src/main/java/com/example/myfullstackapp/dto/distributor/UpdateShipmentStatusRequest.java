package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateShipmentStatusRequest(
        @NotBlank @Size(max = 32) String status,
        @Size(max = 255) String location,
        @DecimalMin(value = "-10.0", message = "Nhiệt độ phải từ -10 đến 40°C")
        @DecimalMax(value = "40.0", message = "Nhiệt độ phải từ -10 đến 40°C") Double temperatureC,
        @DecimalMin(value = "0.0", message = "Độ ẩm phải từ 0 đến 100%")
        @DecimalMax(value = "100.0", message = "Độ ẩm phải từ 0 đến 100%") Double humidityPercent,
        @Size(max = 2000) String note,
        String actualArrival
) { }
