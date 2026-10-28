package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.entity.Warehouse;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.mapper.WarehouseMapper;
import com.example.myfullstackapp.repository.StorageLocationRepository;
import com.example.myfullstackapp.repository.UserRepository;
import com.example.myfullstackapp.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;
    private final StorageLocationRepository storageLocationRepository;
    private final UserRepository userRepository;
    private final WarehouseMapper warehouseMapper;
    private final CapacityValidationService capacityValidationService;

    @Transactional(readOnly = true)
    public List<WarehouseResponse> getAll() {
        return warehouseRepository.findAll(Sort.by("name", "id")).stream().map(warehouseMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public WarehouseResponse getById(UUID id) { return warehouseMapper.toResponse(findWarehouse(id)); }

    @Transactional
    public WarehouseResponse create(WarehouseCreateRequest request) {
        Warehouse warehouse = Warehouse.builder().name(request.name().trim()).location(request.location().trim())
                .manager(resolveManager(request.managerId())).capacityTons(request.capacityTons())
                .tempTargetC(request.tempTargetC()).humidityTarget(request.humidityTarget()).build();
        return warehouseMapper.toResponse(warehouseRepository.saveAndFlush(warehouse));
    }

    @Transactional
    public WarehouseResponse update(UUID id, WarehouseUpdateRequest request) {
        Warehouse warehouse = lockWarehouse(id);
        capacityValidationService.validateAllocation(request.capacityTons(), storageLocationRepository.sumCapacityTonsByWarehouseId(id));
        warehouse.setManager(resolveManager(request.managerId()));
        warehouse.setName(request.name().trim());
        warehouse.setLocation(request.location().trim());
        warehouse.setCapacityTons(request.capacityTons());
        warehouse.setTempTargetC(request.tempTargetC());
        warehouse.setHumidityTarget(request.humidityTarget());
        return warehouseMapper.toResponse(warehouseRepository.saveAndFlush(warehouse));
    }

    @Transactional
    public WarehouseResponse setActive(UUID id, boolean active) {
        Warehouse warehouse = lockWarehouse(id);
        warehouse.setActive(active);
        return warehouseMapper.toResponse(warehouseRepository.saveAndFlush(warehouse));
    }

    @Transactional(readOnly = true)
    public WarehouseCapacityResponse getCapacity(UUID id) {
        Warehouse warehouse = findWarehouse(id);
        var allocated = storageLocationRepository.sumCapacityTonsByWarehouseId(id);
        return new WarehouseCapacityResponse(id, warehouse.getCapacityTons(), allocated, warehouse.getCapacityTons().subtract(allocated));
    }

    private Warehouse findWarehouse(UUID id) {
        return warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    private Warehouse lockWarehouse(UUID id) {
        return warehouseRepository.findByIdForUpdate(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse not found"));
    }

    private User resolveManager(UUID id) {
        if (id == null) return null;
        User manager = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        boolean eligible = manager.getRoles().stream().anyMatch(role -> role.getName() == RoleName.WAREHOUSE || role.getName() == RoleName.ADMIN);
        if (!manager.isActive() || !eligible) throw new IllegalArgumentException("Manager must be an active warehouse staff member or admin");
        return manager;
    }
}
