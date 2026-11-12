package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Bài viết blog / tin tức do admin quản lý. */
@Entity
@Table(name = "agri_blog_posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BlogPost {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, unique = true, length = 160)
    private String slug;

    @Column(nullable = false, length = 32)
    private String category;

    @Column(length = 100)
    private String categoryLabel;

    @Column(length = 160)
    private String author;

    @Column(length = 160)
    private String authorRole;

    /** Ngày hiển thị dạng dd/MM/yyyy (giữ nguyên định dạng frontend đang dùng). */
    @Column(name = "publish_date", length = 32)
    private String date;

    @Column(length = 32)
    private String readTime;

    @Column(columnDefinition = "TEXT")
    private String excerpt;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(length = 500)
    private String coverImage;

    @Column(nullable = false)
    @Builder.Default
    private Boolean featured = false;

    @Column(length = 255)
    private String relatedProductName;

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
