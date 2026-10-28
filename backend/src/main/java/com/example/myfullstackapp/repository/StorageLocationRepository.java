package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StorageLocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StorageLocationRepository extends JpaRepository<StorageLocation, UUID> {
    List<StorageLocation> findByWarehouseIdOrderByCodeAsc(UUID warehouseId);
    Optional<StorageLocation> findByIdAndWarehouseId(UUID id, UUID warehouseId);
    boolean existsByWarehouseIdAndCode(UUID warehouseId, String code);
    boolean existsByWarehouseIdAndCodeAndIdNot(UUID warehouseId, String code, UUID id);

    @Query("select coalesce(sum(s.capacityTons), 0) from StorageLocation s where s.warehouse.id = :warehouseId")
    BigDecimal sumCapacityTonsByWarehouseId(@Param("warehouseId") UUID warehouseId);
}
