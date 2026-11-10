package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wh_alert_actions")
@Getter
@Setter
@NoArgsConstructor
public class AlertAction {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID alertId;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, length = 500)
    private String note;

    @Column(nullable = false, length = 254)
    private String actor;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
