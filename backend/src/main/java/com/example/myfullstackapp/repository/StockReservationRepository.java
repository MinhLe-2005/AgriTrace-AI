package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockReservation;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.*;

public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {
    List<StockReservation> findByOrderId(Long orderId);

    List<StockReservation> findByWarehouseIdAndStatus(
            UUID warehouseId, StockReservation.Status status);

    List<StockReservation> findByWarehouseIdAndStatusAndExpiresAtAfter(
            UUID warehouseId, StockReservation.Status status, Instant now);

    @Modifying
    @Query("update StockReservation r set r.status = com.example.myfullstackapp.entity.StockReservation.Status.EXPIRED where r.status = com.example.myfullstackapp.entity.StockReservation.Status.ACTIVE and r.expiresAt <= :now")
    int expirePastDue(@Param("now") Instant now);

    List<StockReservation> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable page);

    Optional<StockReservation> findByIdAndWarehouseId(UUID id, UUID warehouseId);
}
