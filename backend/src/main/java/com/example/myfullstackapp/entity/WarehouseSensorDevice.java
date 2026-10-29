package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wh_sensor_devices")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseSensorDevice {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    private UUID locationId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 64)
    private String keyHash;

    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false)
    private boolean simulated;

    @Column(nullable = false, length = 254)
    private String createdBy;

    @Column(nullable = false)
    private Instant createdAt;
}
