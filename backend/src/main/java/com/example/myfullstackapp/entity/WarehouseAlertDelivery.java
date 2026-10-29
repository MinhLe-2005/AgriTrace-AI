package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wh_alert_deliveries")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseAlertDelivery {
    @Id
    private UUID id;

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false)
    private UUID alertId;

    @Column(nullable = false, length = 100)
    private String chatId;

    @Column(nullable = false, length = 3500)
    private String message;

    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(nullable = false)
    private int attempts;

    @Column(length = 100)
    private String lastError;

    @Column(nullable = false)
    private Instant nextAttemptAt;

    private Instant sentAt;
}
