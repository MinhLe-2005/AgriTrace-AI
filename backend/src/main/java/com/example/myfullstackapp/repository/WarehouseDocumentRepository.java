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

        UUID getWarehouseId();

        UUID getTargetWarehouseId();

        WarehouseDocument.Type getType();
    }

    @Query(
            "select d.id as id, d.warehouseId as warehouseId, d.targetWarehouseId as"
                + " targetWarehouseId, d.type as type from WarehouseDocument d where d.id=:id and"
                + " (d.warehouseId=:warehouseId or d.targetWarehouseId=:warehouseId)")
    Optional<LockScope> findLockScopeByIdAndWarehouseId(
            @Param("id") UUID id, @Param("warehouseId") UUID warehouseId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query(
            "select d from WarehouseDocument d where d.id=:id and (d.warehouseId=:warehouseId or"
                + " d.targetWarehouseId=:warehouseId)")
    Optional<WarehouseDocument> findScopedForUpdate(
            @Param("id") UUID id, @Param("warehouseId") UUID warehouseId);

    Optional<WarehouseDocument> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    @Query(
            "select d from WarehouseDocument d where d.id=:id and (d.warehouseId=:warehouseId or"
                + " (d.targetWarehouseId=:warehouseId and d.type=:type))")
    Optional<WarehouseDocument> findVisible(
            @Param("id") UUID id,
            @Param("warehouseId") UUID warehouseId,
            @Param("type") WarehouseDocument.Type type);

    @Query(
            "select d from WarehouseDocument d where d.warehouseId=:warehouseId or"
                + " (d.targetWarehouseId=:warehouseId and d.type=:type) order by d.createdAt desc,"
                + " d.id desc")
    List<WarehouseDocument> findVisibleDocuments(
            @Param("warehouseId") UUID warehouseId,
            @Param("type") WarehouseDocument.Type type,
            Pageable page);

    List<WarehouseDocument> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable page);

    long countByWarehouseIdAndStatus(UUID warehouseId, WarehouseDocument.Status status);
}
