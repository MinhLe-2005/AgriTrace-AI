package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wh_monitor_rule_revisions")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseMonitoringRuleRevision {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false, updatable = false)
    private UUID warehouseId;

    @Column(nullable = false, updatable = false)
    private UUID ruleId;

    @Column(nullable = false, updatable = false, length = 2000)
    private String definition;

    @Column(nullable = false, updatable = false, length = 254)
    private String actor;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
