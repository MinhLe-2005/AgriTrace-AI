package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.WarehouseUnitConversion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface WarehouseUnitConversionRepository
        extends JpaRepository<WarehouseUnitConversion, UUID> {
    Optional<WarehouseUnitConversion> findByProductKeyAndUnit(String productKey, String unit);

    List<WarehouseUnitConversion> findAllByOrderByProductKeyAscUnitAsc();
}
