package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Shipment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    Optional<Shipment> findByShipmentCodeIgnoreCase(String shipmentCode);
    List<Shipment> findAllByOrderByCreatedAtDesc();
    List<Shipment> findByStatusOrderByCreatedAtDesc(String status);
    List<Shipment> findByDistributorEmailIgnoreCaseOrderByCreatedAtDesc(String distributorEmail);
    List<Shipment> findByDistributorEmailIgnoreCaseAndStatusOrderByCreatedAtDesc(String distributorEmail, String status);
}
