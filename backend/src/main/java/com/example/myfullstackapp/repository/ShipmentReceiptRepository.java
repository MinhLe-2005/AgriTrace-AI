package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.ShipmentReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShipmentReceiptRepository extends JpaRepository<ShipmentReceipt, Long> {
    Optional<ShipmentReceipt> findByShipmentId(Long shipmentId);
}
