package com.example.myfullstackapp.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "loyalty_memberships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoyaltyMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles"})
    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false, unique = true)
    private User user;

    @Column(name = "current_points", nullable = false)
    @Builder.Default
    private Integer currentPoints = 100;

    @Column(name = "lifetime_points", nullable = false)
    @Builder.Default
    private Integer lifetimePoints = 100;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String tier = "BRONZE"; // BRONZE, SILVER, GOLD, DIAMOND

    @Column(name = "total_spent", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
