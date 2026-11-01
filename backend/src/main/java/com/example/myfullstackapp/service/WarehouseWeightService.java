package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.warehouse.WarehouseOperations.*;
import com.example.myfullstackapp.entity.WarehouseUnitConversion;
import com.example.myfullstackapp.exception.WarehouseIntegrationException;
import com.example.myfullstackapp.repository.WarehouseUnitConversionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
public class WarehouseWeightService {
    private final WarehouseUnitConversionRepository conversions;
    private final InventoryService inventory;

    public BigDecimal toKg(UUID warehouseId, String product, BigDecimal count, String unit) {
        String normalized = normalize(unit);
        return switch (normalized) {
            case "kg" -> count;
            case "g" -> count.divide(new BigDecimal("1000"));
            case "t", "ton", "tấn" -> count.multiply(new BigDecimal("1000"));
            default ->
                    count.multiply(
                            conversions
                                    .findByProductKeyAndUnit(product, normalized)
                                    .orElseThrow(
                                            () ->
                                                    new WarehouseIntegrationException(
                                                            "Configure a measured KG conversion for"
                                                                    + " "
                                                                    + product
                                                                    + " / "
                                                                    + normalized
                                                                    + " before reserving this"
                                                                    + " order"))
                                    .getKgPerUnit());
        };
    }

    private String normalize(String unit) {
        if (unit == null || unit.isBlank())
            throw new WarehouseIntegrationException("Commercial unit is missing");
        return Normalizer.normalize(unit.trim(), Normalizer.Form.NFC).toLowerCase(Locale.ROOT);
    }

    @Transactional
    public UnitConversionView save(UUID warehouseId, UnitConversionInput input, String actor) {
        inventory.lock(warehouseId, null);
        String unit = normalize(input.unit());
        if (Set.of("kg", "g", "t", "ton", "tấn").contains(unit))
            throw new IllegalArgumentException("Standard weight units have fixed conversions");
        var conversion =
                conversions
                        .findByProductKeyAndUnit(input.productId().trim(), unit)
                        .orElseGet(WarehouseUnitConversion::new);
        conversion.setWarehouseId(warehouseId);
        conversion.setProductKey(input.productId().trim());
        conversion.setUnit(unit);
        conversion.setKgPerUnit(input.kgPerUnit());
        conversion.setUpdatedBy(actor);
        conversion.setUpdatedAt(Instant.now());
        return view(conversions.saveAndFlush(conversion));
    }

    @Transactional(readOnly = true)
    public List<UnitConversionView> list(UUID warehouseId) {
        inventory.requireWarehouse(warehouseId);
        return conversions.findAllByOrderByProductKeyAscUnitAsc().stream().map(this::view).toList();
    }

    private UnitConversionView view(WarehouseUnitConversion u) {
        return new UnitConversionView(
                u.getProductKey(),
                u.getUnit(),
                u.getKgPerUnit(),
                u.getUpdatedBy(),
                u.getUpdatedAt());
    }
}
