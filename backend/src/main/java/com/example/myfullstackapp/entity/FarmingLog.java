package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "agri_farming_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 64)
    private String farmCode;

    @Column(name = "owner_id", length = 64)
    private String ownerId;

    @Column(nullable = false, length = 64)
    private String batchCode;

    @Column(length = 32)
    private String date;

    @Column(nullable = false, length = 100)
    private String stage;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String action;

    @Column(columnDefinition = "TEXT")
    private String materialsUsed;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(columnDefinition = "TEXT")
    private String proofImage;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
