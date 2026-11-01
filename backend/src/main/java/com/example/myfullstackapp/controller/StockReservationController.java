package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.service.*;

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
@RequestMapping("/api/v1/warehouses/{warehouseId}")
@RequiredArgsConstructor
@Validated
@PreAuthorize("hasAnyRole('WAREHOUSE','ADMIN')")
public class StockReservationController {
    private final StockReservationService reservations;
    private final WarehouseWeightService weights;

    @PostMapping("/fefo")
    public ApiResponse<List<AllocationView>> preview(
            @PathVariable UUID warehouseId, @Valid @RequestBody FefoInput input) {
        return ApiResponse.ok(
                "FEFO allocation suggested", reservations.preview(warehouseId, input));
    }

    @PostMapping("/reservations")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ReservationView> create(
            @PathVariable UUID warehouseId,
            @Valid @RequestBody ReserveInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Stock reserved", reservations.create(warehouseId, input, actor.getName()));
    }

    @GetMapping("/reservations")
    public ApiResponse<List<ReservationView>> list(
            @PathVariable UUID warehouseId, @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok("Reservations retrieved", reservations.list(warehouseId, page));
    }

    @PutMapping("/reservations/{id}/release")
    public ApiResponse<ReservationView> release(
            @PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Reservation released", reservations.release(warehouseId, id));
    }

    @GetMapping("/unit-conversions")
    public ApiResponse<List<UnitConversionView>> conversions(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Measured unit conversions retrieved", weights.list(warehouseId));
    }

    @PutMapping("/unit-conversions")
    public ApiResponse<UnitConversionView> conversion(
            @PathVariable UUID warehouseId,
            @Valid @RequestBody UnitConversionInput input,
            Principal actor) {
        return ApiResponse.ok(
                "Measured unit conversion saved",
                weights.save(warehouseId, input, actor.getName()));
    }
}
