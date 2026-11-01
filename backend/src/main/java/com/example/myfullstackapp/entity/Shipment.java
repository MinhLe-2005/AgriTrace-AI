package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Isolated Distributor shipment record. It intentionally does not alter the
 * existing Order entity so current order and customer flows remain unchanged.
 */
@Entity
@Table(name = "agri_shipments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shipment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String shipmentCode;

    @Column(length = 254)
    private String distributorEmail;

    @Column(columnDefinition = "TEXT")
    private String orderCodes;

    @Column(nullable = false, length = 128)
    private String driverName;

    @Column(length = 32)
    private String driverPhone;

    @Column(nullable = false, length = 64)
    private String vehicleNumber;

    @Column(nullable = false, length = 255)
    private String origin;

    @Column(nullable = false, length = 255)
    private String destination;

    @Column(nullable = false, length = 500)
    private String productSummary;

    @Column(length = 64)
    private String lotCode;

    @Builder.Default
    private Double temperatureC = 4.5;

    @Builder.Default
    @Column(nullable = false, length = 32)
    private String status = "PREPARING";

    private Instant dispatchTime;
    private Instant estimatedArrival;
    private Instant actualArrival;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
