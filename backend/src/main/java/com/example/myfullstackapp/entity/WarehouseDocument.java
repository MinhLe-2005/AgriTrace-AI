package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "wh_documents")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseDocument {
    public enum Type {
        INBOUND,
        OUTBOUND,
        COUNT,
        ADJUSTMENT,
        TRANSFER
    }

    public enum Status {
        DRAFT,
        CONFIRMED,
        CANCELLED,
        HANDED_OVER
    }

    @Id
    private UUID id = UUID.randomUUID();

    @Column(nullable = false)
    private UUID warehouseId;

    private UUID targetWarehouseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    private UUID reservationId;

    @Column(length = 500)
    private String note;

    @Column(length = 150)
    private String handoverReference;

    @Column(nullable = false, length = 254)
    private String createdBy;

    @Column(length = 254)
    private String confirmedBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant confirmedAt;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<WarehouseDocumentLine> lines = new ArrayList<>();
}
