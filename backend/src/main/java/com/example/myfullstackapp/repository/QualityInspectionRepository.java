package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.QualityInspection;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.*;

public interface QualityInspectionRepository extends JpaRepository<QualityInspection, UUID> {
    List<QualityInspection> findByWarehouseIdOrderByCreatedAtDesc(UUID warehouseId, Pageable page);
}
