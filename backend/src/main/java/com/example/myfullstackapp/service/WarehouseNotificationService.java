package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.context.event.EventListener;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.time.Clock;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseNotificationService {
    private final WarehouseMonitoringSettingsRepository settings;
    private final WarehouseAlertDeliveryRepository deliveries;
    private final WarehouseTelegramClient telegram;
    private final InventoryService inventory;
    private final Clock clock;

    @EventListener
    @Transactional(propagation = Propagation.MANDATORY)
    public void enqueue(AlertOpened event) {
        var value = settings.findById(event.warehouseId()).orElse(null);
        if (value == null || !value.isTelegramEnabled() || deliveries.existsById(event.eventId()))
            return;
        var delivery = new WarehouseAlertDelivery();
        delivery.setId(event.eventId());
        delivery.setWarehouseId(event.warehouseId());
        delivery.setAlertId(event.alertId());
        delivery.setChatId(value.getTelegramChatId());
        delivery.setMessage(
                "AgriTrace · "
                        + event.severity()
                        + "\nKho: "
                        + event.warehouseId()
                        + "\nCảnh báo: "
                        + event.alertId()
                        + "\n"
                        + event.message());
        delivery.setNextAttemptAt(clock.instant());
        deliveries.saveAndFlush(delivery);
    }

    @Transactional
    public void deliver(UUID id) {
        var delivery = deliveries.findForUpdate(id).orElse(null);
        var now = clock.instant();
        if (delivery == null
                || !Set.of("PENDING", "RETRY").contains(delivery.getStatus())
                || delivery.getNextAttemptAt().isAfter(now)) return;
        var current = settings.findById(delivery.getWarehouseId()).orElse(null);
        if (current == null
                || !current.isTelegramEnabled()
                || !Objects.equals(current.getTelegramChatId(), delivery.getChatId())) {
            delivery.setStatus("CANCELLED");
            delivery.setLastError("NOTIFICATIONS_DISABLED_OR_TARGET_CHANGED");
            deliveries.saveAndFlush(delivery);
            return;
        }
        delivery.setAttempts(delivery.getAttempts() + 1);
        if (telegram.send(delivery.getChatId(), delivery.getMessage())) {
            delivery.setStatus("SENT");
            delivery.setSentAt(now);
            delivery.setLastError(null);
        } else {
            delivery.setStatus(delivery.getAttempts() >= 5 ? "FAILED" : "RETRY");
            delivery.setLastError("TELEGRAM_DELIVERY_FAILED");
            delivery.setNextAttemptAt(
                    now.plusSeconds(Math.min(900, 30L * (1L << delivery.getAttempts()))));
        }
        deliveries.saveAndFlush(delivery);
    }

    @Transactional(readOnly = true)
    public List<DeliveryView> list(UUID warehouseId, int page) {
        inventory.requireWarehouse(warehouseId);
        return deliveries
                .findByWarehouseIdOrderByNextAttemptAtDesc(warehouseId, PageRequest.of(page, 100))
                .stream()
                .map(this::view)
                .toList();
    }

    @Transactional
    public DeliveryView retry(UUID warehouseId, UUID id) {
        var delivery =
                deliveries
                        .findForUpdate(id)
                        .filter(d -> warehouseId.equals(d.getWarehouseId()))
                        .orElseThrow(() -> new ResourceNotFoundException("Delivery not found"));
        if (!Set.of("FAILED", "RETRY").contains(delivery.getStatus()))
            throw new ConflictException("Only failed deliveries can be retried");
        delivery.setStatus("RETRY");
        delivery.setAttempts(0);
        delivery.setNextAttemptAt(clock.instant());
        deliveries.saveAndFlush(delivery);
        return view(delivery);
    }

    private DeliveryView view(WarehouseAlertDelivery d) {
        return new DeliveryView(
                d.getId(),
                d.getAlertId(),
                d.getStatus(),
                d.getAttempts(),
                d.getLastError(),
                d.getNextAttemptAt(),
                d.getSentAt());
    }
}
