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
     * System events such as an overdue reminder should be visible after an
     * offline period, but must not produce a duplicate inbox item each time a
     * scheduled check runs.
     */
    @Transactional
    public void notifyDistributorOnce(String recipientEmail, DistributorNotificationType type, String title, String content, String referenceCode) {
        if (!notificationRepository.existsByRecipientEmailIgnoreCaseAndTypeAndReferenceCode(
                normalizedEmail(recipientEmail), type, referenceCode)) {
            create(recipientEmail, false, type, title, content, referenceCode);
        }
    }

    @Transactional
    public void notifyAdmins(DistributorNotificationType type, String title, String content, String referenceCode) {
        userRepository.findActiveUsersWithRoleForUpdate(RoleName.ADMIN).forEach(admin ->
                create(admin.getEmail(), true, type, title, content, referenceCode));
    }

    @Transactional
    public void notifyAdminsOnce(DistributorNotificationType type, String title, String content, String referenceCode) {
        userRepository.findActiveUsersWithRoleForUpdate(RoleName.ADMIN).forEach(admin -> {
            if (!notificationRepository.existsByRecipientEmailIgnoreCaseAndTypeAndReferenceCode(
                    normalizedEmail(admin.getEmail()), type, referenceCode)) {
                create(admin.getEmail(), true, type, title, content, referenceCode);
            }
        });
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

    private DistributorNotificationResponse toResponse(DistributorNotification notification) {
        return new DistributorNotificationResponse(notification.getId(), notification.getType().name(), notification.getTitle(),
                notification.getContent(), notification.getReferenceCode(), notification.isRead(), notification.getCreatedAt(), notification.getReadAt());
    }

    private String normalizedEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
