package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.BalanceView;
import com.example.myfullstackapp.service.InventoryService;

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
                inventory.getBalances(warehouseId).stream()
                        .filter(b -> lotId == null || lotId.equals(b.lotId()))
                        .filter(b -> locationId == null || locationId.equals(b.locationId()))
                        .filter(b -> !onlyAvailable || b.availableKg().signum() > 0)
                        .skip((long) page * size)
                        .limit(size)
                        .toList());
    }
}
