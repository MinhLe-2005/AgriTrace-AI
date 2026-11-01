package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "agri_shipment_receipts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShipmentReceipt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipment_id", nullable = false, unique = true)
    private Shipment shipment;

    @Column(nullable = false, length = 128)
    private String receiverName;

    @Column(length = 32)
    private String receiverPhone;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(length = 255)
    private String qrValue;

    @Column(nullable = false)
    private Instant receivedAt;
}
