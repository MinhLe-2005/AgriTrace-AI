package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StorageLocation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StorageLocationRepository extends JpaRepository<StorageLocation, UUID> {
    @Query("select l from StorageLocation l where l.warehouse.id=:warehouseId and l.id in :ids")
    List<StorageLocation> findForBalances(
            @Param("warehouseId") UUID warehouseId, @Param("ids") Collection<UUID> ids);

    List<StorageLocation> findByWarehouseIdOrderByCodeAsc(UUID warehouseId);

    Optional<StorageLocation> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    boolean existsByWarehouseIdAndCode(UUID warehouseId, String code);

    boolean existsByWarehouseIdAndCodeAndIdNot(UUID warehouseId, String code, UUID id);

    @Query(
            "select coalesce(sum(s.capacityTons), 0) from StorageLocation s where s.warehouse.id ="
                    + " :warehouseId")
    BigDecimal sumCapacityTonsByWarehouseId(@Param("warehouseId") UUID warehouseId);
}
