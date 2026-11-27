"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client, type IMessage } from "@stomp/stompjs";
import { useAuthStore } from "@/stores/auth-store";
import type { ChatChannel, OrderMessage } from "@/services/order-chat.service";

function getOrderWsUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  const serverUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${serverUrl.replace(/^http/, "ws")}/ws/chat`;
}

export interface TypingPayload {
  orderCode: string;
  senderRole: string;
  senderName: string;
  channel?: ChatChannel;
  isTyping: boolean;
}

export interface AdminInboxEvent {
  orderCode: string;
  type: string;
  customerName?: string;
  timestamp?: string;
}

interface UseOrderChatSocketOptions {
  orderCode?: string | null;
  channel?: ChatChannel | "ALL";
  subscribeAdminInbox?: boolean;
  currentUserRole?: "CUSTOMER" | "FARMER" | "ADMIN";
  currentUserName?: string;
  onMessageReceived?: (message: OrderMessage) => void;
  onAdminInboxEvent?: (event: AdminInboxEvent) => void;
}

export function useOrderChatSocket({
  orderCode,
  channel = "SHOP",
  subscribeAdminInbox = false,
  currentUserRole = "CUSTOMER",
  currentUserName = "Bạn",
  onMessageReceived,
  onAdminInboxEvent,
}: UseOrderChatSocketOptions) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<{ senderRole: string; senderName: string } | null>(null);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onMessageRef = useRef(onMessageReceived);
  onMessageRef.current = onMessageReceived;
  const onAdminInboxRef = useRef(onAdminInboxEvent);
  onAdminInboxRef.current = onAdminInboxEvent;

  const cleanCode = (orderCode || "").replace(/^#/, "").trim().toUpperCase();

  useEffect(() => {
    setTypingUser(null);
    if (!cleanCode && !subscribeAdminInbox) {
      setConnected(false);
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

        if (cleanCode) {
          client.subscribe(`/topic/orders/${cleanCode}/messages`, (frame: IMessage) => {
            try {
              const raw = JSON.parse(frame.body);
              const msg: OrderMessage = raw.data || raw;
              if (msg && msg.orderCode?.toUpperCase() === cleanCode) {
                const msgChannel = (msg.channel || "SHOP").toUpperCase();
                if (channel === "ALL" || msgChannel === channel) {
                  onMessageRef.current?.(msg);
                }
              }
            } catch (e) {
              console.warn("Failed to parse incoming WebSocket order message:", e);
            }
          });

          client.subscribe(`/topic/orders/${cleanCode}/typing`, (frame: IMessage) => {
            try {
              const payload: TypingPayload = JSON.parse(frame.body);
              if (payload && payload.orderCode?.toUpperCase() === cleanCode) {
                if (payload.senderRole?.toUpperCase() === currentUserRole.toUpperCase()) {
                  return;
                }
                const payloadChannel = (payload.channel || "SHOP").toUpperCase();
                if (channel !== "ALL" && payloadChannel !== channel) {
                  return;
                }

                if (payload.isTyping) {
                  const fallbackName =
                    payload.senderRole === "ADMIN"
                      ? "Quản trị viên CSKH"
                      : payload.senderRole === "FARMER"
                        ? "Chủ vườn"
                        : "Khách hàng";
                  setTypingUser({
                    senderRole: payload.senderRole,
                    senderName: payload.senderName || fallbackName,
                  });

                  if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                  }
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
        }

        if (subscribeAdminInbox) {
          client.subscribe("/topic/admin/inbox", (frame: IMessage) => {
            try {
              const raw = JSON.parse(frame.body);
              onAdminInboxRef.current?.(raw);
            } catch (e) {
              console.warn("Failed to parse admin inbox event:", e);
            }
          });
        }
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
      } catch {
        // ignore
      }
      clientRef.current = null;
    };
  }, [cleanCode, channel, subscribeAdminInbox, accessToken, currentUserRole]);

  const lastSentTypingRef = useRef<boolean>(false);
  const typingDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!clientRef.current || !clientRef.current.connected || !cleanCode) return;

      if (lastSentTypingRef.current === isTyping && isTyping) {
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
            channel: channel === "ALL" ? "SHOP" : channel,
            isTyping,
          }),
        });
      } catch {
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
    [cleanCode, channel, currentUserRole, currentUserName]
  );

  return {
    connected,
    typingUser,
    sendTyping,
  };
}
