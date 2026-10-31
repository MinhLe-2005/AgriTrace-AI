package com.example.myfullstackapp.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.entity.*;
import com.example.myfullstackapp.exception.*;
import com.example.myfullstackapp.mapper.WarehouseMapper;
import com.example.myfullstackapp.repository.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

class WarehouseServiceTest {
    private final WarehouseRepository warehouses = mock(WarehouseRepository.class);
    private final StorageLocationRepository locations = mock(StorageLocationRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final WarehouseService service =
            new WarehouseService(
                    warehouses,
                    locations,
                    users,
                    Mappers.getMapper(WarehouseMapper.class),
                    new CapacityValidationService());
    private Warehouse warehouse;

    @BeforeEach
    void setUp() {
        warehouse =
                Warehouse.builder()
                        .name("Cold store")
                        .location("HCM")
                        .capacityTons(new BigDecimal("10.00"))
                        .build();
        when(warehouses.findByIdForUpdate(warehouse.getId())).thenReturn(Optional.of(warehouse));
        when(warehouses.saveAndFlush(any())).thenAnswer(call -> call.getArgument(0));
        when(locations.sumCapacityTonsByWarehouseId(warehouse.getId()))
                .thenReturn(new BigDecimal("8.00"));
    }

    @Test
    void createsWarehouseUsingExistingUserAndNormalizesNames() {
        User manager =
                User.builder()
                        .roles(Set.of(Role.builder().name(RoleName.WAREHOUSE).build()))
                        .build();
        when(users.findById(manager.getId())).thenReturn(Optional.of(manager));
        var response =
                service.create(
                        new WarehouseCreateRequest(
                                " Cold store ",
                                " HCM ",
                                manager.getId(),
                                new BigDecimal("10.00"),
                                new BigDecimal("4.0"),
                                new BigDecimal("85.0")));
        assertEquals("Cold store", response.name());
        assertEquals("HCM", response.location());
        assertEquals(manager.getId(), response.managerId());
        assertTrue(response.active());
    }

    @Test
    void rejectsMissingManager() {
        assertThrows(
                ResourceNotFoundException.class,
                () -> service.create(createRequest(UUID.randomUUID())));
        verify(warehouses, never()).saveAndFlush(any());
    }

    @Test
    void rejectsManagerFromAnotherRoleOrInactiveAccount() {
        User manager =
                User.builder().roles(Set.of(Role.builder().name(RoleName.FARMER).build())).build();
        when(users.findById(manager.getId())).thenReturn(Optional.of(manager));
        assertThrows(
                IllegalArgumentException.class,
                () -> service.create(createRequest(manager.getId())));
        manager.setRoles(Set.of(Role.builder().name(RoleName.ADMIN).build()));
        manager.setActive(false);
        assertThrows(
                IllegalArgumentException.class,
                () -> service.create(createRequest(manager.getId())));
        verify(warehouses, never()).saveAndFlush(any());
    }

    @Test
    void rejectsCapacityReductionBelowAllLocationAllocations() {
        assertThrows(
                ConflictException.class,
                () -> service.update(warehouse.getId(), updateRequest("7.99")));
        assertEquals(new BigDecimal("10.00"), warehouse.getCapacityTons());
        verify(warehouses, never()).saveAndFlush(any());
    }

    @Test
    void permitsExactCapacityBoundaryAndClearsOptionalManager() {
        warehouse.setManager(User.builder().build());
        var response = service.update(warehouse.getId(), updateRequest("8.00"));
        assertEquals(new BigDecimal("8.00"), response.capacityTons());
        assertNull(response.managerId());
        var order = inOrder(warehouses, locations);
        order.verify(warehouses).findByIdForUpdate(warehouse.getId());
        order.verify(locations).sumCapacityTonsByWarehouseId(warehouse.getId());
    }

    @Test
    void deactivationKeepsWarehouseAndCapacityReservations() {
        assertFalse(service.setActive(warehouse.getId(), false).active());
        verify(warehouses, never()).delete(any());
        verifyNoInteractions(locations);
    }

    @Test
    void capacityReportsUnallocatedSpaceRatherThanActualStock() {
        when(warehouses.findById(warehouse.getId())).thenReturn(Optional.of(warehouse));
        assertEquals(
                new BigDecimal("2.00"),
                service.getCapacity(warehouse.getId()).unallocatedCapacityTons());
    }

    @Test
    void missingWarehouseReturnsNotFound() {
        assertThrows(ResourceNotFoundException.class, () -> service.getById(UUID.randomUUID()));
    }

    private WarehouseCreateRequest createRequest(UUID managerId) {
        return new WarehouseCreateRequest(
                "Store",
                "HCM",
                managerId,
                BigDecimal.TEN,
                new BigDecimal("4.0"),
                new BigDecimal("85.0"));
    }

    private WarehouseUpdateRequest updateRequest(String capacity) {
        return new WarehouseUpdateRequest(
                "Store",
                "HCM",
                null,
                new BigDecimal(capacity),
                new BigDecimal("4.0"),
                new BigDecimal("85.0"));
    }
}
