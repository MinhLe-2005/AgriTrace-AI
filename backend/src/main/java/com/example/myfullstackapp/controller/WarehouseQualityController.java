package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.service.WarehouseQualityService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api/v1/warehouses/{warehouseId}/inspections")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class WarehouseQualityController {
    private final WarehouseQualityService quality;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InspectionView> inspect(
            @PathVariable UUID warehouseId,
            @Valid @RequestBody InspectionInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Quality inspection recorded",
                quality.inspect(warehouseId, input, actor.getName()));
    }

    @GetMapping
    public ApiResponse<List<InspectionView>> list(
            @PathVariable UUID warehouseId, @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok("Quality inspections retrieved", quality.list(warehouseId, page));
    }
}
