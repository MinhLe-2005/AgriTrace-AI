package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.entity.StorageLocation;
import com.example.myfullstackapp.entity.Warehouse;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.mapper.StorageLocationMapper;
import com.example.myfullstackapp.repository.StorageLocationRepository;
import com.example.myfullstackapp.repository.WarehouseRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StorageLocationService {
    private final WarehouseRepository warehouseRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final StorageLocationMapper storageLocationMapper;
    private final CapacityValidationService capacityValidationService;

    @Transactional(readOnly = true)
    public List<StorageLocationResponse> getAll(UUID warehouseId) {
        if (!warehouseRepository.existsById(warehouseId))
            throw new ResourceNotFoundException("Warehouse not found");
        return storageLocationRepository.findByWarehouseIdOrderByCodeAsc(warehouseId).stream()
                .map(storageLocationMapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StorageLocationResponse getById(UUID warehouseId, UUID id) {
        return storageLocationMapper.toResponse(findLocation(warehouseId, id));
    }

    @Transactional
    public StorageLocationResponse create(UUID warehouseId, StorageLocationCreateRequest request) {
        Warehouse warehouse = lockWarehouse(warehouseId);
        requireActive(warehouse);
        String code = normalizeCode(request.code());
        if (storageLocationRepository.existsByWarehouseIdAndCode(warehouseId, code))
            throw new ConflictException("Storage location code already exists in warehouse");
        var allocated =
                storageLocationRepository
                        .sumCapacityTonsByWarehouseId(warehouseId)
                        .add(request.capacityTons());
        capacityValidationService.validateAllocation(warehouse.getCapacityTons(), allocated);
        StorageLocation location =
                StorageLocation.builder()
                        .warehouse(warehouse)
                        .code(code)
                        .name(request.name().trim())
                        .capacityTons(request.capacityTons())
                        .tempTargetC(request.tempTargetC())
                        .humidityTarget(request.humidityTarget())
                        .build();
        return storageLocationMapper.toResponse(storageLocationRepository.saveAndFlush(location));
    }

    @Transactional
    public StorageLocationResponse update(
            UUID warehouseId, UUID id, StorageLocationUpdateRequest request) {
        Warehouse warehouse = lockWarehouse(warehouseId);
        requireActive(warehouse);
        StorageLocation location = findLocation(warehouseId, id);
        String code = normalizeCode(request.code());
        if (storageLocationRepository.existsByWarehouseIdAndCodeAndIdNot(warehouseId, code, id))
            throw new ConflictException("Storage location code already exists in warehouse");
        var allocated =
                storageLocationRepository
                        .sumCapacityTonsByWarehouseId(warehouseId)
                        .subtract(location.getCapacityTons())
                        .add(request.capacityTons());
        capacityValidationService.validateAllocation(warehouse.getCapacityTons(), allocated);
        location.setCode(code);
        location.setName(request.name().trim());
        location.setCapacityTons(request.capacityTons());
        location.setTempTargetC(request.tempTargetC());
        location.setHumidityTarget(request.humidityTarget());
        return storageLocationMapper.toResponse(storageLocationRepository.saveAndFlush(location));
    }

    @Transactional
    public StorageLocationResponse setActive(UUID warehouseId, UUID id, boolean active) {
        Warehouse warehouse = lockWarehouse(warehouseId);
        StorageLocation location = findLocation(warehouseId, id);
        if (active) requireActive(warehouse);
        location.setActive(active);
        return storageLocationMapper.toResponse(storageLocationRepository.saveAndFlush(location));
    }

    private Warehouse lockWarehouse(UUID id) {
        // Every capacity mutation locks the parent first, including warehouse capacity updates.
        return warehouseRepository
                .findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    private StorageLocation findLocation(UUID warehouseId, UUID id) {
        return storageLocationRepository
                .findByIdAndWarehouseId(id, warehouseId)
                .orElseThrow(
                        () ->
                                new ResourceNotFoundException(
                                        "Storage location not found in warehouse"));
    }

    private void requireActive(Warehouse warehouse) {
        if (!warehouse.isActive()) throw new ConflictException("Warehouse is inactive");
    }

    private String normalizeCode(String code) {
        return code.trim().toUpperCase(Locale.ROOT);
    }
}
