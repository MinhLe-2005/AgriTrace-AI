package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.Dashboard;
import com.example.myfullstackapp.service.WarehouseDashboardService;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/dashboard")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class WarehouseDashboardController {
    private final WarehouseDashboardService dashboard;

    @GetMapping
    public ApiResponse<Dashboard> get(
            @PathVariable UUID warehouseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ApiResponse.ok(
                "Warehouse dashboard retrieved", dashboard.get(warehouseId, from, to));
    }
}
