package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseTelemetryService {
    private final InventoryService inventory;
    private final WarehouseSensorDeviceRepository devices;
    private final WarehouseSensorReadingRepository readings;
    private final WarehouseMonitoringSettingsRepository settings;
    private final WarehouseMonitoringEvaluator evaluator;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    @Transactional
    public ReadingView ingest(TelemetryInput input) {
        var credentials =
                devices.authentication(input.deviceId())
                        .orElseThrow(WarehouseSensorAuthenticationException::new);
        String supplied = WarehouseMonitoringService.hash(input.deviceKey());
        if (!MessageDigest.isEqual(
                credentials.getKeyHash().getBytes(StandardCharsets.US_ASCII),
                supplied.getBytes(StandardCharsets.US_ASCII)))
            throw new WarehouseSensorAuthenticationException();
        UUID warehouseId = credentials.getWarehouseId();
        inventory.lock(warehouseId, null);
        var device =
                devices.findByIdAndWarehouseId(input.deviceId(), warehouseId)
                        .orElseThrow(WarehouseSensorAuthenticationException::new);
        if (!device.isActive()
                || !MessageDigest.isEqual(
                        device.getKeyHash().getBytes(StandardCharsets.US_ASCII),
                        supplied.getBytes(StandardCharsets.US_ASCII)))
            throw new WarehouseSensorAuthenticationException();
        if (!inventory.requireWarehouse(warehouseId).isActive())
            throw new ConflictException("Warehouse is inactive");
        if (device.isSimulated() != input.simulated())
            throw new IllegalArgumentException(
                    "Reading source must match the registered sensor mode");
        var now = clock.instant();
        var recordedAt = input.recordedAt().truncatedTo(java.time.temporal.ChronoUnit.MICROS);
        if (recordedAt.isAfter(now.plusSeconds(30))
                || recordedAt.isBefore(now.minus(Duration.ofHours(24))))
            throw new IllegalArgumentException(
                    "Sensor timestamp must be within the previous 24 hours, with at most 30 seconds"
                            + " clock skew");
        var existing = readings.findByDeviceIdAndMessageId(device.getId(), input.messageId());
        int gap =
                settings.findById(warehouseId)
                        .map(WarehouseMonitoringSettings::getMaxGapSeconds)
                        .orElse(120);
        if (existing.isPresent()) {
            var value = existing.get();
            if (!value.getRecordedAt().equals(recordedAt)
                    || value.getTemperature().compareTo(input.temperature()) != 0
                    || value.getHumidity().compareTo(input.humidity()) != 0)
                throw new ConflictException(
                        "Sensor message ID was already used with different readings");
            return WarehouseMonitoringService.readingView(value, device, gap, now);
        }
        if (readings.countByDeviceIdAndReceivedAtAfter(device.getId(), now.minusSeconds(60)) >= 180)
            throw new WarehouseSensorRateLimitException();
        var reading = new WarehouseSensorReading();
        reading.setWarehouseId(warehouseId);
        reading.setDeviceId(device.getId());
        reading.setLocationId(device.getLocationId());
        reading.setMessageId(input.messageId());
        reading.setRecordedAt(recordedAt);
        reading.setReceivedAt(now);
        reading.setTemperature(input.temperature());
        reading.setHumidity(input.humidity());
        readings.saveAndFlush(reading);
        evaluator.evaluateWarehouse(warehouseId);
        events.publishEvent(new Changed(warehouseId, "TELEMETRY"));
        return WarehouseMonitoringService.readingView(reading, device, gap, now);
    }
}
