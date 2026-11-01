package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Check(constraints = "kg_per_unit > 0")
@Table(
        name = "wh_unit_conversions",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_wh_unit_conversion",
                        columnNames = {"product_key", "unit"}))
@Getter
@Setter
@NoArgsConstructor
public class WarehouseUnitConversion {
    @Id
    private UUID id = UUID.randomUUID();
    @Version
    private long version;

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false, length = 255)
    private String productKey;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(nullable = false, precision = 14, scale = 6)
    private BigDecimal kgPerUnit;

    @Column(nullable = false, length = 254)
    private String updatedBy;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();
}
