package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "user_vouchers",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_email", "voucher_code"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserVoucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, length = 254)
    private String userEmail;

    @Column(name = "voucher_code", nullable = false, length = 64)
    private String voucherCode;

    @Builder.Default
    @Column(name = "saved_at", nullable = false)
    private LocalDateTime savedAt = LocalDateTime.now();
}
