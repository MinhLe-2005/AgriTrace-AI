package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.HarvestLot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HarvestLotRepository extends JpaRepository<HarvestLot, Long> {

    List<HarvestLot> findAllByOrderByCreatedAtDesc();

    Optional<HarvestLot> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    List<HarvestLot> findByStatusIgnoreCase(String status);

    void deleteByCodeIgnoreCase(String code);
}
