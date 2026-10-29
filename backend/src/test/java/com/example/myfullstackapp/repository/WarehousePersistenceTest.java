package com.example.myfullstackapp.repository;

import static org.junit.jupiter.api.Assertions.*;

import com.example.myfullstackapp.dto.warehouse.*;
import com.example.myfullstackapp.exception.ConflictException;
import com.example.myfullstackapp.mapper.StorageLocationMapperImpl;
import com.example.myfullstackapp.mapper.WarehouseMapperImpl;
import com.example.myfullstackapp.service.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.util.UUID;
import java.util.concurrent.*;

// Generate a disposable test schema; shared migrations require separate team approval.
@DataJpaTest(
        properties = {"spring.flyway.enabled=false", "spring.jpa.hibernate.ddl-auto=create-drop"})
@ActiveProfiles("warehouse-test")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import({
    WarehouseService.class,
    StorageLocationService.class,
    CapacityValidationService.class,
    WarehouseMapperImpl.class,
    StorageLocationMapperImpl.class
})
@Testcontainers(disabledWithoutDocker = true)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
class WarehousePersistenceTest {
    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    private WarehouseService warehouses;
    @Autowired
    private StorageLocationService locations;
    @Autowired
    private StorageLocationRepository locationRepository;
    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void cleanDatabase() {
        jdbc.update("DELETE FROM storage_locations");
        jdbc.update("DELETE FROM warehouses");
    }

    @Test
    void mappingsSupportBothResourcesAndKeepInactiveAllocations() {
        var warehouse = createWarehouse();
        var location = locations.create(warehouse.id(), request("A", "3.00"));
        assertNotNull(warehouse.createdAt());
        assertNotNull(location.createdAt());
        assertNotNull(location.updatedAt());
        locations.setActive(warehouse.id(), location.id(), false);
        assertEquals(
                0,
                new BigDecimal("3.00")
                        .compareTo(warehouses.getCapacity(warehouse.id()).allocatedCapacityTons()));
        assertEquals(warehouse.id(), locations.getAll(warehouse.id()).getFirst().warehouseId());
    }

    @Test
    void databaseRejectsDuplicateCodesAndInvalidDirectWrites() {
        var warehouse = createWarehouse();
        locations.create(warehouse.id(), request("A", "1.00"));
        assertThrows(
                DataIntegrityViolationException.class,
                () ->
                        jdbc.update(
                                """
INSERT INTO storage_locations (id, warehouse_id, code, name, capacity_tons, temp_target_c,
                               humidity_target, active, created_at, updated_at)
VALUES (?, ?, 'A', 'Duplicate', 1.00, 4.0, 85.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
""",
                                UUID.randomUUID(),
                                warehouse.id()));
        assertThrows(
                DataIntegrityViolationException.class,
                () ->
                        jdbc.update(
                                """
INSERT INTO storage_locations (id, warehouse_id, code, name, capacity_tons, temp_target_c,
                               humidity_target, active, created_at, updated_at)
VALUES (?, ?, 'lowercase', 'Invalid', -1.00, 4.0, 101.0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
""",
                                UUID.randomUUID(),
                                warehouse.id()));
        assertEquals(1, locationRepository.count());
    }

    @Test
    void concurrentLocationCreatesCannotOverbookWarehouse() throws Exception {
        var warehouse = createWarehouse();
        boolean[] results =
                runTogether(
                        () -> locations.create(warehouse.id(), request("A", "6.00")),
                        () -> locations.create(warehouse.id(), request("B", "6.00")));
        assertNotEquals(results[0], results[1]);
        assertEquals(1, locationRepository.count());
        assertEquals(
                0,
                new BigDecimal("6.00")
                        .compareTo(warehouses.getCapacity(warehouse.id()).allocatedCapacityTons()));
    }

    @Test
    void concurrentWarehouseShrinkAndLocationCreateShareParentLock() throws Exception {
        var warehouse = createWarehouse();
        boolean[] results =
                runTogether(
                        () ->
                                warehouses.update(
                                        warehouse.id(),
                                        new WarehouseUpdateRequest(
                                                "Store",
                                                "HCM",
                                                null,
                                                new BigDecimal("5.00"),
                                                new BigDecimal("4.0"),
                                                new BigDecimal("85.0"))),
                        () -> locations.create(warehouse.id(), request("A", "6.00")));
        assertNotEquals(results[0], results[1]);
        var capacity = warehouses.getCapacity(warehouse.id());
        assertTrue(capacity.allocatedCapacityTons().compareTo(capacity.capacityTons()) <= 0);
    }

    @Test
    void codesAreScopedToWarehouseAndLocationsCannotBeAccessedThroughAnotherWarehouse() {
        var first = createWarehouse();
        var second = createWarehouse();
        var firstLocation = locations.create(first.id(), request("A", "2.00"));
        var secondLocation = locations.create(second.id(), request("A", "3.00"));
        assertNotEquals(firstLocation.id(), secondLocation.id());
        assertTrue(
                locationRepository
                        .findByIdAndWarehouseId(firstLocation.id(), second.id())
                        .isEmpty());
        assertEquals(
                0,
                new BigDecimal("2.00")
                        .compareTo(warehouses.getCapacity(first.id()).allocatedCapacityTons()));
        assertEquals(
                0,
                new BigDecimal("3.00")
                        .compareTo(warehouses.getCapacity(second.id()).allocatedCapacityTons()));
    }

    private WarehouseResponse createWarehouse() {
        return warehouses.create(
                new WarehouseCreateRequest(
                        "Cold store",
                        "HCM",
                        null,
                        BigDecimal.TEN,
                        new BigDecimal("4.0"),
                        new BigDecimal("85.0")));
    }

    private StorageLocationCreateRequest request(String code, String capacity) {
        return new StorageLocationCreateRequest(
                code,
                "Rack",
                new BigDecimal(capacity),
                new BigDecimal("4.0"),
                new BigDecimal("85.0"));
    }

    private boolean[] runTogether(Callable<?> first, Callable<?> second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Future<Boolean> a = executor.submit(() -> attempt(first, ready, start));
            Future<Boolean> b = executor.submit(() -> attempt(second, ready, start));
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            return new boolean[] {a.get(20, TimeUnit.SECONDS), b.get(20, TimeUnit.SECONDS)};
        } finally {
            start.countDown();
        }
    }

    private boolean attempt(Callable<?> operation, CountDownLatch ready, CountDownLatch start)
            throws Exception {
        ready.countDown();
        if (!start.await(5, TimeUnit.SECONDS))
            throw new TimeoutException("Concurrent test did not start");
        try {
            operation.call();
            return true;
        } catch (ConflictException expected) {
            return false;
        }
    }
}
