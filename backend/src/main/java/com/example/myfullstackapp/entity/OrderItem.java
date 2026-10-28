package com.example.myfullstackapp.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "agri_order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @JsonIgnore
    private Order order;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(length = 128)
    private String origin;

    @Column(length = 64)
    private String cert;

    @Column(nullable = false, length = 32)
    private String qty;

    @Column(nullable = false)
    private Long price;

    @Column(length = 255)
    private String image;
}
