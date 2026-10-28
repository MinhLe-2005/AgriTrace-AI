package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {
    List<Product> findByActiveTrue();
    List<Product> findByCategoryCodeAndActiveTrue(String categoryCode);
    List<Product> findByFeaturedTrueAndActiveTrue();
    Optional<Product> findByBatchCode(String batchCode);
}
