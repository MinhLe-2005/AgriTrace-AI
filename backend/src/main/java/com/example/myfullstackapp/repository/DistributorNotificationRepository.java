package com.example.myfullstackapp.repository;

import com.example.myfullstackapp.entity.DistributorNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DistributorNotificationRepository extends JpaRepository<DistributorNotification, UUID> {
    List<DistributorNotification> findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(String recipientEmail);
    List<DistributorNotification> findByRecipientEmailIgnoreCaseAndReadFalseOrderByCreatedAtDesc(String recipientEmail);
    Optional<DistributorNotification> findByIdAndRecipientEmailIgnoreCase(UUID id, String recipientEmail);
    long countByRecipientEmailIgnoreCaseAndReadFalse(String recipientEmail);

    /**
     * Atomic insert for the scheduled overdue alert. PostgreSQL's partial
     * unique index makes this safe across overlapping jobs and instances.
     */
    @Modifying
    @Query(value = """
            INSERT INTO distributor_notifications
                (id, recipient_email, type, title, content, reference_code, dedup_key, is_read, created_at)
            VALUES
                (:id, :recipientEmail, 'SHIPMENT_OVERDUE', :title, :content, :referenceCode, :dedupKey, FALSE, CURRENT_TIMESTAMP)
            ON CONFLICT (recipient_email, type, dedup_key)
                WHERE type = 'SHIPMENT_OVERDUE' AND dedup_key IS NOT NULL
            DO NOTHING
            """, nativeQuery = true)
    int insertOverdueOnce(@Param("id") UUID id,
                          @Param("recipientEmail") String recipientEmail,
                          @Param("title") String title,
                          @Param("content") String content,
                          @Param("referenceCode") String referenceCode,
                          @Param("dedupKey") String dedupKey);
}
