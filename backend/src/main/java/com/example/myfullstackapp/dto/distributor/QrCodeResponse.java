package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;

public record QrCodeResponse(
        String code,
        String batchCode,
        String shipmentCode,
        String productId,
        String generatedBy,
        Instant createdAt
) { }
