package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseMonitoringRule;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface WarehouseMonitoringRuleRepository
        extends JpaRepository<WarehouseMonitoringRule, UUID> {
    List<WarehouseMonitoringRule> findByWarehouseIdOrderByUpdatedAtDesc(UUID id);

    Optional<WarehouseMonitoringRule> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    long countByWarehouseId(UUID warehouseId);
}
