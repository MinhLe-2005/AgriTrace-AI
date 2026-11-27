package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.DistributorShipmentMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface DistributorShipmentMessageRepository extends JpaRepository<DistributorShipmentMessage, UUID> {
    List<DistributorShipmentMessage> findByShipmentCodeIgnoreCaseOrderBySentAtAsc(String shipmentCode);
}
