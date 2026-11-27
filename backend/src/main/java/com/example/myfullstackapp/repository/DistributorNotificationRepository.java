package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.DistributorNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DistributorNotificationRepository extends JpaRepository<DistributorNotification, UUID> {
    List<DistributorNotification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
    List<DistributorNotification> findByRecipientEmailIgnoreCaseAndReadFalseOrderByCreatedAtDesc(String recipientEmail);
    Optional<DistributorNotification> findByIdAndRecipientEmailIgnoreCase(UUID id, String recipientEmail);
    long countByRecipientEmailIgnoreCaseAndReadFalse(String recipientEmail);
    boolean existsByRecipientEmailIgnoreCaseAndTypeAndReferenceCode(String recipientEmail,
                                                                      com.example.myfullstackapp.entity.DistributorNotificationType type,
                                                                      String referenceCode);
}
