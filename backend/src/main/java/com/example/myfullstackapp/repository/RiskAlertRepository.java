package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.RiskAlert;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface RiskAlertRepository extends JpaRepository<RiskAlert, UUID> {
    List<RiskAlert> findByWarehouseIdOrderByUpdatedAtDesc(UUID warehouseId);

    Optional<RiskAlert> findByWarehouseIdAndFingerprint(UUID warehouseId, String fingerprint);

    Optional<RiskAlert> findByIdAndWarehouseId(UUID id, UUID warehouseId);
}
