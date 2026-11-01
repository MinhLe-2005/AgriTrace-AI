package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.DistributorQrCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DistributorQrCodeRepository extends JpaRepository<DistributorQrCode, Long> {
    Optional<DistributorQrCode> findByCode(String code);
}
