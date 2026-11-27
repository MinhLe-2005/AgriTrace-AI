"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { useAuthStore } from "@/stores/auth-store";
import type { OrderMessage } from "@/services/order-chat.service";

function getOrderWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  const serverUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${serverUrl.replace(/^http/, "ws")}/ws/chat`;
}

export interface TypingPayload {
  orderCode: string;
  senderRole: string;
  senderName: string;
  isTyping: boolean;
}

interface UseOrderChatSocketOptions {
  orderCode?: string | null;
  currentUserRole?: "CUSTOMER" | "FARMER" | "ADMIN";
  currentUserName?: string;
  onMessageReceived?: (message: OrderMessage) => void;
}

export function useOrderChatSocket({
  orderCode,
  currentUserRole = "CUSTOMER",
  currentUserName = "Bạn",
  onMessageReceived,
}: UseOrderChatSocketOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<{ senderRole: string; senderName: string } | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessageReceived);
  onMessageRef.current = onMessageReceived;

  const cleanCode = (orderCode || "").replace(/^#/, "").trim().toUpperCase();

  // STOMP Client Lifecycle
  useEffect(() => {
    if (!cleanCode) {
      setConnected(false);
      setTypingUser(null);
      return;
    }

    let active = true;
    const connectHeaders: Record<string, string> = {};
    if (accessToken) {
      connectHeaders.Authorization = `Bearer ${accessToken}`;
    }

    const client = new Client({
      brokerURL: getOrderWsUrl(),
      connectHeaders,
      reconnectDelay: 3_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
      onConnect: () => {
        if (!active) return;
        setConnected(true);

        // 1. Subscribe to order real-time messages
        client.subscribe(`/topic/orders/${cleanCode}/messages`, (frame: IMessage) => {
          try {
            const raw = JSON.parse(frame.body);
            const msg: OrderMessage = raw.data || raw;
            if (msg && msg.orderCode?.toUpperCase() === cleanCode) {
              onMessageRef.current?.(msg);
            }
          } catch (e) {
            console.warn("Failed to parse incoming WebSocket order message:", e);
          }
        });

        // 2. Subscribe to typing indicator
        client.subscribe(`/topic/orders/${cleanCode}/typing`, (frame: IMessage) => {
          try {
            const payload: TypingPayload = JSON.parse(frame.body);
            if (payload && payload.orderCode?.toUpperCase() === cleanCode) {
              // Ignore own typing echo
              if (payload.senderRole?.toUpperCase() === currentUserRole.toUpperCase()) {
                return;
              }

              if (payload.isTyping) {
                setTypingUser({
                  senderRole: payload.senderRole,
                  senderName: payload.senderName || (payload.senderRole === "FARMER" ? "Chủ vườn" : "Khách hàng"),
                });

                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
                // Auto-clear typing indicator after 3 seconds of silence
                typingTimeoutRef.current = setTimeout(() => {
                  setTypingUser(null);
                }, 3000);
              } else {
                setTypingUser(null);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }
              }
            }
          } catch (e) {
            console.warn("Failed to parse typing payload:", e);
          }
        });
      },
      onWebSocketClose: () => {
        if (active) setConnected(false);
      },
      onStompError: () => {
        if (active) setConnected(false);
      },
    });

    clientRef.current = client;
    client.activate();

    return () => {
      active = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      setConnected(false);
      setTypingUser(null);
      try {
        client.deactivate();
      } catch (e) {
        // ignore
      }
      clientRef.current = null;
    };
  }, [cleanCode, accessToken, currentUserRole]);

  // Send typing event
  const lastSentTypingRef = useRef<boolean>(false);
  const typingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!clientRef.current || !clientRef.current.connected || !cleanCode) return;

      // Avoid spamming the same status repeatedly
      if (lastSentTypingRef.current === isTyping && isTyping) {
        // Reset stop-typing debounce
        if (typingDebounceTimerRef.current) clearTimeout(typingDebounceTimerRef.current);
        typingDebounceTimerRef.current = setTimeout(() => {
          sendTyping(false);
        }, 2500);
        return;
      }

      lastSentTypingRef.current = isTyping;

      try {
        clientRef.current.publish({
          destination: `/app/orders/${cleanCode}/typing`,
          body: JSON.stringify({
            orderCode: cleanCode,
            senderRole: currentUserRole,
            senderName: currentUserName,
            isTyping,
          }),
        });
      } catch (err) {
        // non-fatal
      }

      if (isTyping) {
        if (typingDebounceTimerRef.current) clearTimeout(typingDebounceTimerRef.current);
        typingDebounceTimerRef.current = setTimeout(() => {
          sendTyping(false);
        }, 2500);
      } else {
        if (typingDebounceTimerRef.current) {
          clearTimeout(typingDebounceTimerRef.current);
          typingDebounceTimerRef.current = null;
        }
      }
    },
    [cleanCode, currentUserRole, currentUserName]
  );

  return {
    connected,
    typingUser,
    sendTyping,
  };
}
