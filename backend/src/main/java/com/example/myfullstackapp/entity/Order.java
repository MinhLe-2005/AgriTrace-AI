package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "agri_orders")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String orderCode;

    @Column(length = 255)
    private String userEmail;

    @Column(nullable = false, length = 128)
    private String receiverName;

    @Column(nullable = false, length = 32)
    private String receiverPhone;

    @Column(nullable = false, length = 255)
    private String receiverAddress;

    @Column(length = 64)
    private String deliverySlot;

    @Column(length = 255)
    private String deliveryNote;

    @Column(length = 64)
    private String driverName;

    @Column(length = 32)
    private String driverPhone;

    @Builder.Default
    @Column(length = 32)
    private String status = "SHIPPING";

    @Column(length = 32)
    private String paymentMethod;

    @Column(length = 64)
    private String voucherUsed;

    @Builder.Default
    private Long subtotal = 0L;

    @Builder.Default
    private Long shippingFee = 0L;

    @Builder.Default
    private Long discount = 0L;

    @Builder.Default
    private Long total = 0L;

    @Builder.Default
    private Integer pointsAwarded = 0;

    @Column(length = 64)
    private String lotCode;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<OrderItem> items = new ArrayList<>();
}
