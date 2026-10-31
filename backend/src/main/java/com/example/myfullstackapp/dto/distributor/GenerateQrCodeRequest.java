package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GenerateQrCodeRequest(
        @NotBlank @Size(max = 64) String batchCode,
        @Size(max = 64) String shipmentCode,
        @Size(max = 64) String productId
) { }
