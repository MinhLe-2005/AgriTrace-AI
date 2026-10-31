package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProductNameOrderByCreatedAtDesc(String productName);
    List<Review> findByOrderCodeOrderByCreatedAtDesc(String orderCode);
    List<Review> findByUserEmailOrderByCreatedAtDesc(String userEmail);
    boolean existsByOrderCodeAndProductName(String orderCode, String productName);
}
