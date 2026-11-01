package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import org.hibernate.annotations.Check;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Entity
@Table(
        name = "wh_stock_balances",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_wh_balance_location_lot",
                        columnNames = {"location_id", "lot_id"}))
@Check(constraints = "quantity_kg >= 0")
@Getter
@Setter
@NoArgsConstructor
public class StockBalance {
    @Id
    private UUID id = UUID.randomUUID();
    @Version
    private long version;

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false)
    private UUID locationId;

    @Column(nullable = false)
    private String lotId;

    @Column(nullable = false)
    private String productId;

    @Column(nullable = false, length = 100)
    private String lotCode;

    @Column(nullable = false)
    private LocalDate expiryDate;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityKg = BigDecimal.ZERO;

    @Column(nullable = false)
    private boolean held;

    @Column(nullable = false)
    private Instant receivedAt = Instant.now();
}
