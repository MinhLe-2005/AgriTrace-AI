package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "wh_risk_alerts",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_wh_alert_fingerprint",
                        columnNames = {"warehouse_id", "fingerprint"}))
@Getter
@Setter
@NoArgsConstructor
public class RiskAlert {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false, length = 150)
    private String fingerprint;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
