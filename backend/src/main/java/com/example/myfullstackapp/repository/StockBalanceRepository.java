package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockBalance;

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

    Optional<StockBalance> findByWarehouseIdAndLocationIdAndLotId(
            UUID warehouseId, UUID locationId, String lotId);

    Optional<StockBalance> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    @Query("select coalesce(sum(b.quantityKg),0) from StockBalance b where b.locationId=:id")
    BigDecimal sumQuantityByLocation(@Param("id") UUID locationId);

    @Query("select coalesce(sum(b.quantityKg),0) from StockBalance b where b.warehouseId=:id")
    BigDecimal sumQuantityByWarehouse(@Param("id") UUID warehouseId);
}
