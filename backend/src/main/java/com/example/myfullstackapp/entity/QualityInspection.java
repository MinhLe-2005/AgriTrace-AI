package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wh_quality_inspections")
@Getter
@Setter
@NoArgsConstructor
public class QualityInspection {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false)
    private UUID balanceId;

    @Column(nullable = false)
    private boolean held;

    @Column(nullable = false, length = 500)
    private String note;

    @Column(nullable = false, length = 254)
    private String actor;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();
}
