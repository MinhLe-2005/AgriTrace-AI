package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.FarmingLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FarmingLogRepository extends JpaRepository<FarmingLog, Long> {
    List<FarmingLog> findAllByOrderByCreatedAtDesc();
    List<FarmingLog> findByOwnerIdIgnoreCaseOrderByCreatedAtDesc(String ownerId);
    List<FarmingLog> findByBatchCodeIgnoreCaseOrderByCreatedAtDesc(String batchCode);
    List<FarmingLog> findByFarmCodeIgnoreCaseOrderByCreatedAtDesc(String farmCode);
}
