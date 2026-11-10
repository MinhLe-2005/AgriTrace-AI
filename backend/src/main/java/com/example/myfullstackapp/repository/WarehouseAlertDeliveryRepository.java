package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseAlertDelivery;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;

import java.time.Instant;
import java.util.*;

public interface WarehouseAlertDeliveryRepository
        extends JpaRepository<WarehouseAlertDelivery, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from WarehouseAlertDelivery d where d.id=:id")
    Optional<WarehouseAlertDelivery> findForUpdate(UUID id);

    @Query(
            "select d.id from WarehouseAlertDelivery d where d.status in ('PENDING','RETRY') and"
                    + " d.nextAttemptAt<=:now order by d.nextAttemptAt")
    List<UUID> due(Instant now, Pageable page);

    List<WarehouseAlertDelivery> findByWarehouseIdOrderByNextAttemptAtDesc(
            UUID warehouseId, Pageable page);
}
