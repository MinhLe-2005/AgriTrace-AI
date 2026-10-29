package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.service.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.security.Principal;
import java.time.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/monitoring")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class WarehouseMonitoringController {
    private final WarehouseMonitoringService monitoring;
    private final WarehouseMonitoringEvaluator evaluator;
    private final WarehouseMonitoringStream stream;
    private final WarehouseNotificationService notifications;

    @GetMapping("/settings")
    public ApiResponse<SettingsView> settings(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Monitoring settings retrieved", monitoring.settings(warehouseId));
    }

    @PutMapping("/settings")
    public ApiResponse<SettingsView> settings(
            @PathVariable UUID warehouseId, @Valid @RequestBody SettingsInput input) {
        return ApiResponse.ok("Monitoring settings saved", monitoring.settings(warehouseId, input));
    }

    @GetMapping("/devices")
    public ApiResponse<List<DeviceView>> devices(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Sensors retrieved", monitoring.devices(warehouseId));
    }

    @PostMapping("/devices")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeviceSecret> createDevice(
            @PathVariable UUID warehouseId,
            @Valid @RequestBody DeviceInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Sensor registered; copy its key now",
                monitoring.createDevice(warehouseId, input, actor.getName()));
    }

    @PutMapping("/devices/{id}/disable")
    public ApiResponse<DeviceView> disableDevice(
            @PathVariable UUID warehouseId, @PathVariable UUID id, Principal actor) {
        return ApiResponse.ok(
                "Sensor disabled", monitoring.disableDevice(warehouseId, id, actor.getName()));
    }

    @GetMapping("/rules")
    public ApiResponse<List<RuleView>> rules(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Monitoring rules retrieved", monitoring.rules(warehouseId));
    }

    @PostMapping("/rules")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RuleView> createRule(
            @PathVariable UUID warehouseId, @Valid @RequestBody RuleInput input, Principal actor) {
        return ApiResponse.ok(
                "Monitoring rule created",
                monitoring.saveRule(warehouseId, null, input, actor.getName()));
    }

    @PutMapping("/rules/{id}")
    public ApiResponse<RuleView> updateRule(
            @PathVariable UUID warehouseId,
            @PathVariable UUID id,
            @Valid @RequestBody RuleInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Monitoring rule updated",
                monitoring.saveRule(warehouseId, id, input, actor.getName()));
    }

    @GetMapping("/rules/{id}/history")
    public ApiResponse<List<RuleRevisionView>> ruleHistory(
            @PathVariable UUID warehouseId,
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(
                "Rule revisions retrieved", monitoring.ruleHistory(warehouseId, id, page));
    }

    @GetMapping("/latest")
    public ApiResponse<List<ReadingView>> latest(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Latest sensor readings retrieved", monitoring.latest(warehouseId));
    }

    @GetMapping("/readings")
    public ApiResponse<List<ReadingView>> readings(
            @PathVariable UUID warehouseId,
            @RequestParam UUID deviceId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                    Instant to) {
        var end = to == null ? Instant.now() : to;
        return ApiResponse.ok(
                "Sensor history retrieved",
                monitoring.readings(
                        warehouseId, deviceId, from == null ? end.minusSeconds(3600) : from, end));
    }

    @GetMapping("/status")
    public ApiResponse<StatusView> status(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Monitoring status retrieved", monitoring.status(warehouseId));
    }

    @PostMapping("/evaluate")
    public ApiResponse<StatusView> evaluate(@PathVariable UUID warehouseId) {
        evaluator.evaluateWarehouse(warehouseId);
        return status(warehouseId);
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<SseEmitter> subscribe(@PathVariable UUID warehouseId) {
        monitoring.status(warehouseId);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("X-Accel-Buffering", "no")
                .body(stream.subscribe(warehouseId));
    }

    @GetMapping("/deliveries")
    public ApiResponse<List<DeliveryView>> deliveries(
            @PathVariable UUID warehouseId, @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(
                "Notification deliveries retrieved", notifications.list(warehouseId, page));
    }

    @PostMapping("/deliveries/{id}/retry")
    public ApiResponse<DeliveryView> retry(@PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok(
                "Notification queued for retry", notifications.retry(warehouseId, id));
    }
}
