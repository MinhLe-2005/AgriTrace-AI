package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/** Durable message in the one Admin ↔ Distributor thread for a shipment. */
@Entity
@Table(name = "distributor_shipment_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistributorShipmentMessage {
    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @Column(name = "shipment_code", nullable = false, length = 64)
    private String shipmentCode;

    @Column(name = "sender_id", nullable = false)
    private UUID senderId;

    @Column(name = "sender_email", nullable = false, length = 254)
    private String senderEmail;

    @Column(name = "sender_name", nullable = false, length = 120)
    private String senderName;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender_role", nullable = false, length = 24)
    private DistributorMessageSenderRole senderRole;

    @Column(nullable = false, length = 2000)
    private String content;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @CreationTimestamp
    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;
}
