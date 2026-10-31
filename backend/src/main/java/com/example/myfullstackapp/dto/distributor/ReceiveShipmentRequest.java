package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReceiveShipmentRequest(
        @NotBlank @Size(max = 128) String receiverName,
        @Size(max = 32) String receiverPhone,
        @Size(max = 2000) String note,
        @Size(max = 255) String qrValue,
        @ValidShipmentTimestamp String receivedAt
) { }
