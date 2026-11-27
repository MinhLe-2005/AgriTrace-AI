"use client";

import { Client, type IMessage } from "@stomp/stompjs";
import { Circle, MessageCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { ShipmentChatMessage } from "@/features/distributor/types";
import { distributorService } from "@/services/distributor.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

function websocketUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
  const serverUrl = apiUrl.replace(/\/api\/v1\/?$/, "");
  return `${serverUrl.replace(/^http/, "ws")}/ws/distributor`;
}

function messageTimestamp(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Vừa xong"
    : date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}

function parseMessage(body: string): ShipmentChatMessage | null {
  try {
    const parsed = JSON.parse(body) as ShipmentChatMessage | { data?: ShipmentChatMessage };
    return "data" in parsed && parsed.data ? parsed.data : (parsed as ShipmentChatMessage);
  } catch {
    return null;
  }
}

/** A small shipment-scoped chat surface. The REST history is the durable source; STOMP provides immediate delivery. */
export function ShipmentChat({ shipmentCode }: { shipmentCode: string }) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const currentEmail = useAuthStore((state) => state.user?.email?.toLowerCase());
  const client = useRef<Client | null>(null);
  const messageEnd = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ShipmentChatMessage[]>([]);
  const [content, setContent] = useState("");
  const [connected, setConnected] = useState(false);
  const [sending, setSending] = useState(false);

  const append = (message: ShipmentChatMessage) => {
    setMessages((previous) => previous.some((item) => item.id === message.id) ? previous : [...previous, message]);
  };

  useEffect(() => {
    let active = true;
    void distributorService.getShipmentMessages(shipmentCode)
      .then((items) => { if (active) setMessages(items); })
      .catch(() => { if (active) toast.error("Không thể tải trao đổi của chuyến hàng."); });

    if (!accessToken) return () => { active = false; };
    const stomp = new Client({
      brokerURL: websocketUrl(),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 4_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: () => undefined,
      onConnect: () => {
        if (!active) return;
        setConnected(true);
        stomp.subscribe(`/user/queue/distributor/chat/${encodeURIComponent(shipmentCode)}`, (frame: IMessage) => {
          const message = parseMessage(frame.body);
          if (message?.shipmentCode === shipmentCode) append(message);
        });
      },
      onWebSocketClose: () => { if (active) setConnected(false); },
      onStompError: () => { if (active) setConnected(false); },
    });
    client.current = stomp;
    stomp.activate();

    return () => {
      active = false;
      client.current = null;
      setConnected(false);
      void stomp.deactivate();
    };
  }, [accessToken, shipmentCode]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  async function send() {
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const stomp = client.current;
      if (connected && stomp?.connected) {
        stomp.publish({
          destination: `/app/distributor/shipments/${encodeURIComponent(shipmentCode)}/chat`,
          body: JSON.stringify({ content: text }),
        });
      } else {
        // REST preserves delivery when a corporate proxy blocks WebSocket.
        append(await distributorService.sendShipmentMessage(shipmentCode, text));
      }
      setContent("");
    } catch {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 p-4">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <MessageCircle size={17} className="text-sky-700" /> Trao đổi chuyến hàng
          </h2>
          <p className="mt-1 text-xs text-gray-500">Kênh riêng giữa Admin và đơn vị vận chuyển.</p>
        </div>
        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold", connected ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500")}>
          <Circle size={7} fill="currentColor" /> {connected ? "TRỰC TUYẾN" : "ĐANG KẾT NỐI"}
        </span>
      </div>

      <div className="max-h-80 min-h-44 space-y-3 overflow-y-auto bg-stone-50/60 p-4">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-xs text-stone-500">Chưa có trao đổi. Hãy gửi tin nhắn đầu tiên.</p>
        ) : messages.map((message) => {
          const isMine = Boolean(currentEmail && message.senderEmail.toLowerCase() === currentEmail);
          return (
            <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-2xs", isMine ? "rounded-br-sm bg-[#166534] text-white" : "rounded-bl-sm border border-gray-200 bg-white text-gray-800")}>
                <div className={cn("mb-1 flex items-center gap-1.5 text-[10px] font-bold", isMine ? "text-emerald-100" : "text-sky-700")}>
                  <span>{isMine ? "Bạn" : message.senderName || (message.senderRole === "ADMIN" ? "Quản trị viên" : "Nhà phân phối")}</span>
                  <span className={isMine ? "text-emerald-200/75" : "text-gray-400"}>{messageTimestamp(message.sentAt)}</span>
                </div>
                <p className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messageEnd} />
      </div>

      <div className="flex gap-2 border-t border-gray-100 p-3">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          maxLength={2000}
          placeholder="Nhập tin nhắn cho Admin / Distributor…"
          className="h-10 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-xs outline-none transition placeholder:text-gray-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
        />
        <button
          type="button"
          disabled={!content.trim() || sending}
          onClick={() => void send()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sky-700 px-3 text-xs font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={14} /> Gửi
        </button>
      </div>
    </section>
  );
}
