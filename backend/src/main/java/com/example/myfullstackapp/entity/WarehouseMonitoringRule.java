package com.example.myfullstackapp.entity;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.RuleKind;

import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wh_monitoring_rules")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseMonitoringRule {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    private UUID locationId;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private RuleKind kind;

    @Column(name = "threshold_value", nullable = false, precision = 5, scale = 1)
    private BigDecimal threshold;

    @Column(nullable = false)
    private int durationMinutes;

    @Column(nullable = false)
    private int recoveryMinutes;

    @Column(precision = 14, scale = 3)
    private BigDecimal minQuantityKg;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false)
    private boolean enabled = true;

    @Column(nullable = false, length = 254)
    private String updatedBy;

    @Column(nullable = false)
    private Instant updatedAt;
}
