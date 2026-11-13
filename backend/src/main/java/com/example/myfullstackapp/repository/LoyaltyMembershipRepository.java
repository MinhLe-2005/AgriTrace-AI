package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.LoyaltyMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoyaltyMembershipRepository extends JpaRepository<LoyaltyMembership, UUID> {

    @Query("SELECT m FROM LoyaltyMembership m JOIN FETCH m.user u WHERE u.id = :userId")
    Optional<LoyaltyMembership> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT m FROM LoyaltyMembership m JOIN FETCH m.user u WHERE LOWER(u.email) = LOWER(:email)")
    Optional<LoyaltyMembership> findByUserEmailIgnoreCase(@Param("email") String email);

    @Query("SELECT m FROM LoyaltyMembership m JOIN FETCH m.user u ORDER BY m.currentPoints DESC")
    List<LoyaltyMembership> findAllByOrderByCurrentPointsDesc();
}
