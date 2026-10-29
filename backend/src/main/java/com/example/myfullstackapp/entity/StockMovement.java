package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "wh_stock_movements",
        indexes =
                @Index(name = "ix_wh_movement_scope_time", columnList = "warehouse_id,occurred_at")
                )
@Getter
@Setter
@NoArgsConstructor
public class StockMovement {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false)
    private UUID locationId;

    @Column(nullable = false)
    private String lotId;

    @Column(nullable = false)
    private UUID documentId;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal deltaKg;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal balanceAfterKg;

    @Column(nullable = false, length = 254)
    private String actor;

    @Column(nullable = false)
    private Instant occurredAt = Instant.now();
}
