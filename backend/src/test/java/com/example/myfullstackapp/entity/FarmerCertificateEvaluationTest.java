package com.example.myfullstackapp.entity;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FarmerCertificateEvaluationTest {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    @Test
    void classifiesCertificateValidityAcrossAllThreeThresholds() {
        LocalDate today = LocalDate.now();

        FarmerCertificate validCert = FarmerCertificate.builder()
                .certNumber("VG-VALID-01")
                .name("VietGAP")
                .farmCode("NT-DL-01")
                .expiryDate(today.plusDays(31).format(FMT))
                .build();
        assertEquals("VALID", validCert.evaluateValidityStatus());

        FarmerCertificate boundaryExpiring = FarmerCertificate.builder()
                .certNumber("VG-WARN-30")
                .name("VietGAP")
                .farmCode("NT-DL-01")
                .expiryDate(today.plusDays(30).format(FMT))
                .build();
        assertEquals("EXPIRING_SOON", boundaryExpiring.evaluateValidityStatus());

        FarmerCertificate todayExpiring = FarmerCertificate.builder()
                .certNumber("VG-WARN-0")
                .name("VietGAP")
                .farmCode("NT-DL-01")
                .expiryDate(today.format(FMT))
                .build();
        assertEquals("EXPIRING_SOON", todayExpiring.evaluateValidityStatus());

        FarmerCertificate expiredCert = FarmerCertificate.builder()
                .certNumber("VG-EXP-01")
                .name("VietGAP")
                .farmCode("NT-DL-01")
                .expiryDate(today.minusDays(1).format(FMT))
                .build();
        assertEquals("EXPIRED", expiredCert.evaluateValidityStatus());
    }
}
