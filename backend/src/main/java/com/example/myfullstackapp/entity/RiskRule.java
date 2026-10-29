package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "wh_risk_rules")
@Getter
@Setter
@NoArgsConstructor
public class RiskRule {
    @Id
    private UUID warehouseId;

    @Column(nullable = false)
    private int expiryWarningDays = 3;

    @Column(nullable = false)
    private int staleDays = 14;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal lowStockKg = new BigDecimal("100");
}
