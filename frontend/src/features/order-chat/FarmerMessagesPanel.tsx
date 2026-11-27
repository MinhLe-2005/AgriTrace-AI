"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  Phone,
  User,
  Package,
  Calendar,
  Sparkles,
  Store,
  RefreshCw,
  Image as ImageIcon,
  Clock,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import {
  orderChatService,
  type ConversationSummary,
  type OrderMessage,
} from "@/services/order-chat.service";
import { toast } from "@/stores/toast-store";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { useOrderChatSocket } from "./useOrderChatSocket";

interface FarmerMessagesPanelProps {
  farmerFarmName?: string;
  farmNames?: string[];
  ownerId?: string;
  farmerName?: string;
}

export function FarmerMessagesPanel({
  farmerFarmName,
  farmNames,
  ownerId,
  farmerName,
}: FarmerMessagesPanelProps) {
  const authUser = useAuthStore((s) => s.user);
  const farmNamesKey = (farmNames || []).join(",");
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [filterDispute, setFilterDispute] = useState<"ALL" | "DISPUTE">("ALL");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior,
      });
      isNearBottomRef.current = true;
    }
  };

  useEffect(() => {
    loadInbox();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        orderChatService
          .getInbox({
            viewerRole: "FARMER",
            channel: "SHOP",
            ownerId: ownerId || undefined,
            farmName: farmerFarmName || undefined,
            farmNames: farmNamesKey || undefined,
            status: filterDispute === "DISPUTE" ? "DISPUTE" : undefined,
          })
          .then((list) => {
            setConversations(list);
          })
          .catch(() => {});

        if (selectedOrderCode) {
          orderChatService
            .getMessages(selectedOrderCode, { channel: "SHOP", viewerRole: "FARMER" })
            .then((msgs) => {
              setMessages((prev) => {
                if (
                  prev.length === msgs.length &&
                  (prev.length === 0 || prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id)
                ) {
                  return prev;
                }
                return msgs;
              });
            })
            .catch(() => {});
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [farmerFarmName, farmNamesKey, ownerId, filterDispute, selectedOrderCode]);

  async function loadInbox() {
    setIsLoading(true);
    try {
      const list = await orderChatService.getInbox({
        viewerRole: "FARMER",
        channel: "SHOP",
        ownerId: ownerId || undefined,
        farmName: farmerFarmName || undefined,
        farmNames: farmNamesKey || undefined,
        status: filterDispute === "DISPUTE" ? "DISPUTE" : undefined,
      });
      setConversations(list);
      if (list.length > 0) {
        if (!selectedOrderCode || !list.some((c) => c.orderCode === selectedOrderCode)) {
          setSelectedOrderCode(list[0].orderCode);
        }
      } else {
        setSelectedOrderCode(null);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectConversation(code: string) {
    setSelectedOrderCode(code);
    isNearBottomRef.current = true;
    setConversations((prev) =>
      prev.map((c) => (c.orderCode === code ? { ...c, unreadCount: 0 } : c))
    );
    orderChatService.markAsRead(code, { channel: "SHOP", viewerRole: "FARMER" });
    loadMessages(code);
  }

  useEffect(() => {
    if (selectedOrderCode) {
      loadMessages(selectedOrderCode);
    } else {
      setMessages([]);
    }
  }, [selectedOrderCode]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages]);

  async function loadMessages(code: string) {
    try {
      const msgs = await orderChatService.getMessages(code, {
        channel: "SHOP",
        viewerRole: "FARMER",
      });
      setMessages(msgs);
      setTimeout(() => scrollToBottom("instant"), 50);
    } catch {
      // ignore
    }
  }

  const activeConv = conversations.find((c) => c.orderCode === selectedOrderCode);
  const resolvedFarmerName =
    farmerName?.trim() || authUser?.name?.trim() || activeConv?.farmName || "Chủ Nông Trại";

  const handleIncomingMessage = (newMsg: OrderMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setConversations((prev) =>
      prev.map((c) =>
        c.orderCode.toUpperCase() === newMsg.orderCode.toUpperCase()
          ? {
              ...c,
              lastMessage: newMsg.message,
              lastMessageTime: newMsg.createdAt,
              messageCount: c.messageCount + 1,
            }
          : c
      )
    );
  };

  const {
    connected: socketConnected,
    typingUser,
    sendTyping,
  } = useOrderChatSocket({
    orderCode: selectedOrderCode,
    channel: "SHOP",
    currentUserRole: "FARMER",
    currentUserName: resolvedFarmerName,
    onMessageReceived: handleIncomingMessage,
  });

  async function handleSendReply(customText?: string) {
    const text = (customText || replyText).trim();
    if (!text || !selectedOrderCode) return;

    sendTyping(false);
    setIsSending(true);
    try {
      const newMsg = await orderChatService.sendMessage(selectedOrderCode, {
        senderRole: "FARMER",
        senderName: resolvedFarmerName,
        senderEmail: authUser?.email,
        channel: "SHOP",
        message: text,
        messageType: "CHAT",
      });

      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setReplyText("");
      toast.success("Đã gửi tin nhắn phản hồi tới khách hàng!");
      loadInbox();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi tin nhắn. Vui lòng thử lại!"));
    } finally {
      setIsSending(false);
    }
  }

  const filteredConvs = conversations.filter((c) => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      c.orderCode.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone?.includes(q) ||
      c.productSummary.toLowerCase().includes(q)
    );
  });

  const farmerQuickChips = [
    "Dạ chào bạn, rau được thu hoạch sáng sớm nay lúc 5h tại vườn, bảo quản chuỗi lạnh 4°C ạ.",
    "Dạ rất xin lỗi bạn vì rau bị dập do vận chuyển! Bên mình sẽ gửi giao bù combo mới sớm mai cho bạn ạ.",
    "Dạ rau này để trong ngăn mát tủ lạnh 3-5°C bọc túi thở có thể giữ tươi ngon 5-7 ngày nhé!",
    "Dạ đơn hàng của bạn đang được xe lạnh chuyên dụng vận chuyển, dự kiến giao trong ngày ạ.",
  ];

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] w-full min-w-0">
      {/* ── Left Sidebar ── */}
      <div className="w-full md:w-80 lg:w-[320px] xl:w-[340px] border-r border-stone-200 flex flex-col shrink-0 bg-stone-50/40 min-w-0">
        <div className="p-4 border-b border-stone-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-stone-900">Hộp thư khách hàng</h3>
              {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                  {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)} mới
                </span>
              )}
            </div>
            <button
              onClick={loadInbox}
              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm mã đơn, tên khách, SĐT..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-stone-50 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <button
              onClick={() => setFilterDispute("ALL")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterDispute === "ALL"
                  ? "bg-emerald-800 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              onClick={() => setFilterDispute("DISPUTE")}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterDispute === "DISPUTE"
                  ? "bg-amber-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Khiếu nại ({conversations.filter((c) => c.hasPendingDispute).length})
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 min-w-0">
          {filteredConvs.map((conv) => {
            const isSelected = conv.orderCode === selectedOrderCode;
            const hasUnread = Boolean(conv.unreadCount && conv.unreadCount > 0);
            return (
              <div
                key={conv.orderCode}
                onClick={() => handleSelectConversation(conv.orderCode)}
                className={`p-3.5 transition-colors cursor-pointer text-xs border-l-3 ${
                  isSelected ? "bg-emerald-50/70 border-emerald-700" : "border-transparent hover:bg-stone-100/70"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-bold text-stone-900">#{conv.orderCode}</span>
                    {hasUnread && (
                      <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-bold text-[9px] shrink-0">
                        {conv.unreadCount} mới
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 shrink-0">
                    {conv.lastMessageTime
                      ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : ""}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-1 font-semibold text-stone-800 mb-0.5">
                  <span className="truncate">{conv.customerName}</span>
                  {conv.customerPhone && (
                    <span className="text-[10px] text-stone-400 font-mono font-normal shrink-0">
                      {conv.customerPhone}
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-stone-500 line-clamp-1 mb-1">{conv.productSummary}</p>

                {conv.hasPendingDispute ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]">
                    Khiếu nại: {conv.refundReason || "Yêu cầu hoàn tiền"}
                  </span>
                ) : (
                  <p className="text-[11px] text-stone-400 truncate">{conv.lastMessage}</p>
                )}
              </div>
            );
          })}

          {filteredConvs.length === 0 && (
            <div className="p-8 text-center text-stone-400 text-xs">
              Chưa có hội thoại nào thuộc trang trại của bạn.
            </div>
          )}
        </div>
      </div>

      {/* ── Right Content ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-sm shrink-0">
                {(activeConv.customerName || "K").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm text-stone-900 truncate">{activeConv.customerName}</h4>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                    #{activeConv.orderCode}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                    Kênh riêng Khách & Nhà vườn
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                  {activeConv.customerPhone && <span>{activeConv.customerPhone}</span>}
                  <span>·</span>
                  <span>{activeConv.total?.toLocaleString("vi-VN")} đ</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500" : "bg-stone-300"}`} />
                    {socketConnected ? "Đang kết nối" : "Ngoại tuyến"}
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 font-semibold">
              {activeConv.orderStatus}
            </span>
          </div>

          {activeConv.hasPendingDispute && (
            <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-200 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="space-y-0.5">
                <p className="font-bold text-amber-900">Khách hàng yêu cầu hoàn tiền / đổi hàng</p>
                <p className="text-[11px] text-amber-800">Lý do: {activeConv.refundReason}</p>
              </div>

              <button
                onClick={() =>
                  handleSendReply(
                    "Chào bạn, nhà vườn đã tiếp nhận phản hồi về đơn hàng và sẽ đóng gói giao bù sản phẩm tươi mới trong chuyến sáng mai ạ."
                  )
                }
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs cursor-pointer"
              >
                Nhận lỗi & Đổi bù ngay
              </button>
            </div>
          )}

          <div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 bg-[#f7f8f7]">
            {messages.map((m) => {
              const isFarmer = m.senderRole === "FARMER";
              const isDispute =
                m.messageType === "DISPUTE_SUBMITTED" ||
                m.messageType === "DISPUTE_APPROVED" ||
                m.messageType === "DISPUTE_REJECTED";

              if (isDispute) {
                const isApproved = m.messageType === "DISPUTE_APPROVED";
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl bg-white border border-stone-200 border-l-4 text-xs shadow-2xs space-y-1.5 max-w-lg mx-auto ${
                      isApproved ? "border-l-emerald-600" : "border-l-amber-500"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-stone-900">
                      <span>{m.senderName}</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">{m.message}</p>
                    {m.imageUrl && (
                      <div className="pt-1">
                        <img src={m.imageUrl} alt="Evidence" className="w-32 h-32 object-cover rounded-lg border border-stone-200" />
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isFarmer ? "items-end" : "items-start"}`}
                >
                  <span className="text-[11px] font-semibold text-stone-500 mb-1 px-1">
                    {isFarmer
                      ? m.senderName || resolvedFarmerName
                      : `Khách hàng · ${m.senderName || activeConv.customerName}`}
                  </span>

                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                      isFarmer
                        ? "bg-emerald-800 text-white rounded-br-sm"
                        : "bg-white text-stone-900 border border-stone-200 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Att" className="w-48 h-32 object-cover rounded-xl mt-2 border border-black/10" />
                    )}
                    <div className={`text-[10px] mt-1 text-right ${isFarmer ? "text-white/75" : "text-stone-400"}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-4 py-2 bg-white border-t border-stone-100 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
            {farmerQuickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendReply(chip)}
                className="px-3 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 text-[11px] border border-stone-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {chip.substring(0, 36)}...
              </button>
            ))}
          </div>

          {typingUser && (
            <div className="px-5 py-1.5 text-[11px] text-stone-500 italic bg-stone-50 border-t border-stone-100 shrink-0">
              {typingUser.senderName || activeConv.customerName} đang nhập tin nhắn...
            </div>
          )}

          <div className="p-3 sm:px-4 bg-white border-t border-stone-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendTyping(false);
                handleSendReply();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  sendTyping(e.target.value.trim().length > 0);
                }}
                placeholder={`Trả lời ${activeConv.customerName}...`}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-stone-50 focus:bg-white"
              />
              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Trả lời
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-400 text-xs">
          Chọn một cuộc hội thoại ở danh sách bên trái để xem tin nhắn.
        </div>
      )}
    </div>
  );
}
