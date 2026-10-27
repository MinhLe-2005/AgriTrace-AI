package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agri_categories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 128)
    private String name;

    @Column(length = 255)
    private String description;

    @Column(length = 64)
    private String tag;

    @Column(length = 64)
    private String tagColor;

    @Column(length = 255)
    private String image;

    @Builder.Default
    private Integer displayOrder = 0;
}
