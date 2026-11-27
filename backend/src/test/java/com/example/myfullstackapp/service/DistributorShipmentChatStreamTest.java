package com.example.myfullstackapp.service;

import com.example.myfullstackapp.dto.distributor.DistributorChatMessageResponse;
import com.example.myfullstackapp.event.DistributorShipmentMessageCreated;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

class DistributorShipmentChatStreamTest {
    @Test
    void deliversPrivatelyToCounterpartAndSender() {
        SimpMessagingTemplate template = mock(SimpMessagingTemplate.class);
        DistributorShipmentChatStream stream = new DistributorShipmentChatStream(template);
        var message = new DistributorChatMessageResponse(UUID.randomUUID(), "SHIP-10", "admin@example.com", "Admin", "ADMIN", "Nhanh", false, Instant.now());

        stream.messageCreated(new DistributorShipmentMessageCreated(message, List.of("driver@example.com")));

        verify(template).convertAndSendToUser(eq("driver@example.com"), eq("/queue/distributor/chat/SHIP-10"), any());
        verify(template).convertAndSendToUser(eq("admin@example.com"), eq("/queue/distributor/chat/SHIP-10"), any());
        verify(template, times(2)).convertAndSendToUser(any(), any(), any());
    }
}
