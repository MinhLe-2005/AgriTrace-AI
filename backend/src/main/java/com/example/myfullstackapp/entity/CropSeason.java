package com.example.myfullstackapp.entity;

import com.example.myfullstackapp.service.CropSeasonCalculator;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "agri_crop_seasons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropSeason {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_id", nullable = false, length = 64)
    private String ownerId;

    @Column(name = "farm_code", length = 64)
    private String farmCode;

    @Column(name = "product_name", nullable = false, length = 255)
    private String productName;

    @Column(name = "category_code", length = 64)
    @Builder.Default
    private String categoryCode = "trai_cay";

    @Column(name = "start_month", nullable = false)
    private Integer startMonth;

    @Column(name = "end_month", nullable = false)
    private Integer endMonth;

    @Column(name = "peak_multiplier")
    @Builder.Default
    private Double peakMultiplier = 1.30;

    @Column(length = 500)
    private String notes;

    @Builder.Default
    private Boolean active = true;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Transient
    private Integer previewMonth;

    @Transient
    public String getSeasonCode() {
        return evaluateCurrent().code().name();
    }

    @Transient
    public String getSeasonLabel() {
        return evaluateCurrent().label();
    }

    @Transient
    @JsonProperty("crossYear")
    public boolean isCrossYear() {
        return evaluateCurrent().crossYear();
    }

    @Transient
    public int getDurationMonths() {
        return evaluateCurrent().durationMonths();
    }

    @Transient
    public double getEffectiveDemandMultiplier() {
        return CropSeasonCalculator.computeDemandMultiplier(evaluateCurrent().code(), peakMultiplier);
    }

    private CropSeasonCalculator.SeasonEvaluation evaluateCurrent() {
        int s = startMonth != null && startMonth >= 1 && startMonth <= 12 ? startMonth : 1;
        int e = endMonth != null && endMonth >= 1 && endMonth <= 12 ? endMonth : 12;
        int m = previewMonth != null && previewMonth >= 1 && previewMonth <= 12
                ? previewMonth
                : java.time.LocalDate.now().getMonthValue();
        return CropSeasonCalculator.evaluate(s, e, m);
    }
}
