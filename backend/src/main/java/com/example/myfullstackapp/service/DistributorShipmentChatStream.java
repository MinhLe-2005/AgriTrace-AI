package com.example.myfullstackapp.service;

import com.example.myfullstackapp.event.DistributorShipmentMessageCreated;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/** WebSocket fan-out occurs only after the persisted message transaction commits. */
@Service
@RequiredArgsConstructor
public class DistributorShipmentChatStream {
    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void messageCreated(DistributorShipmentMessageCreated event) {
        String destination = "/queue/distributor/chat/" + event.message().shipmentCode();
        event.recipientEmails().stream().distinct().forEach(recipient ->
                messagingTemplate.convertAndSendToUser(recipient, destination, event.message()));
        // Echo to the author so another tab logged into the same account stays in sync.
        messagingTemplate.convertAndSendToUser(event.message().senderEmail(), destination, event.message());
    }
}
