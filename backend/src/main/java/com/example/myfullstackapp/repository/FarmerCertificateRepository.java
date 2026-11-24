package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.FarmerCertificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FarmerCertificateRepository extends JpaRepository<FarmerCertificate, Long> {

    Optional<FarmerCertificate> findByCertNumberIgnoreCase(String certNumber);

    List<FarmerCertificate> findAllByOrderByCreatedAtDesc();

    List<FarmerCertificate> findByOwnerIdIgnoreCaseOrderByCreatedAtDesc(String ownerId);

    List<FarmerCertificate> findByFarmCode(String farmCode);
}
