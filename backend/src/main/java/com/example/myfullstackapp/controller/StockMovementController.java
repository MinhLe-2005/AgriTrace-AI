package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.MovementView;
import com.example.myfullstackapp.service.StockMovementService;

import jakarta.validation.constraints.Min;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/movements")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class StockMovementController {
    private final StockMovementService movements;

    @GetMapping
    public ApiResponse<List<MovementView>> list(
            @PathVariable UUID warehouseId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(
                "Stock movements retrieved", movements.list(warehouseId, from, to, page));
    }
}
