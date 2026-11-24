package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockReservation;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {
    interface ReservedTotal {
        UUID getBalanceId();

        BigDecimal getQuantityKg();
    }

    @Query(
            """
            select l.balanceId as balanceId, sum(l.quantityKg-l.dispatchedKg) as quantityKg
            from StockReservation r join r.lines l
            where r.warehouseId=:warehouseId and r.status=:status and r.expiresAt>:now
              and (:exceptId is null or r.id<>:exceptId) and l.balanceId in :ids
            group by l.balanceId
            """)
    List<ReservedTotal> sumForBalances(
            @Param("warehouseId") UUID warehouseId,
            @Param("status") StockReservation.Status status,
            @Param("now") Instant now,
            @Param("exceptId") UUID exceptId,
            @Param("ids") Collection<UUID> ids);

    List<StockReservation> findByOrderId(Long orderId);

    List<StockReservation> findByWarehouseIdAndStatus(
            UUID warehouseId, StockReservation.Status status);

    List<StockReservation> findByWarehouseIdAndStatusAndExpiresAtAfter(
            UUID warehouseId, StockReservation.Status status, Instant now);

    @Modifying
    @Query(
            "update StockReservation r set r.status ="
                + " com.example.myfullstackapp.entity.StockReservation.Status.EXPIRED where"
                + " r.status = com.example.myfullstackapp.entity.StockReservation.Status.ACTIVE and"
                + " r.expiresAt <= :now")
    int expirePastDue(@Param("now") Instant now);

    List<StockReservation> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable page);

    Optional<StockReservation> findByIdAndWarehouseId(UUID id, UUID warehouseId);
}
