package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseMonitoringRuleRevision;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface WarehouseMonitoringRuleRevisionRepository
        extends JpaRepository<WarehouseMonitoringRuleRevision, UUID> {
    List<WarehouseMonitoringRuleRevision> findByWarehouseIdAndRuleIdOrderByCreatedAtDesc(
            UUID warehouseId, UUID ruleId, Pageable page);
}
