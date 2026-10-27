package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agri_vouchers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 255)
    private String description;

    @Column(length = 64)
    private String badge;

    @Column(length = 64)
    private String badgeColor;

    @Column(length = 32)
    private String discount;

    @Column(length = 64)
    private String minOrder;

    @Column(length = 64)
    private String exp;

    @Builder.Default
    private Boolean active = true;
}
