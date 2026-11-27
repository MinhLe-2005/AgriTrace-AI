package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.DistributorNotificationResponse;
import com.example.myfullstackapp.entity.DistributorNotification;
import com.example.myfullstackapp.entity.DistributorNotificationType;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.event.DistributorNotificationCreated;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.DistributorNotificationRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

/** Persistent inbox plus transaction-safe SSE fan-out for distributor operations. */
@Service
@RequiredArgsConstructor
public class DistributorNotificationService {
    private final DistributorNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher events;

    @Transactional(readOnly = true)
    public List<DistributorNotificationResponse> list(String recipientEmail, boolean unreadOnly) {
        List<DistributorNotification> notifications = unreadOnly
                ? notificationRepository.findByRecipientEmailIgnoreCaseAndReadFalseOrderByCreatedAtDesc(normalizedEmail(recipientEmail))
                : notificationRepository.findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(normalizedEmail(recipientEmail));
        return notifications.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(String recipientEmail) {
        return notificationRepository.countByRecipientEmailIgnoreCaseAndReadFalse(normalizedEmail(recipientEmail));
    }

    @Transactional
    public DistributorNotificationResponse markRead(java.util.UUID id, String recipientEmail) {
        DistributorNotification notification = notificationRepository.findByIdAndRecipientEmailIgnoreCase(id, normalizedEmail(recipientEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông báo"));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(Instant.now());
        }
        return toResponse(notification);
    }

    @Transactional
    public long markAllRead(String recipientEmail) {
        List<DistributorNotification> unread = notificationRepository
                .findByRecipientEmailIgnoreCaseAndReadFalseOrderByCreatedAtDesc(normalizedEmail(recipientEmail));
        Instant now = Instant.now();
        unread.forEach(notification -> {
            notification.setRead(true);
            notification.setReadAt(now);
        });
        return unread.size();
    }

    @Transactional
    public void notifyDistributor(String recipientEmail, DistributorNotificationType type, String title, String content, String referenceCode) {
        create(recipientEmail, false, type, title, content, referenceCode);
    }

    /**
     * Inserts an overdue alert atomically. `dedupKey` contains the ETA, so a
     * later ETA correction can legitimately produce a fresh alert.
     */
    @Transactional
    public void notifyDistributorOverdueOnce(String recipientEmail, String title, String content,
                                               String referenceCode, String dedupKey) {
        createOverdueOnce(recipientEmail, false, title, content, referenceCode, dedupKey);
    }

    @Transactional
    public void notifyAdmins(DistributorNotificationType type, String title, String content, String referenceCode) {
        userRepository.findActiveUsersWithRoleForUpdate(RoleName.ADMIN).forEach(admin ->
                create(admin.getEmail(), true, type, title, content, referenceCode));
    }

    @Transactional
    public void notifyAdminsOverdueOnce(String title, String content, String referenceCode, String dedupKey) {
        userRepository.findActiveUsersWithRoleForUpdate(RoleName.ADMIN).forEach(admin ->
                createOverdueOnce(admin.getEmail(), true, title, content, referenceCode, dedupKey));
    }

    private void create(String recipientEmail, boolean adminRecipient, DistributorNotificationType type,
                        String title, String content, String referenceCode) {
        if (recipientEmail == null || recipientEmail.isBlank()) return;
        DistributorNotification saved = notificationRepository.save(DistributorNotification.builder()
                .recipientEmail(normalizedEmail(recipientEmail))
                .type(type)
                .title(title)
                .content(content)
                .referenceCode(referenceCode)
                .build());
        events.publishEvent(new DistributorNotificationCreated(
                saved.getId(), saved.getRecipientEmail(), adminRecipient, saved.getType(), saved.getReferenceCode(), Instant.now()));
    }

    private void createOverdueOnce(String recipientEmail, boolean adminRecipient, String title, String content,
                                   String referenceCode, String dedupKey) {
        if (recipientEmail == null || recipientEmail.isBlank() || dedupKey == null || dedupKey.isBlank()) return;
        UUID id = UUID.randomUUID();
        if (notificationRepository.insertOverdueOnce(id, normalizedEmail(recipientEmail), title, content, referenceCode, dedupKey) == 1) {
            events.publishEvent(new DistributorNotificationCreated(
                    id, normalizedEmail(recipientEmail), adminRecipient, DistributorNotificationType.SHIPMENT_OVERDUE,
                    referenceCode, Instant.now()));
        }
    }

    private DistributorNotificationResponse toResponse(DistributorNotification notification) {
        return new DistributorNotificationResponse(notification.getId(), notification.getType().name(), notification.getTitle(),
                notification.getContent(), notification.getReferenceCode(), notification.isRead(), notification.getCreatedAt(), notification.getReadAt());
    }

    private String normalizedEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
