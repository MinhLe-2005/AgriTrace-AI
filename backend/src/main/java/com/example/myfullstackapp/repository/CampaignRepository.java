package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Campaign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CampaignRepository extends JpaRepository<Campaign, String> {
    List<Campaign> findAllByOrderByCreatedAtDesc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, String id);
}
