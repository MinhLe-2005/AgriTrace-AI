package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.WarehouseDocument;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

import java.math.BigDecimal;
import java.time.*;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WarehouseDashboardService {
    private final InventoryService inventory;
    private final StockMovementRepository movements;
    private final RiskAlertRepository alerts;
    private final WarehouseDocumentRepository documents;
    private final WarehouseRiskService risk;

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Dashboard get(UUID id, LocalDate from, LocalDate to) {
        if (from.isAfter(to) || to.isAfter(from.plusYears(1)))
            throw new IllegalArgumentException("Date range must be ordered and at most one year");
        var warehouse = inventory.requireWarehouse(id);
        var stock = inventory.getBalances(id);
        int expiryWarningDays = risk.rule(id).expiryWarningDays();
        var zone = ZoneId.of("Asia/Ho_Chi_Minh");
        var start = from.atStartOfDay(zone).toInstant();
        var end = to.plusDays(1).atStartOfDay(zone).toInstant();
        return new Dashboard(
                stock.stream()
                        .map(BalanceView::quantityKg)
                        .reduce(BigDecimal.ZERO, BigDecimal::add),
                stock.stream()
                        .map(BalanceView::reservedKg)
                        .reduce(BigDecimal.ZERO, BigDecimal::add),
                stock.stream()
                        .map(BalanceView::availableKg)
                        .reduce(BigDecimal.ZERO, BigDecimal::add),
                movements.sumDelta(id, "INBOUND", start, end),
                movements.sumDelta(id, "OUTBOUND", start, end).abs(),
                warehouse.getCapacityTons().multiply(new BigDecimal("1000")),
                stock.stream().filter(b -> b.held() && b.quantityKg().signum() > 0).count(),
                stock.stream()
                        .filter(
                                b ->
                                        b.quantityKg().signum() > 0
                                                && !b.expiryDate()
                                                        .isAfter(
                                                                InventoryService.today()
                                                                        .plusDays(
                                                                                expiryWarningDays)))
                        .count(),
                alerts.findByWarehouseIdOrderByUpdatedAtDesc(id).stream()
                        .filter(a -> !"RESOLVED".equals(a.getStatus()))
                        .count(),
                documents.countByWarehouseIdAndStatus(id, WarehouseDocument.Status.DRAFT),
                from,
                to);
    }
}
