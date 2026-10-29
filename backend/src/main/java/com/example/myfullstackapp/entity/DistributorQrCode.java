package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

/** QR records scoped to the Distributor module without changing legacy tables. */
@Entity
@Table(name = "agri_distributor_qr_codes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DistributorQrCode {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String code;

    @Column(nullable = false, length = 64)
    private String batchCode;

    @Column(length = 64)
    private String shipmentCode;

    @Column(length = 64)
    private String productId;

    @Column(nullable = false, length = 254)
    private String generatedBy;

    @Builder.Default
    @Column(nullable = false)
    private Long scanCount = 0L;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
