package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.exception.ConflictException;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class FefoAllocationService {
    public List<AllocationView> allocate(
            List<BalanceView> balances, String productId, BigDecimal quantity, LocalDate today) {
        if (quantity == null || quantity.signum() <= 0)
            throw new IllegalArgumentException("Quantity must be positive");
        BigDecimal remaining = quantity;
        List<AllocationView> result = new ArrayList<>();
        var eligible =
                balances.stream()
                        .filter(
                                b ->
                                        productId.equals(b.productId())
                                                && !b.held()
                                                && !b.expiryDate().isBefore(today)
                                                && b.availableKg().signum() > 0)
                        .sorted(
                                Comparator.comparing(BalanceView::expiryDate)
                                        .thenComparing(BalanceView::lotId)
                                        .thenComparing(BalanceView::locationId)
                                        .thenComparing(BalanceView::id))
                        .toList();
        for (var balance : eligible) {
            if (remaining.signum() == 0) break;
            BigDecimal take = remaining.min(balance.availableKg());
            result.add(
                    new AllocationView(
                            balance.id(),
                            balance.lotId(),
                            balance.locationId(),
                            balance.lotCode(),
                            balance.expiryDate(),
                            take));
            remaining = remaining.subtract(take);
        }
        if (remaining.signum() > 0) throw new ConflictException("Insufficient eligible stock");
        return List.copyOf(result);
    }
}
