package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "wh_document_lines")
@Getter
@Setter
@NoArgsConstructor
public class WarehouseDocumentLine {
    @Id
    private UUID id = UUID.randomUUID();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private WarehouseDocument document;

    @Column(nullable = false)
    private String lotId;

    @Column(nullable = false)
    private UUID locationId;

    private UUID targetLocationId;

    @Column(nullable = false, precision = 14, scale = 3)
    private BigDecimal quantityKg;

    @Column(precision = 14, scale = 3)
    private BigDecimal expectedKg;

    private Long expectedVersion;
}
