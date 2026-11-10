package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "wh_monitoring_settings")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseMonitoringSettings {
    @Id
    private UUID warehouseId;

    @Column(nullable = false)
    private int maxGapSeconds = 120;

    @Column(nullable = false)
    private boolean telegramEnabled;

    @Column(length = 100)
    private String telegramChatId;
}
