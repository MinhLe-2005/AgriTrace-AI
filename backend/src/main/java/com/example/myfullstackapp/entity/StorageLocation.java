package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import org.hibernate.annotations.Check;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "storage_locations",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_storage_locations_warehouse_code",
                        columnNames = {"warehouse_id", "code"}))
@Check(
        constraints =
                "capacity_tons > 0 AND temp_target_c BETWEEN -999.9 AND 999.9 AND humidity_target"
                    + " BETWEEN 0 AND 100 AND code = upper(trim(code)) AND length(trim(code)) > 0")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(of = "id")
public class StorageLocation {
    @Id
    @Builder.Default
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "warehouse_id", nullable = false)
    private Warehouse warehouse;

    @Column(nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(name = "capacity_tons", nullable = false, precision = 10, scale = 2)
    private BigDecimal capacityTons;

    @Column(name = "temp_target_c", nullable = false, precision = 4, scale = 1)
    private BigDecimal tempTargetC;

    @Column(name = "humidity_target", nullable = false, precision = 4, scale = 1)
    private BigDecimal humidityTarget;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
