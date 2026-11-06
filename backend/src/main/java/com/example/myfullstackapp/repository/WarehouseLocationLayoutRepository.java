package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseLocationLayout;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface WarehouseLocationLayoutRepository
        extends JpaRepository<WarehouseLocationLayout, UUID> {
    List<WarehouseLocationLayout> findByWarehouseId(UUID warehouseId);

    Optional<WarehouseLocationLayout> findByWarehouseIdAndLevelAndRowAndColumn(
            UUID warehouseId, int level, int row, int column);
}
