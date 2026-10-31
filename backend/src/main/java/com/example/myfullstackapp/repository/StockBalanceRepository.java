package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.StockBalance;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.*;

public interface StockBalanceRepository extends JpaRepository<StockBalance, UUID> {
    List<StockBalance> findByWarehouseIdOrderByExpiryDateAscLotIdAscLocationIdAsc(UUID warehouseId);

    Optional<StockBalance> findByWarehouseIdAndLocationIdAndLotId(
            UUID warehouseId, UUID locationId, String lotId);

    Optional<StockBalance> findByIdAndWarehouseId(UUID id, UUID warehouseId);

    @Query("select coalesce(sum(b.quantityKg),0) from StockBalance b where b.locationId=:id")
    BigDecimal sumQuantityByLocation(@Param("id") UUID locationId);
}
