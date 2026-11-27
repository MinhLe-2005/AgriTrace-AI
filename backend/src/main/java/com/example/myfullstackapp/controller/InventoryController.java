package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.service.InventoryService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import lombok.RequiredArgsConstructor;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/inventory")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class InventoryController {
    private final InventoryService inventory;

    @GetMapping("/search")
    public ApiResponse<InventoryPage> search(@PathVariable UUID warehouseId,
            @RequestParam(defaultValue = "") @Size(max = 150) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "100") @Min(1) @Max(500) int size) {
        return ApiResponse.ok("Inventory retrieved", inventory.search(warehouseId, q, page, size));
    }

    @GetMapping("/products")
    public ApiResponse<List<String>> products(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Inventory products retrieved", inventory.productNames(warehouseId));
    }

    @PostMapping("/labels")
    public ApiResponse<List<InventoryLabel>> labels(@PathVariable UUID warehouseId,
            @Valid @RequestBody InventoryLabelRequest request) {
        return ApiResponse.ok("Inventory labels retrieved", inventory.labels(warehouseId, request));
    }

    @GetMapping
    public ApiResponse<List<BalanceView>> list(
            @PathVariable UUID warehouseId,
            @RequestParam(required = false) String lotId,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(defaultValue = "false") boolean onlyAvailable,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "100") @Min(1) @Max(500) int size) {
        return ApiResponse.ok(
                "Inventory retrieved",
                inventory.page(warehouseId, lotId, locationId, onlyAvailable, page, size));
    }
}
