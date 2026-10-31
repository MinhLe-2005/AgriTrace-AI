package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseDocument;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.*;

public interface WarehouseDocumentRepository extends JpaRepository<WarehouseDocument, UUID> {
    List<WarehouseDocument> findByWarehouseIdAndTypeOrderByCreatedAtDesc(
            UUID warehouseId, WarehouseDocument.Type type, Pageable page);

    interface LockScope {
        UUID getId();

        UUID getTargetWarehouseId();
    }

    Optional<LockScope> findLockScopeByIdAndWarehouseId(UUID id, UUID warehouseId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from WarehouseDocument d where d.id=:id and d.warehouseId=:warehouseId")
    Optional<WarehouseDocument> findScopedForUpdate(
            @Param("id") UUID id, @Param("warehouseId") UUID warehouseId);

    Optional<WarehouseDocument> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    List<WarehouseDocument> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable page);

    long countByWarehouseIdAndStatus(UUID warehouseId, WarehouseDocument.Status status);
}
