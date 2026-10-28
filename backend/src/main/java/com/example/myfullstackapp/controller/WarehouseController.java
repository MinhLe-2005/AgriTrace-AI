package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.service.WarehouseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/warehouses")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
public class WarehouseController {
    private final WarehouseService warehouseService;

    @GetMapping
    public ApiResponse<List<WarehouseResponse>> getAll() { return ApiResponse.ok("Warehouses retrieved", warehouseService.getAll()); }

    @GetMapping("/{id}")
    public ApiResponse<WarehouseResponse> getById(@PathVariable UUID id) { return ApiResponse.ok("Warehouse retrieved", warehouseService.getById(id)); }

    @PostMapping
    public ResponseEntity<ApiResponse<WarehouseResponse>> create(@Valid @RequestBody WarehouseCreateRequest request) {
        WarehouseResponse warehouse = warehouseService.create(request);
        var location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(warehouse.id()).toUri();
        return ResponseEntity.created(location).body(ApiResponse.ok("Warehouse created", warehouse));
    }

    @PutMapping("/{id}")
    public ApiResponse<WarehouseResponse> update(@PathVariable UUID id, @Valid @RequestBody WarehouseUpdateRequest request) {
        return ApiResponse.ok("Warehouse updated", warehouseService.update(id, request));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<WarehouseResponse> setActive(@PathVariable UUID id, @Valid @RequestBody ActiveStatusRequest request) {
        return ApiResponse.ok("Warehouse status updated", warehouseService.setActive(id, request.active()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID id) { warehouseService.setActive(id, false); }

    @GetMapping("/{id}/capacity")
    public ApiResponse<WarehouseCapacityResponse> getCapacity(@PathVariable UUID id) {
        return ApiResponse.ok("Warehouse capacity retrieved", warehouseService.getCapacity(id));
    }
}
