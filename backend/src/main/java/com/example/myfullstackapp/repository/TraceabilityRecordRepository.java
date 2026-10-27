package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.TraceabilityRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TraceabilityRecordRepository extends JpaRepository<TraceabilityRecord, Long> {
    Optional<TraceabilityRecord> findByBatchCodeIgnoreCase(String batchCode);
}
