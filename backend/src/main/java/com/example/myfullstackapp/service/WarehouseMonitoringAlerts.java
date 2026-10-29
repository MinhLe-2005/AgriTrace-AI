package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseMonitoringAlerts {
    private final RiskAlertRepository alerts;
    private final AlertActionRepository actions;
    private final ApplicationEventPublisher events;
    private final Clock clock;

    public void raise(
            UUID warehouseId,
            String fingerprint,
            String type,
            String severity,
            String message,
            UUID locationId,
            UUID ruleId,
            UUID deviceId,
            String lotId) {
        var alert =
                alerts.findByWarehouseIdAndFingerprint(warehouseId, fingerprint)
                        .orElseGet(RiskAlert::new);
        boolean fresh = alert.getWarehouseId() == null;
        boolean reopen = "RESOLVED".equals(alert.getStatus());
        boolean escalate = rank(severity) > rank(alert.getSeverity());
        boolean changed =
                fresh
                        || reopen
                        || !severity.equals(alert.getSeverity())
                        || !message.equals(alert.getMessage());
        alert.setWarehouseId(warehouseId);
        alert.setFingerprint(fingerprint);
        alert.setType(type);
        alert.setLocationId(locationId);
        alert.setRuleId(ruleId);
        alert.setDeviceId(deviceId);
        alert.setLotId(lotId);
        alert.setSeverity(severity);
        alert.setMessage(message);
        if (reopen) alert.setStatus("OPEN");
        if (changed) alert.setUpdatedAt(clock.instant());
        alerts.saveAndFlush(alert);
        if (fresh || reopen || escalate) {
            audit(
                    alert,
                    alert.getStatus(),
                    fresh
                            ? "Phát hiện điều kiện cảnh báo"
                            : reopen ? "Điều kiện xuất hiện lại" : "Mức cảnh báo tăng",
                    "SYSTEM");
            events.publishEvent(
                    new AlertOpened(
                            UUID.randomUUID(), warehouseId, alert.getId(), severity, message));
        }
        if (changed) events.publishEvent(new Changed(warehouseId, "ALERTS"));
    }

    public void resolve(RiskAlert alert, String note, String actor) {
        if ("RESOLVED".equals(alert.getStatus())) return;
        alert.setStatus("RESOLVED");
        alert.setUpdatedAt(clock.instant());
        alerts.saveAndFlush(alert);
        audit(alert, "RESOLVED", note, actor);
        events.publishEvent(new Changed(alert.getWarehouseId(), "ALERTS"));
    }

    public void resolveFingerprint(UUID warehouseId, String fingerprint, String note) {
        alerts.findByWarehouseIdAndFingerprint(warehouseId, fingerprint)
                .ifPresent(a -> resolve(a, note, "SYSTEM"));
    }

    private void audit(RiskAlert alert, String status, String note, String actor) {
        var action = new AlertAction();
        action.setAlertId(alert.getId());
        action.setStatus(status);
        action.setNote(note);
        action.setActor(actor);
        action.setCreatedAt(clock.instant());
        actions.saveAndFlush(action);
    }

    private int rank(String severity) {
        return "CRITICAL".equals(severity)
                ? 3
                : "HIGH".equals(severity) ? 2 : "MEDIUM".equals(severity) ? 1 : 0;
    }
}
