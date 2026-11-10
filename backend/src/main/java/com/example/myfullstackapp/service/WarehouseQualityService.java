package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.QualityInspection;
import com.example.myfullstackapp.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseQualityService {
    private final InventoryService inventory;
    private final StockBalanceRepository balances;
    private final QualityInspectionRepository inspections;

    @Transactional
    public InspectionView inspect(UUID warehouseId, InspectionInput input, String actor) {
        inventory.lock(warehouseId, null);
        var balance = inventory.balance(warehouseId, input.balanceId());
        balance.setHeld(input.held());
        balances.saveAndFlush(balance);
        var inspection = new QualityInspection();
        inspection.setWarehouseId(warehouseId);
        inspection.setBalanceId(balance.getId());
        inspection.setHeld(input.held());
        inspection.setNote(input.note().trim());
        inspection.setActor(actor);
        return view(inspections.saveAndFlush(inspection));
    }

    @Transactional(readOnly = true)
    public List<InspectionView> list(UUID warehouseId, int page) {
        inventory.requireWarehouse(warehouseId);
        return inspections
                .findByWarehouseIdOrderByCreatedAtDesc(warehouseId, PageRequest.of(page, 100))
                .stream()
                .map(this::view)
                .toList();
    }

    private InspectionView view(QualityInspection i) {
        return new InspectionView(
                i.getId(),
                i.getBalanceId(),
                i.isHeld(),
                i.getNote(),
                i.getActor(),
                i.getCreatedAt());
    }
}
