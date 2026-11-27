package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.CreateDistributorChatMessageRequest;
import com.example.myfullstackapp.dto.distributor.DistributorChatMessageResponse;
import com.example.myfullstackapp.entity.DistributorMessageSenderRole;
import com.example.myfullstackapp.entity.DistributorNotificationType;
import com.example.myfullstackapp.entity.DistributorShipmentMessage;
import com.example.myfullstackapp.entity.RoleName;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.event.DistributorShipmentMessageCreated;
import com.example.myfullstackapp.exception.ResourceNotFoundException;
import com.example.myfullstackapp.repository.DistributorShipmentMessageRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Authorization and persistence for the shipment-specific Admin ↔ Distributor thread. */
@Service
@RequiredArgsConstructor
public class DistributorShipmentChatService {
    private final ShipmentRepository shipmentRepository;
    private final DistributorShipmentMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final DistributorNotificationService notificationService;
    private final ApplicationEventPublisher events;

    @Transactional
    public List<DistributorChatMessageResponse> history(String shipmentCode, String actorEmail, boolean isAdmin) {
        assertCanAccess(shipmentCode, actorEmail, isAdmin);
        String actor = normalize(actorEmail);
        List<DistributorShipmentMessage> messages = messageRepository.findByShipmentCodeIgnoreCaseOrderBySentAtAsc(shipmentCode);
        messages.stream()
                .filter(message -> !actor.equalsIgnoreCase(message.getSenderEmail()))
                .filter(message -> !message.isRead())
                .forEach(message -> message.setRead(true));
        return messages.stream().map(this::toResponse).toList();
    }

    @Transactional
    public DistributorChatMessageResponse send(String shipmentCode, CreateDistributorChatMessageRequest request,
                                                String actorEmail, boolean isAdmin) {
        Shipment shipment = assertCanAccess(shipmentCode, actorEmail, isAdmin);
        User sender = userRepository.findByEmailIgnoreCase(normalize(actorEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản gửi tin nhắn"));
        String content = request.content().trim();
        DistributorMessageSenderRole senderRole = isAdmin
                ? DistributorMessageSenderRole.ADMIN
                : DistributorMessageSenderRole.DISTRIBUTOR;
        DistributorShipmentMessage saved = messageRepository.save(DistributorShipmentMessage.builder()
                .shipmentCode(shipment.getShipmentCode())
                .senderId(sender.getId())
                .senderEmail(normalize(sender.getEmail()))
                .senderName(sender.getFullName())
                .senderRole(senderRole)
                .content(content)
                .build());

        List<String> recipients = recipientEmails(shipment, isAdmin);
        String notificationContent = "Chuyến " + shipment.getShipmentCode() + ": " + preview(content);
        if (isAdmin) {
            notificationService.notifyDistributor(shipment.getDistributorEmail(), DistributorNotificationType.NEW_MESSAGE,
                    "Admin vừa nhắn tin", notificationContent, shipment.getShipmentCode());
        } else {
            notificationService.notifyAdmins(DistributorNotificationType.NEW_MESSAGE,
                    "Distributor vừa nhắn tin", notificationContent, shipment.getShipmentCode());
        }
        DistributorChatMessageResponse response = toResponse(saved);
        events.publishEvent(new DistributorShipmentMessageCreated(response, recipients));
        return response;
    }

    private Shipment assertCanAccess(String shipmentCode, String actorEmail, boolean isAdmin) {
        Shipment shipment = shipmentRepository.findByShipmentCodeIgnoreCase(shipmentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chuyến vận chuyển"));
        if (!isAdmin && !normalize(actorEmail).equalsIgnoreCase(normalize(shipment.getDistributorEmail()))) {
            throw new AccessDeniedException("Bạn không có quyền truy cập trao đổi của chuyến này");
        }
        if (shipment.getDistributorEmail() == null || shipment.getDistributorEmail().isBlank()) {
            throw new IllegalStateException("Chuyến vận chuyển chưa được gán Distributor");
        }
        return shipment;
    }

    private List<String> recipientEmails(Shipment shipment, boolean senderIsAdmin) {
        if (senderIsAdmin) return List.of(normalize(shipment.getDistributorEmail()));
        Set<String> adminEmails = new LinkedHashSet<>();
        userRepository.findActiveUsersWithRoleForUpdate(RoleName.ADMIN).forEach(admin -> adminEmails.add(normalize(admin.getEmail())));
        return List.copyOf(adminEmails);
    }

    private DistributorChatMessageResponse toResponse(DistributorShipmentMessage message) {
        return new DistributorChatMessageResponse(message.getId(), message.getShipmentCode(), message.getSenderEmail(),
                message.getSenderName(), message.getSenderRole().name(), message.getContent(), message.isRead(), message.getSentAt());
    }

    private String preview(String value) {
        return value.length() <= 160 ? value : value.substring(0, 157) + "...";
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
