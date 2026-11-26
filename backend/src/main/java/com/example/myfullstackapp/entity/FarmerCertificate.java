package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "agri_farmer_certificates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerCertificate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String certNumber;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 100)
    private String farmCode;

    @Column(name = "owner_id", length = 64)
    private String ownerId;

    @Column(length = 255)
    @Builder.Default
    private String farmName = "Nông Trại Xanh Đà Lạt (Mã: NT-DL-01)";

    @Column(length = 200)
    private String issuedBy;

    @Column(length = 32)
    private String issueDate;

    @Column(nullable = false, length = 32)
    private String expiryDate;

    @Column(length = 50)
    @Builder.Default
    private String status = "VALID";

    @Column(length = 254)
    private String alertEmail;

    private LocalDate lastAlertSentDate;

    @Column(length = 50)
    @Builder.Default
    private String approvalStatus = "NONE";

    @Column(length = 100)
    private String pendingNewCertNumber;

    @Column(length = 32)
    private String pendingRequestedExpiryDate;

    @Column(columnDefinition = "TEXT")
    private String pendingProofImage;

    @Column(length = 500)
    private String pendingNote;

    @Column(length = 50)
    private String submittedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @Transient
    public Integer getDaysLeft() {
        return calculateDaysLeft();
    }

    @Transient
    public String evaluateValidityStatus() {
        Integer daysLeft = calculateDaysLeft();
        if (daysLeft == null) {
            return status != null && !status.isBlank() ? status : "VALID";
        }
        if (daysLeft < 0) {
            return "EXPIRED";
        }
        if (daysLeft <= 30) {
            return "EXPIRING_SOON";
        }
        return "VALID";
    }

    public Integer calculateDaysLeft() {
        LocalDate exp = parseExpiryDate();
        if (exp == null) return null;
        return (int) ChronoUnit.DAYS.between(LocalDate.now(), exp);
    }

    public LocalDate parseExpiryDate() {
        if (expiryDate == null || expiryDate.isBlank()) return null;
        String trimmed = expiryDate.trim();
        try {
            if (trimmed.contains("/")) {
                String[] parts = trimmed.split("/");
                if (parts.length == 3) {
                    int day = Integer.parseInt(parts[0].trim());
                    int month = Integer.parseInt(parts[1].trim());
                    int year = Integer.parseInt(parts[2].trim());
                    return LocalDate.of(year, month, day);
                }
            }
            return LocalDate.parse(trimmed);
        } catch (Exception e) {
            return null;
        }
    }
}
