package com.example.myfullstackapp.event;

import com.example.myfullstackapp.entity.DistributorNotificationType;

import java.time.Instant;
import java.util.UUID;

/** Published after a notification has been saved; delivered by SSE after commit. */
public record DistributorNotificationCreated(
        UUID notificationId,
        String recipientEmail,
        boolean adminRecipient,
        DistributorNotificationType type,
        String referenceCode,
        Instant occurredAt
) { }
