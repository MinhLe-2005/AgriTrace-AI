package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agri_traceability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraceabilityRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String batchCode;

    @Column(nullable = false, length = 255)
    private String productName;

    @Column(length = 255)
    private String farmName;

    @Column(length = 255)
    private String location;

    @Column(length = 64)
    private String harvestDate;

    @Column(length = 128)
    private String certType;

    @Column(length = 255)
    private String labResult;

    @Column(length = 64)
    private String tempAvg;

    @Column(length = 255)
    private String inspector;

    @Column(columnDefinition = "TEXT")
    private String timelineJson;
}
