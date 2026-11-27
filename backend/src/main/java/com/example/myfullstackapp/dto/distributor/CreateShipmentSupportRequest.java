package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateShipmentSupportRequest(
        @NotBlank @Size(max = 1000) String message
) { }
