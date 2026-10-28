package com.example.myfullstackapp.controller;

import com.example.myfullstackapp.dto.ApiResponse;
import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.service.StorageLocationService;
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
@RequestMapping("/api/v1/warehouses/{warehouseId}/locations")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('WAREHOUSE', 'ADMIN')")
public class StorageLocationController {
    private final StorageLocationService storageLocationService;

    @GetMapping
    public ApiResponse<List<StorageLocationResponse>> getAll(@PathVariable UUID warehouseId) {
        return ApiResponse.ok("Storage locations retrieved", storageLocationService.getAll(warehouseId));
    }

    @GetMapping("/{id}")
    public ApiResponse<StorageLocationResponse> getById(@PathVariable UUID warehouseId, @PathVariable UUID id) {
        return ApiResponse.ok("Storage location retrieved", storageLocationService.getById(warehouseId, id));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StorageLocationResponse>> create(@PathVariable UUID warehouseId, @Valid @RequestBody StorageLocationCreateRequest request) {
        StorageLocationResponse location = storageLocationService.create(warehouseId, request);
        var uri = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}").buildAndExpand(location.id()).toUri();
        return ResponseEntity.created(uri).body(ApiResponse.ok("Storage location created", location));
    }

    @PutMapping("/{id}")
    public ApiResponse<StorageLocationResponse> update(@PathVariable UUID warehouseId, @PathVariable UUID id, @Valid @RequestBody StorageLocationUpdateRequest request) {
        return ApiResponse.ok("Storage location updated", storageLocationService.update(warehouseId, id, request));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<StorageLocationResponse> setActive(@PathVariable UUID warehouseId, @PathVariable UUID id, @Valid @RequestBody ActiveStatusRequest request) {
        return ApiResponse.ok("Storage location status updated", storageLocationService.setActive(warehouseId, id, request.active()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deactivate(@PathVariable UUID warehouseId, @PathVariable UUID id) { storageLocationService.setActive(warehouseId, id, false); }
}
