package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "agri_farms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Farm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false, length = 255)
    private String owner;

    @Column(name = "owner_id", nullable = false, length = 64)
    private String ownerId;

    @Column(length = 32)
    private String phone;

    @Column(nullable = false, length = 500)
    private String address;

    @Column(length = 128)
    private String province;

    @Builder.Default
    private Double areaHectares = 1.0;

    @Column(length = 128)
    @Builder.Default
    private String certStandard = "VietGAP Trồng trọt";

    @Builder.Default
    private Double rating = 5.0;

    @Builder.Default
    private Boolean isDefault = false;

    @Column(length = 32)
    @Builder.Default
    private String verificationStatus = "APPROVED";

    @Column(length = 128)
    private String verificationDocType;

    @Column(columnDefinition = "TEXT")
    private String verificationDocUrl;

    @Column(length = 500)
    private String verificationNote;

    @Column(length = 500)
    private String verificationDecisionReason;

    private java.util.UUID verificationRequestId;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
