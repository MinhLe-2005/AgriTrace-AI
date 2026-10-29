package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseSensorReading;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.*;

public interface WarehouseSensorReadingRepository
        extends JpaRepository<WarehouseSensorReading, UUID> {
    Optional<WarehouseSensorReading> findByDeviceIdAndMessageId(UUID deviceId, UUID messageId);

    Optional<WarehouseSensorReading> findFirstByDeviceIdOrderByRecordedAtDescReceivedAtDesc(
            UUID deviceId);

    List<WarehouseSensorReading>
            findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtDescReceivedAtDesc(
                    UUID deviceId, Instant from, Instant to, Pageable page);

    long countByDeviceIdAndReceivedAtAfter(UUID deviceId, Instant from);
}
