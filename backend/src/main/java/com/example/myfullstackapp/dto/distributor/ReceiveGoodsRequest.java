package com.example.myfullstackapp.dto.distributor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Receive a delivery by either shipment code or a previously generated QR value. */
public record ReceiveGoodsRequest(
        @Size(max = 64) String shipmentCode,
        @Size(max = 255) String qrCode,
        @NotBlank @Size(max = 128) String receiverName,
        @Size(max = 32) String receiverPhone,
        @Size(max = 2000) String note,
        @ValidShipmentTimestamp String receivedAt
) { }
