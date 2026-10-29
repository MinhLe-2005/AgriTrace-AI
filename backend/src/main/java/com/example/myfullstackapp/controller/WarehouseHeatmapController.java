package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseHeatmap.*;
import com.example.myfullstackapp.service.WarehouseHeatmapService;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/heatmap")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class WarehouseHeatmapController {
    private final WarehouseHeatmapService heatmap;

    @GetMapping
    public ApiResponse<MapView> map(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Warehouse heatmap retrieved", heatmap.map(warehouseId));
    }

    @PutMapping("/layout/{locationId}")
    public ApiResponse<LayoutView> place(
            @PathVariable UUID warehouseId,
            @PathVariable UUID locationId,
            @Valid @RequestBody LayoutInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Storage location placed",
                heatmap.place(warehouseId, locationId, input, actor.getName()));
    }

    @DeleteMapping("/layout/{locationId}")
    public ApiResponse<Void> unplace(
            @PathVariable UUID warehouseId, @PathVariable UUID locationId) {
        heatmap.unplace(warehouseId, locationId);
        return ApiResponse.ok("Storage location removed from map", null);
    }
}
