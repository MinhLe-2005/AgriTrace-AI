package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockBalance;
import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.InventoryLabel;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public interface StockBalanceRepository extends JpaRepository<StockBalance, UUID> {
    @Query(
            """
            select b from StockBalance b
            where b.warehouseId=:warehouseId
              and (:lotId is null or b.lotId=:lotId)
              and (:locationId is null or b.locationId=:locationId)
              and (:onlyAvailable=false or
                   (b.held=false and b.quantityKg>0 and b.expiryDate>=:today
                    and exists (select l.id from StorageLocation l
                                where l.id=b.locationId and l.warehouse.id=:warehouseId
                                  and l.active=true and l.warehouse.active=true)))
            """)
    Slice<StockBalance> searchWarehouse(
            @Param("warehouseId") UUID warehouseId,
            @Param("lotId") String lotId,
            @Param("locationId") UUID locationId,
            @Param("onlyAvailable") boolean onlyAvailable,
            @Param("today") LocalDate today,
            Pageable page);

    List<StockBalance> findByWarehouseIdOrderByExpiryDateAscLotIdAscLocationIdAsc(UUID warehouseId);

    List<StockBalance> findByWarehouseIdAndQuantityKgGreaterThanOrderByExpiryDateAscLotIdAscLocationIdAsc(
            UUID warehouseId, BigDecimal minQuantityKg);

    List<StockBalance> findByWarehouseIdAndIdIn(UUID warehouseId, Collection<UUID> ids);

    @Query("""
            select b from StockBalance b
            join StorageLocation l on l.id=b.locationId and l.warehouse.id=b.warehouseId
            where b.warehouseId=:warehouseId
              and (:search='' or locate(lower(:search),lower(b.lotCode))>0
                   or locate(lower(:search),lower(b.productId))>0
                   or locate(lower(:search),lower(l.code))>0
                   or locate(lower(:search),lower(l.name))>0)
            """)
    Slice<StockBalance> searchStockTable(
            @Param("warehouseId") UUID warehouseId, @Param("search") String search, Pageable page);

    @Query("select distinct b.productId from StockBalance b where b.warehouseId=:warehouseId order by b.productId")
    List<String> productNames(@Param("warehouseId") UUID warehouseId);

    @Query("""
            select new com.example.myfullstackapp.dto.warehouse.WarehouseOperations$InventoryLabel(b.id,b.lotId,b.lotCode,b.productId) from StockBalance b
            where b.warehouseId=:warehouseId and b.id in :ids
            """)
    List<InventoryLabel> labelsForBalances(@Param("warehouseId") UUID warehouseId, @Param("ids") List<UUID> ids);

    @Query("""
            select distinct new com.example.myfullstackapp.dto.warehouse.WarehouseOperations$LotLabel(b.lotId,b.lotCode,b.productId) from StockBalance b
            where b.warehouseId=:warehouseId and b.lotId in :ids
            """)
    List<com.example.myfullstackapp.dto.warehouse.WarehouseOperations.LotLabel> labelsForLots(@Param("warehouseId") UUID warehouseId, @Param("ids") List<String> ids);

    List<StockBalance> findByLotCodeIgnoreCaseOrderByReceivedAtAsc(String lotCode);

    Optional<StockBalance> findByWarehouseIdAndLocationIdAndLotId(
            UUID warehouseId, UUID locationId, String lotId);

    Optional<StockBalance> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    @Query("select coalesce(sum(b.quantityKg),0) from StockBalance b where b.locationId=:id")
    BigDecimal sumQuantityByLocation(@Param("id") UUID locationId);

    @Query("select coalesce(sum(b.quantityKg),0) from StockBalance b where b.warehouseId=:id")
    BigDecimal sumQuantityByWarehouse(@Param("id") UUID warehouseId);
}
