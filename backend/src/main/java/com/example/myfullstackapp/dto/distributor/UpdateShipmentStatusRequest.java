package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateShipmentStatusRequest(
        @NotBlank @Size(max = 32) String status,
        @NotBlank @Size(max = 255) String location,
        Double temperatureC,
        Double humidityPercent,
        @Size(max = 2000) String note
) { }
