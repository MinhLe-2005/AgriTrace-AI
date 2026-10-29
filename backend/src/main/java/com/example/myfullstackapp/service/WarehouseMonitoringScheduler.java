package com.example.myfullstackapp.service;

import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.slf4j.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(
        prefix = "warehouse.monitoring",
        name = "enabled",
        havingValue = "true",
        matchIfMissing = true)
public class WarehouseMonitoringScheduler {
    private static final Logger log = LoggerFactory.getLogger(WarehouseMonitoringScheduler.class);
    private final WarehouseRepository warehouses;
    private final WarehouseMonitoringEvaluator evaluator;
    private final WarehouseRiskService legacy;
    private final WarehouseNotificationService notifications;
    private final WarehouseAlertDeliveryRepository deliveries;
    private final WarehouseMonitoringStream stream;
    private final Clock clock;

    @Scheduled(
            fixedDelayString = "${warehouse.monitoring.evaluation-delay-ms:30000}",
            initialDelayString = "${warehouse.monitoring.initial-delay-ms:30000}")
    public void evaluate() {
        for (var warehouse : warehouses.findAll()) {
            if (!warehouse.isActive()) continue;
            UUID id = warehouse.getId();
            try {
                evaluator.evaluateWarehouse(id);
            } catch (Exception failure) {
                log.warn(
                        "Warehouse monitoring evaluation failed for {} ({})",
                        id,
                        failure.getClass().getSimpleName());
            }
            try {
                legacy.refresh(id);
            } catch (Exception failure) {
                log.warn(
                        "Warehouse stock alert refresh failed for {} ({})",
                        id,
                        failure.getClass().getSimpleName());
            }
        }
    }

    @Scheduled(
            fixedDelayString = "${warehouse.monitoring.delivery-delay-ms:10000}",
            initialDelayString = "${warehouse.monitoring.initial-delay-ms:30000}")
    public void deliver() {
        for (UUID id : deliveries.due(clock.instant(), PageRequest.of(0, 20)))
            try {
                notifications.deliver(id);
            } catch (Exception failure) {
                log.warn(
                        "Warehouse notification delivery failed for {} ({})",
                        id,
                        failure.getClass().getSimpleName());
            }
    }

    @Scheduled(fixedDelay = 15000)
    public void heartbeat() {
        stream.heartbeat();
    }
}
