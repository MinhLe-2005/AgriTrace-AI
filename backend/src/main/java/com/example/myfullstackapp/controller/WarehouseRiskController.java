package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.service.WarehouseRiskService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class WarehouseRiskController {
    private final WarehouseRiskService risk;

    @GetMapping("/risk-rules")
    public ApiResponse<RuleInput> rule(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Risk rules retrieved", risk.rule(warehouseId));
    }

    @PutMapping("/risk-rules")
    public ApiResponse<RuleInput> updateRule(
            @PathVariable UUID warehouseId, @Valid @RequestBody RuleInput input) {
        return ApiResponse.ok("Risk rules updated", risk.updateRule(warehouseId, input));
    }

    @GetMapping("/alerts")
    public ApiResponse<List<AlertView>> list(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Alerts retrieved", risk.list(warehouseId));
    }

    @PostMapping("/alerts/refresh")
    public ApiResponse<List<AlertView>> refresh(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Alerts refreshed", risk.refresh(warehouseId));
    }

    @PutMapping("/alerts/{id}")
    public ApiResponse<AlertView> act(
            @PathVariable UUID warehouseId,
            @PathVariable UUID id,
            @Valid @RequestBody AlertInput input,
            Principal actor) {
        return ApiResponse.ok("Alert updated", risk.act(warehouseId, id, input, actor.getName()));
    }

    @GetMapping("/alerts/{id}/history")
    public ApiResponse<List<AlertActionView>> history(
            @PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Alert history retrieved", risk.history(warehouseId, id));
    }

    @GetMapping("/forecast")
    public ApiResponse<List<Forecast>> forecast(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Historical outbound estimate retrieved", risk.forecast(warehouseId));
    }
}
