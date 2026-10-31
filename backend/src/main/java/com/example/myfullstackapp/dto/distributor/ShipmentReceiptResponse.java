package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;

public record ShipmentReceiptResponse(
        String receiverName,
        String receiverPhone,
        String note,
        String qrValue,
        Instant receivedAt
) { }
