package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;
import java.util.UUID;

public record DistributorChatMessageResponse(
        UUID id,
        String shipmentCode,
        String senderEmail,
        String senderName,
        String senderRole,
        String content,
        boolean read,
        Instant sentAt
) { }
