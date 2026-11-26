package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agri_uploaded_media")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerUploadedMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 255)
    private String fileName;

    @Column(nullable = false, length = 128)
    private String contentType;

    @Column(nullable = false)
    private Long sizeBytes;

    @Column(name = "owner_id", length = 64)
    private String ownerId;

    @Column(nullable = false, length = 64)
    @Builder.Default
    private String category = "farming-log";

    @Lob
    @JdbcTypeCode(SqlTypes.BINARY)
    @Column(nullable = false)
    private byte[] data;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
