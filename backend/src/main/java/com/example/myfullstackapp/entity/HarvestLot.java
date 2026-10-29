package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "agri_harvest_lots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HarvestLot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 255)
    private String product;

    @Column(length = 64)
    private String plantingDate;

    @Column(nullable = false, length = 64)
    private String harvestDate;

    @Column(nullable = false, length = 64)
    private String expiryDate;

    @Column(nullable = false, length = 32)
    private String qty;

    @Column(length = 32)
    @Builder.Default
    private String unit = "kg";

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String status = "Chờ duyệt xuất kho";

    @Column(length = 32)
    @Builder.Default
    private String statusColor = "#f97316";

    @Column(length = 64)
    @Builder.Default
    private String cert = "VietGAP";

    @Column(length = 255)
    private String cultivation;

    @Column(length = 255)
    @Builder.Default
    private String farmName = "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)";

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
