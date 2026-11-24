package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.ShipmentReceipt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.List;

public interface ShipmentReceiptRepository extends JpaRepository<ShipmentReceipt, Long> {
    Optional<ShipmentReceipt> findByShipmentId(Long shipmentId);
    List<ShipmentReceipt> findByShipmentIdIn(List<Long> shipmentIds);
}
