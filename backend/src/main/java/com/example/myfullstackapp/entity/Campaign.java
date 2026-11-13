package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** Sự kiện / chiến dịch giảm giá theo mùa vụ do admin quản lý. */
@Entity
@Table(name = "agri_campaigns")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Campaign {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(name = "campaign_type", nullable = false, length = 32)
    private String type;

    @Column(length = 100)
    private String typeLabel;

    @Column(length = 160)
    private String typeColor;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    @Column(nullable = false)
    private Integer discountPercent;

    private Long discountAmount;

    @Column(nullable = false, length = 16)
    private String targetType;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private List<String> targetCategoryCodes = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private List<String> targetProductIds = new ArrayList<>();

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private List<String> targetProductNames = new ArrayList<>();

    @Column(length = 64)
    private String voucherCode;

    @Column(length = 32)
    private String bannerIcon;

    @Column(length = 100)
    private String badgeText;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String fullContent;

    @Column(nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(nullable = false)
    private Instant createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
