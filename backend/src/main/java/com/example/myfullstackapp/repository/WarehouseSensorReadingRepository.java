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

    @org.springframework.data.jpa.repository.Query("""
            select r from WarehouseSensorReading r
            where r.deviceId in :deviceIds
              and not exists (
                  select 1 from WarehouseSensorReading r2
                  where r2.deviceId = r.deviceId
                    and (r2.recordedAt > r.recordedAt
                         or (r2.recordedAt = r.recordedAt and r2.receivedAt > r.receivedAt))
              )
            """)
    List<WarehouseSensorReading> findLatestForDevices(
            @org.springframework.data.repository.query.Param("deviceIds") Collection<UUID> deviceIds);

    List<WarehouseSensorReading>
            findByDeviceIdAndRecordedAtBetweenOrderByRecordedAtDescReceivedAtDesc(
                    UUID deviceId, Instant from, Instant to, Pageable page);

    List<WarehouseSensorReading>
            findByDeviceIdInAndRecordedAtBetweenOrderByRecordedAtAscReceivedAtAsc(
                    Collection<UUID> deviceIds, Instant from, Instant to);

    long countByDeviceIdAndReceivedAtAfter(UUID deviceId, Instant from);
}
