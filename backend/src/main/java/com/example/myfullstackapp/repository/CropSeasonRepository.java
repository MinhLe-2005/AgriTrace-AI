package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.CropSeason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CropSeasonRepository extends JpaRepository<CropSeason, Long> {
    List<CropSeason> findAllByOrderByIdAsc();
    List<CropSeason> findByOwnerIdIgnoreCaseOrderByIdAsc(String ownerId);
}
