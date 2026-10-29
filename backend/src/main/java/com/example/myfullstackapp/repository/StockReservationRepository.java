package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockReservation;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface StockReservationRepository extends JpaRepository<StockReservation, UUID> {
    List<StockReservation> findByOrderId(Long orderId);

    List<StockReservation> findByWarehouseIdAndStatus(
            UUID warehouseId, StockReservation.Status status);

    List<StockReservation> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable page);

    Optional<StockReservation> findByIdAndWarehouseId(UUID id, UUID warehouseId);
}
