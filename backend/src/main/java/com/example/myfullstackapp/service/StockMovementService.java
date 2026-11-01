package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.MovementView;
import com.example.myfullstackapp.repository.StockMovementRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StockMovementService {
    private final InventoryService inventory;
    private final StockMovementRepository movements;

    @Transactional(readOnly = true)
    public List<MovementView> list(UUID warehouseId, LocalDate from, LocalDate to, int page) {
        inventory.requireWarehouse(warehouseId);
        if (from.isAfter(to) || to.isAfter(from.plusYears(1)))
            throw new IllegalArgumentException("Date range must be ordered and at most one year");
        var zone = ZoneId.of("Asia/Ho_Chi_Minh");
        return movements
                .findByWarehouseIdAndOccurredAtGreaterThanEqualAndOccurredAtLessThanOrderByOccurredAtDesc(
                        warehouseId,
                        from.atStartOfDay(zone).toInstant(),
                        to.plusDays(1).atStartOfDay(zone).toInstant(),
                        PageRequest.of(page, 100))
                .stream()
                .map(
                        m ->
                                new MovementView(
                                        m.getId(),
                                        m.getLotId(),
                                        m.getLocationId(),
                                        m.getDocumentId(),
                                        m.getType(),
                                        m.getDeltaKg(),
                                        m.getBalanceAfterKg(),
                                        m.getActor(),
                                        m.getOccurredAt()))
                .toList();
    }
}
