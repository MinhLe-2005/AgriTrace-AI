package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;

public record QrCodeResponse(
        String code,
        String batchCode,
        String shipmentCode,
        String productId,
        String generatedBy,
        Long scanCount,
        Instant createdAt,
        String farmName,
        String harvestDate,
        String certStandard
) { }
