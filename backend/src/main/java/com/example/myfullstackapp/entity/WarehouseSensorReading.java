package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "wh_sensor_readings",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_wh_sensor_message",
                        columnNames = {"device_id", "message_id"}))
@Getter
@Setter
@NoArgsConstructor
public class WarehouseSensorReading {
    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false)
    private UUID deviceId;

    private UUID locationId;

    @Column(nullable = false)
    private UUID messageId;

    @Column(nullable = false)
    private Instant recordedAt;

    @Column(nullable = false)
    private Instant receivedAt;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal temperature;

    @Column(nullable = false, precision = 4, scale = 1)
    private BigDecimal humidity;
}
