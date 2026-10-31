package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import org.hibernate.annotations.Check;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "warehouses")
@Check(
        constraints =
                "capacity_tons > 0 AND temp_target_c BETWEEN -999.9 AND 999.9 AND humidity_target"
                        + " BETWEEN 0 AND 100")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class Warehouse {
    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 200)
    private String location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private User manager;

    @Column(name = "capacity_tons", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityTons;

    @Builder.Default
    @Column(name = "temp_target_c", precision = 4, scale = 1)
    private BigDecimal tempTargetC = new BigDecimal("4.0");

    @Builder.Default
    @Column(name = "humidity_target", precision = 4, scale = 1)
    private BigDecimal humidityTarget = new BigDecimal("85.0");

    @Builder.Default
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
