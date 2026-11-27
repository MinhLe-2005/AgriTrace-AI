package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agri_order_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String orderCode;

    @Column(length = 128)
    private String farmName;

    @Column(length = 64)
    private String senderRole; // "CUSTOMER", "FARMER", "ADMIN"

    @Column(nullable = false, length = 128)
    private String senderName;

    @Column(length = 128)
    private String senderEmail;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    @Builder.Default
    @Column(length = 16)
    private String channel = "SHOP"; // "SHOP" (Customer <-> Farmer) or "ADMIN" (Customer <-> Admin Support)

    @Builder.Default
    @Column(length = 32)
    private String messageType = "CHAT"; // "CHAT", "DISPUTE_SUBMITTED", "DISPUTE_APPROVED", "DISPUTE_REJECTED", "SUPPORT_ESCALATED"

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private boolean isRead = false;
}
