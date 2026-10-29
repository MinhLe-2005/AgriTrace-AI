package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agri_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String orderCode;

    @Column(nullable = false, length = 255)
    private String productName;

    @Column(length = 255)
    private String userEmail;

    @Column(length = 128)
    private String userName;

    @Column(nullable = false)
    private Integer rating; // 1 - 5 stars

    @Column(length = 1000)
    private String comment;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
