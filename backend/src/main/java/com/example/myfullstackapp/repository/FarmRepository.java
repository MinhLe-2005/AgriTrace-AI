package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Farm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmRepository extends JpaRepository<Farm, Long> {
    List<Farm> findAllByOrderByIdAsc();
    List<Farm> findByOwnerIdIgnoreCaseOrderByIdAsc(String ownerId);
    Optional<Farm> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
    Optional<Farm> findByVerificationRequestId(java.util.UUID verificationRequestId);
}
