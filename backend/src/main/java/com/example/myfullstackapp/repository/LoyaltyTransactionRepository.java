package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.LoyaltyTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface LoyaltyTransactionRepository extends JpaRepository<LoyaltyTransaction, UUID> {

    @Query("SELECT t FROM LoyaltyTransaction t WHERE t.user.id = :userId ORDER BY t.createdAt DESC")
    List<LoyaltyTransaction> findByUserIdOrderByCreatedAtDesc(@Param("userId") UUID userId);

    @Query("SELECT t FROM LoyaltyTransaction t WHERE LOWER(t.user.email) = LOWER(:email) ORDER BY t.createdAt DESC")
    List<LoyaltyTransaction> findByUserEmailIgnoreCaseOrderByCreatedAtDesc(@Param("email") String email);
}
