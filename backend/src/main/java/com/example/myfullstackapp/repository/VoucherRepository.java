package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long> {
    List<Voucher> findByActiveTrue();
    List<Voucher> findByActiveTrueAndOwnerEmailIsNull();
    List<Voucher> findByActiveTrueAndOwnerEmailIgnoreCase(String ownerEmail);
    boolean existsByCodeIgnoreCase(String code);
    Optional<Voucher> findByCodeIgnoreCaseAndActiveTrue(String code);
}
