package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.FarmerUploadedMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FarmerUploadedMediaRepository extends JpaRepository<FarmerUploadedMedia, UUID> {
}
