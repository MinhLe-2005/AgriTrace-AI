package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseMonitoring.*;
import com.example.myfullstackapp.service.WarehouseTelemetryService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/warehouse-telemetry")
@RequiredArgsConstructor
public class WarehouseTelemetryController {
    private final WarehouseTelemetryService telemetry;

    @PostMapping
    public ApiResponse<ReadingView> ingest(@Valid @RequestBody TelemetryInput input) {
        return ApiResponse.ok("Sensor reading accepted", telemetry.ingest(input));
    }
}
