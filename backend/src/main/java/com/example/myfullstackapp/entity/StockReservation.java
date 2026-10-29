package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "wh_reservations")
@Getter
@Setter
@NoArgsConstructor
public class StockReservation {
    public enum Status {
        ACTIVE,
        RELEASED,
        CONSUMED
    }

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(nullable = false)
    private Long orderId;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false, length = 254)
    private String createdBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    @ElementCollection
    @CollectionTable(
            name = "wh_reservation_lines",
            joinColumns = @JoinColumn(name = "reservation_id"))
    private List<Allocation> lines = new ArrayList<>();

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Allocation {
        @Column(nullable = false)
        private UUID balanceId;

        @Column(nullable = false, precision = 14, scale = 3)
        private BigDecimal quantityKg;
    }
}
