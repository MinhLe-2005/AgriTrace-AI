package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "verification_requests", indexes = {
        @Index(name = "idx_verification_status_type", columnList = "status,type"),
        @Index(name = "idx_verification_subject", columnList = "subject_id")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class VerificationRequest {
    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "subject_id", nullable = false)
    private User subject;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private VerificationStatus status = VerificationStatus.PENDING;

    @Column(nullable = false, length = 150)
    private String organizationName;

    @Column(nullable = false, length = 50)
    private String documentType;

    @Column(nullable = false, length = 500)
    private String documentUrl;

    @Column(length = 1000)
    private String note;

    @Column(length = 1000)
    private String decisionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    private Instant reviewedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
