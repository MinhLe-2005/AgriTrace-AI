package com.example.myfullstackapp.event;

import com.example.myfullstackapp.dto.distributor.DistributorChatMessageResponse;

import java.util.List;

/** Sent after a message is persisted; WebSocket delivery occurs after commit. */
public record DistributorShipmentMessageCreated(
        DistributorChatMessageResponse message,
        List<String> recipientEmails
) { }
