package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.CreateDistributorChatMessageRequest;
import com.example.myfullstackapp.entity.DistributorNotificationType;
import com.example.myfullstackapp.entity.Shipment;
import com.example.myfullstackapp.entity.User;
import com.example.myfullstackapp.event.DistributorShipmentMessageCreated;
import com.example.myfullstackapp.repository.DistributorShipmentMessageRepository;
import com.example.myfullstackapp.repository.ShipmentRepository;
import com.example.myfullstackapp.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DistributorShipmentChatServiceTest {
    @Test
    void adminMessageIsPersistedAndNotifiesAssignedDistributor() {
        ShipmentRepository shipments = mock(ShipmentRepository.class);
        DistributorShipmentMessageRepository messages = mock(DistributorShipmentMessageRepository.class);
        UserRepository users = mock(UserRepository.class);
        DistributorNotificationService notifications = mock(DistributorNotificationService.class);
        ApplicationEventPublisher events = mock(ApplicationEventPublisher.class);
        DistributorShipmentChatService service = new DistributorShipmentChatService(shipments, messages, users, notifications, events);
        Shipment shipment = Shipment.builder().shipmentCode("SHIP-10").distributorEmail("driver@example.com").build();
        User admin = User.builder().email("admin@example.com").fullName("Admin").build();
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-10")).thenReturn(Optional.of(shipment));
        when(users.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(admin));
        when(messages.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.send("SHIP-10", new CreateDistributorChatMessageRequest("Giao gấp trước 5h"), "admin@example.com", true);

        assertEquals("ADMIN", response.senderRole());
        verify(notifications).notifyDistributor("driver@example.com", DistributorNotificationType.NEW_MESSAGE,
                "Admin vừa nhắn tin", "Chuyến SHIP-10: Giao gấp trước 5h", "SHIP-10");
        verify(events).publishEvent(any(DistributorShipmentMessageCreated.class));
    }

    @Test
    void rejectsChatAccessForDifferentDistributor() {
        ShipmentRepository shipments = mock(ShipmentRepository.class);
        DistributorShipmentChatService service = new DistributorShipmentChatService(shipments,
                mock(DistributorShipmentMessageRepository.class), mock(UserRepository.class),
                mock(DistributorNotificationService.class), mock(ApplicationEventPublisher.class));
        when(shipments.findByShipmentCodeIgnoreCase("SHIP-10"))
                .thenReturn(Optional.of(Shipment.builder().shipmentCode("SHIP-10").distributorEmail("owner@example.com").build()));

        assertThrows(AccessDeniedException.class, () -> service.history("SHIP-10", "other@example.com", false));
    }
}
