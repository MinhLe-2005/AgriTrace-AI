package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseSensorDevice;

import org.springframework.data.jpa.repository.*;

import java.util.*;

public interface WarehouseSensorDeviceRepository
        extends JpaRepository<WarehouseSensorDevice, UUID> {
    interface AuthScope {
        UUID getWarehouseId();

        String getKeyHash();
    }

    @Query(
            "select d.warehouseId as warehouseId, d.keyHash as keyHash from WarehouseSensorDevice d"
                    + " where d.id=:id and d.active=true")
    Optional<AuthScope> authentication(UUID id);

    List<WarehouseSensorDevice> findByWarehouseIdOrderByCreatedAtAsc(UUID id);

    Optional<WarehouseSensorDevice> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    @Query("select d.warehouseId from WarehouseSensorDevice d where d.id=:id")
    Optional<UUID> warehouseForDevice(UUID id);
}
