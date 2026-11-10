package com.example.myfullstackapp.entity;

import jakarta.persistence.*;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(
        name = "wh_location_layouts",
        uniqueConstraints =
                @UniqueConstraint(
                        name = "uk_wh_layout_cell",
                        columnNames = {"warehouse_id", "level_no", "row_no", "column_no"}))
@Getter
@Setter
@NoArgsConstructor
public class WarehouseLocationLayout {
    @Id
    private UUID locationId;

    @Column(nullable = false)
    private UUID warehouseId;

    @Column(name = "row_no", nullable = false)
    private int row;

    @Column(name = "column_no", nullable = false)
    private int column;

    @Column(name = "level_no", nullable = false)
    private int level;

    @Column(nullable = false, length = 254)
    private String updatedBy;

    @Column(nullable = false)
    private Instant updatedAt;
}
