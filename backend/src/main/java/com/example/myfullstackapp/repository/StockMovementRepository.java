package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockMovement;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {
    @Query(
            "select coalesce(sum(m.deltaKg),0) from StockMovement m where"
                    + " m.warehouseId=:warehouseId and m.type=:type and m.occurredAt>=:from and"
                    + " m.occurredAt<:until")
    BigDecimal sumDelta(
            @Param("warehouseId")
            UUID warehouseId,
            @Param("type")
            String type,
            @Param("from")
            Instant from,
            @Param("until")
            Instant until);

    @Query(
            "select m.lotId, sum(m.deltaKg), count(m) from StockMovement m where"
                + " m.warehouseId=:warehouseId and m.type='OUTBOUND' and m.occurredAt>=:from group"
                + " by m.lotId")
    List<Object[]> outboundHistory(
            @Param("warehouseId")
            UUID warehouseId, @Param("from") Instant from);

    List<StockMovement>
            findByWarehouseIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                    UUID warehouseId, Instant from, Instant until, Pageable page);

    @Query(
            "select coalesce(sum(m.deltaKg),0) from StockMovement m where m.lotId=:id and"
                    + " m.type='INBOUND'")
    BigDecimal totalReceived(@Param("id") String lotId);
}
