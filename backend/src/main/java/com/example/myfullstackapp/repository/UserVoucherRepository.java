package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, Long> {
    List<UserVoucher> findByUserEmailIgnoreCaseOrderBySavedAtDesc(String userEmail);
    Optional<UserVoucher> findByUserEmailIgnoreCaseAndVoucherCodeIgnoreCase(String userEmail, String voucherCode);
    boolean existsByUserEmailIgnoreCaseAndVoucherCodeIgnoreCase(String userEmail, String voucherCode);
}
