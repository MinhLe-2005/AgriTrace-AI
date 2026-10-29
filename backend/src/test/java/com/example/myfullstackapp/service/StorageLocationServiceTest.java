package com.example.myfullstackapp.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.mapper.StorageLocationMapper;
import com.example.myfullstackapp.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

class StorageLocationServiceTest {
    private final WarehouseRepository warehouses = mock(WarehouseRepository.class);
    private final StorageLocationRepository locations = mock(StorageLocationRepository.class);
    private final StorageLocationService service =
            new StorageLocationService(
                    warehouses,
                    locations,
                    Mappers.getMapper(StorageLocationMapper.class),
                    new CapacityValidationService());
    private Warehouse warehouse;
    private StorageLocation location;

    @BeforeEach
    void setUp() {
        warehouse = Warehouse.builder().capacityTons(new BigDecimal("10.00")).build();
        location =
                StorageLocation.builder()
                        .warehouse(warehouse)
                        .code("A-01")
                        .name("Rack A")
                        .capacityTons(new BigDecimal("3.00"))
                        .tempTargetC(new BigDecimal("4.0"))
                        .humidityTarget(new BigDecimal("85.0"))
                        .build();
        when(warehouses.findByIdForUpdate(warehouse.getId())).thenReturn(Optional.of(warehouse));
        when(locations.findByIdAndWarehouseId(location.getId(), warehouse.getId()))
                .thenReturn(Optional.of(location));
        when(locations.sumCapacityTonsByWarehouseId(warehouse.getId()))
                .thenReturn(new BigDecimal("8.00"));
        when(locations.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
    }

    @Test
    void createsAtCapacityBoundaryAndNormalizesCode() {
        var response = service.create(warehouse.getId(), createRequest("a-02", "2.00"));
        assertEquals("A-02", response.code());
        assertEquals(warehouse.getId(), response.warehouseId());
        var order = inOrder(warehouses, locations);
        order.verify(warehouses).findByIdForUpdate(warehouse.getId());
        order.verify(locations).existsByWarehouseIdAndCode(warehouse.getId(), "A-02");
        order.verify(locations).sumCapacityTonsByWarehouseId(warehouse.getId());
    }

    @Test
    void rejectsOverflowWithoutSaving() {
        assertThrows(
                ConflictException.class,
                () -> service.create(warehouse.getId(), createRequest("B", "2.01")));
        verify(locations, never()).saveAndFlush(any());
    }

    @Test
    void rejectsCaseInsensitiveDuplicateWithinWarehouse() {
        when(locations.existsByWarehouseIdAndCode(warehouse.getId(), "A-01")).thenReturn(true);
        assertThrows(
                ConflictException.class,
                () -> service.create(warehouse.getId(), createRequest("a-01", "1.00")));
        verify(locations, never()).saveAndFlush(any());
    }

    @Test
    void replacementCapacityExcludesOldAllocation() {
        var response = service.update(warehouse.getId(), location.getId(), updateRequest("5.00"));
        assertEquals(new BigDecimal("5.00"), response.capacityTons());
    }

    @Test
    void rejectsUpdateOverflowAndDuplicateCode() {
        assertThrows(
                ConflictException.class,
                () -> service.update(warehouse.getId(), location.getId(), updateRequest("5.01")));
        assertEquals(new BigDecimal("3.00"), location.getCapacityTons());
        when(locations.existsByWarehouseIdAndCodeAndIdNot(
                        warehouse.getId(), "A-01", location.getId()))
                .thenReturn(true);
        assertThrows(
                ConflictException.class,
                () -> service.update(warehouse.getId(), location.getId(), updateRequest("1.00")));
        verify(locations, never()).saveAndFlush(any());
    }

    @Test
    void cannotReadOrUpdateLocationThroughAnotherWarehouse() {
        UUID other = UUID.randomUUID();
        when(warehouses.findByIdForUpdate(other))
                .thenReturn(Optional.of(Warehouse.builder().id(other).build()));
        assertThrows(
                ResourceNotFoundException.class, () -> service.getById(other, location.getId()));
        assertThrows(
                ResourceNotFoundException.class,
                () -> service.update(other, location.getId(), updateRequest("1.00")));
        verify(locations, never()).saveAndFlush(any());
    }

    @Test
    void inactiveWarehouseBlocksCreateUpdateAndReactivation() {
        warehouse.setActive(false);
        assertThrows(
                ConflictException.class,
                () -> service.create(warehouse.getId(), createRequest("B", "1.00")));
        assertThrows(
                ConflictException.class,
                () -> service.update(warehouse.getId(), location.getId(), updateRequest("1.00")));
        assertThrows(
                ConflictException.class,
                () -> service.setActive(warehouse.getId(), location.getId(), true));
        assertFalse(service.setActive(warehouse.getId(), location.getId(), false).active());
    }

    @Test
    void deactivationDoesNotDeleteOrFreeReservedCapacity() {
        service.setActive(warehouse.getId(), location.getId(), false);
        assertFalse(location.isActive());
        verify(locations, never()).delete(any());
        verify(locations, never()).sumCapacityTonsByWarehouseId(any());
    }

    @Test
    void listingMissingWarehouseReturnsNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> service.getAll(UUID.randomUUID()));
    }

    private StorageLocationCreateRequest createRequest(String code, String capacity) {
        return new StorageLocationCreateRequest(
                code,
                "Rack",
                new BigDecimal(capacity),
                new BigDecimal("4.0"),
                new BigDecimal("85.0"));
    }

    private StorageLocationUpdateRequest updateRequest(String capacity) {
        return new StorageLocationUpdateRequest(
                "A-01",
                "Rack",
                new BigDecimal(capacity),
                new BigDecimal("4.0"),
                new BigDecimal("85.0"));
    }
}
