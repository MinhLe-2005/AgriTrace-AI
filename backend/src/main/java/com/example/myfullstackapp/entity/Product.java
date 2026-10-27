package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agri_products")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @Column(length = 64)
    private String id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(nullable = false)
    private Long price;

    @Column(nullable = false)
    private Long oldPrice;

    @Column(nullable = false, length = 32)
    private String unit;

    @Column(length = 128)
    private String origin;

    @Column(length = 128)
    private String farm;

    @Column(length = 64)
    private String cert;

    @Builder.Default
    private Double rating = 5.0;

    @Builder.Default
    private Integer reviews = 0;

    @Column(length = 128)
    private String harvest;

    @Column(length = 255)
    private String image;

    @Column(length = 64)
    private String categoryCode;

    @Builder.Default
    private Integer stockLeft = 20;

    @Column(length = 64)
    private String batchCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String cultivation;

    @Column(length = 255)
    private String temperature;

    @Column(length = 255)
    private String pesticide;

    @Column(length = 255)
    private String packaging;

    @Builder.Default
    private Boolean active = true;

    @Builder.Default
    private Boolean featured = false;
}
