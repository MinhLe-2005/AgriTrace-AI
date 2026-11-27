package com.example.myfullstackapp.dto.distributor;

import java.time.Instant;
import java.util.UUID;

public record DistributorNotificationResponse(
        UUID id,
        String type,
        String title,
        String content,
        String referenceCode,
        boolean read,
        Instant createdAt,
        Instant readAt
) { }
