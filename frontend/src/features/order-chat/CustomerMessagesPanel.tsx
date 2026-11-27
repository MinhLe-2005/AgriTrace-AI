"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Image as ImageIcon, RefreshCw } from "lucide-react";
import {
  orderChatService,
  type ChatChannel,
  type ConversationSummary,
  type OrderMessage,
} from "@/services/order-chat.service";
import { toast } from "@/stores/toast-store";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { compressAvatarImage } from "@/utils/image-compress";
import { OrderDisputeModal } from "./OrderDisputeModal";
import { useOrderChatSocket } from "./useOrderChatSocket";
import type { ApiOrder } from "@/services/catalog.service";

interface FallbackOrder {
  id?: string | number;
  orderCode?: string;
  lotCode?: string;
  receiverName?: string;
  receiverPhone?: string;
  userEmail?: string;
  total?: number;
  status?: string;
  refundStatus?: string;
  refundReason?: string;
  adminSupportRequested?: boolean;
  createdAt?: string;
  items?: Array<{ name?: string; origin?: string }>;
}

interface CustomerMessagesPanelProps {
  customerEmail?: string;
  initialOrderCode?: string;
  fallbackOrders?: FallbackOrder[];
  onViewOrderDetail?: (orderCode: string) => void;
}

function cleanMessagePreview(raw?: string): string {
  if (!raw) return "";
  return raw
    .replace(/^[\s⚠️🎧✅❌🌿🚚❄️💬💳📦]+/gu, "")
    .replace(/\[(YÊU CẦU|Yêu cầu)[^\]]*\]\s*/g, "")
    .trim();
}

export function CustomerMessagesPanel({
  customerEmail,
  initialOrderCode,
  fallbackOrders,
  onViewOrderDetail,
}: CustomerMessagesPanelProps) {
  const authUser = useAuthStore((s) => s.user);
  const realCustomerName = authUser?.name?.trim() || "Khách hàng";
  const effectiveEmail = customerEmail || authUser?.email || undefined;

  const normalizeCode = (code?: string | null) => (code || "").replace(/^#/, "").trim().toUpperCase();

  const buildFallbackList = (): ConversationSummary[] =>
    (fallbackOrders || []).map((o) => {
      const code = normalizeCode(String(o.id ?? o.orderCode ?? ""));
      const farm =
        o.items?.[0]?.origin ||
        (o.lotCode?.includes("MC") ? "Hợp Tác Xã Nông Sản Mộc Châu" : "Nông Trại Xanh Đà Lạt");
      const prod = o.items?.map((it) => it.name).filter(Boolean).join(", ") || "Nông sản VietGAP";
      const safeRefundStatus =
        o.refundStatus === "PENDING" || o.refundStatus === "APPROVED" || o.refundStatus === "REJECTED"
          ? o.refundStatus
          : undefined;
      return {
        orderCode: code,
        customerName: o.receiverName || realCustomerName,
        customerPhone: o.receiverPhone || authUser?.phone || "",
        customerEmail: o.userEmail || effectiveEmail,
        farmName: farm,
        productSummary: prod,
        total: o.total || 0,
        orderStatus: o.status || "CONFIRMED",
        refundStatus: safeRefundStatus,
        refundReason: o.refundReason,
        lastMessage:
          o.refundStatus === "PENDING"
            ? "Đang xử lý yêu cầu hoàn tiền"
            : o.adminSupportRequested
            ? "Đã kết nối Tổng đài CSKH"
            : "Bắt đầu trò chuyện với nhà vườn",
        lastMessageTime: o.createdAt || new Date().toISOString(),
        messageCount: 0,
        hasPendingDispute: o.refundStatus === "PENDING",
        adminSupportRequested: Boolean(o.adminSupportRequested),
        unreadCount: 0,
      };
    });

  const initialList = buildFallbackList();
  const [conversations, setConversations] = useState<ConversationSummary[]>(initialList);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(
    normalizeCode(initialOrderCode) || (initialList.length > 0 ? initialList[0].orderCode : null)
  );
  const [activeChannel, setActiveChannel] = useState<ChatChannel>("SHOP");
  const selectedOrderCodeRef = useRef<string | null>(selectedOrderCode);
  selectedOrderCodeRef.current = selectedOrderCode;
  const activeChannelRef = useRef<ChatChannel>(activeChannel);
  activeChannelRef.current = activeChannel;

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "DISPUTE">("ALL");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  const handleChatScroll = () => {
    if (!chatScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollRef.current;
    isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 80;
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior,
      });
      isNearBottomRef.current = true;
    }
  };

  useEffect(() => {
    const cleanInit = normalizeCode(initialOrderCode);
    if (cleanInit) {
      setSelectedOrderCode(cleanInit);
      setActiveChannel("SHOP");
    }
  }, [initialOrderCode]);

  useEffect(() => {
    loadInbox();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        orderChatService
          .getInbox({
            customerEmail: effectiveEmail,
            viewerRole: "CUSTOMER",
            status: filterType === "DISPUTE" ? "DISPUTE" : undefined,
          })
          .then((list) => {
            const map = new Map<string, ConversationSummary>();
            buildFallbackList().forEach((c) => map.set(c.orderCode, c));
            (list || []).forEach((c) => map.set(normalizeCode(c.orderCode), c));
            if (map.size > 0) {
              setConversations(Array.from(map.values()));
            }
          })
          .catch(() => {});

        const currentActive = selectedOrderCodeRef.current;
        const currentChannel = activeChannelRef.current;
        if (currentActive) {
          orderChatService
            .getMessages(currentActive, { channel: currentChannel, viewerRole: "CUSTOMER" })
            .then((msgs) => {
              if (
                selectedOrderCodeRef.current === currentActive &&
                activeChannelRef.current === currentChannel
              ) {
                setMessages((prev) => {
                  if (
                    prev.length === msgs.length &&
                    (prev.length === 0 || prev[prev.length - 1]?.id === msgs[msgs.length - 1]?.id)
                  ) {
                    return prev;
                  }
                  return msgs;
                });
              }
            })
            .catch(() => {});
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [effectiveEmail, filterType, fallbackOrders]);

  async function loadInbox() {
    setIsLoading(true);
    try {
      const list = await orderChatService.getInbox({
        customerEmail: effectiveEmail,
        viewerRole: "CUSTOMER",
        status: filterType === "DISPUTE" ? "DISPUTE" : undefined,
      });
      const map = new Map<string, ConversationSummary>();
      buildFallbackList().forEach((c) => map.set(c.orderCode, c));
      (list || []).forEach((c) => map.set(normalizeCode(c.orderCode), c));
      const merged = Array.from(map.values());
      setConversations(merged);
      if (merged.length > 0) {
        setSelectedOrderCode((curr) => curr || merged[0].orderCode);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectConversation(code: string) {
    const clean = normalizeCode(code);
    if (clean === selectedOrderCode && activeChannel === "SHOP") return;
    setSelectedOrderCode(clean);
    setActiveChannel("SHOP");
    isNearBottomRef.current = true;
    setMessages([]);
    orderChatService.markAsRead(clean, { channel: "SHOP", viewerRole: "CUSTOMER" });
    loadMessages(clean, "SHOP");
    setConversations((prev) =>
      prev.map((c) => (normalizeCode(c.orderCode) === clean ? { ...c, unreadCount: 0 } : c))
    );
  }

  useEffect(() => {
    if (selectedOrderCode) {
      loadMessages(selectedOrderCode, activeChannel);
    }
  }, [selectedOrderCode, activeChannel]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages]);

  async function loadMessages(code: string, channel: ChatChannel = activeChannel) {
    try {
      const msgs = await orderChatService.getMessages(code, {
        channel,
        viewerRole: "CUSTOMER",
      });
      if (selectedOrderCodeRef.current === normalizeCode(code) && activeChannelRef.current === channel) {
        setMessages(msgs);
        setTimeout(() => scrollToBottom("instant"), 50);
      }
    } catch {
      // ignore
    }
  }

  const activeConv = conversations.find((c) => normalizeCode(c.orderCode) === selectedOrderCode);

  const handleIncomingMessage = (newMsg: OrderMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setConversations((prev) =>
      prev.map((c) =>
        normalizeCode(c.orderCode) === normalizeCode(newMsg.orderCode)
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
    channel: activeChannel,
    currentUserRole: "CUSTOMER",
    currentUserName: realCustomerName,
    onMessageReceived: handleIncomingMessage,
  });

  async function handleEscalateToAdmin() {
    if (!selectedOrderCode || isEscalating) return;
    setIsEscalating(true);
    try {
      await orderChatService.escalateToAdmin(selectedOrderCode, {
        customerName: realCustomerName,
        customerEmail: effectiveEmail,
      });
      setActiveChannel("ADMIN");
      setConversations((prev) =>
        prev.map((c) =>
          normalizeCode(c.orderCode) === selectedOrderCode
            ? { ...c, adminSupportRequested: true }
            : c
        )
      );
      await loadMessages(selectedOrderCode, "ADMIN");
      toast.success("Đã kết nối Tổng đài CSKH cho đơn #" + selectedOrderCode);
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsEscalating(false);
    }
  }

  async function handleFileAttachment(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.");
      return;
    }
    try {
      const compressed = await compressAvatarImage(file, 960, 960, 0.8);
      setImageAttachment(compressed.dataUrl);
      toast.success("Đã đính kèm ảnh.");
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageAttachment((event.target?.result as string) || null);
        toast.success("Đã đính kèm ảnh.");
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSendMessage(customText?: string) {
    const text = (customText || replyText).trim();
    if ((!text && !imageAttachment) || !selectedOrderCode) return;

    sendTyping(false);
    setIsSending(true);
    try {
      const newMsg = await orderChatService.sendMessage(selectedOrderCode, {
        senderRole: "CUSTOMER",
        senderName: realCustomerName,
        senderEmail: effectiveEmail,
        channel: activeChannel,
        message: text || "Hình ảnh đính kèm",
        imageUrl: imageAttachment || undefined,
        messageType: "CHAT",
      });

      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setReplyText("");
      setImageAttachment(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      loadInbox();
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setIsSending(false);
    }
  }

  const filteredConvs = conversations.filter((c) => {
    if (filterType === "UNREAD" && (c.unreadCount || 0) === 0) return false;
    if (filterType === "DISPUTE" && !c.hasPendingDispute) return false;

    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      c.orderCode.toLowerCase().includes(q) ||
      c.farmName.toLowerCase().includes(q) ||
      c.productSummary.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const isAdminChannel = activeChannel === "ADMIN";
  const customerQuickChips = isAdminChannel
    ? [
        "Nhờ Admin kiểm tra tiến độ đơn hàng giúp mình.",
        "Hỗ trợ đối soát giao dịch thanh toán VietQR.",
        "Yêu cầu hỗ trợ giải quyết khiếu nại đơn hàng.",
      ]
    : [
        "Rau thu hoạch lúc mấy giờ sáng nay?",
        "Đơn hàng dự kiến giao khung giờ nào?",
        "Hướng dẫn bảo quản rau tươi lâu nhất?",
        "Cho mình xem thông tin chứng nhận VietGAP.",
      ];

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] w-full min-w-0">
      {/* ── Left Sidebar ── */}
      <div className="w-full md:w-80 lg:w-[320px] xl:w-[340px] border-r border-stone-200 flex flex-col shrink-0 bg-stone-50/40 min-w-0">
        <div className="p-4 border-b border-stone-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-stone-900">Hộp thư đơn hàng</h3>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px]">
                  {totalUnread} mới
                </span>
              )}
            </div>
            <button
              onClick={() => loadInbox()}
              disabled={isLoading}
              title="Làm mới"
              className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-700 hover:bg-stone-100 transition-colors cursor-pointer"
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
              placeholder="Tìm nhà vườn, mã đơn..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-stone-400"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === "ALL"
                  ? "bg-emerald-800 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              onClick={() => setFilterType("UNREAD")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === "UNREAD"
                  ? "bg-emerald-800 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Chưa đọc{totalUnread > 0 ? ` (${totalUnread})` : ""}
            </button>
            <button
              onClick={() => setFilterType("DISPUTE")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === "DISPUTE"
                  ? "bg-amber-700 text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              Khiếu nại
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-stone-100 min-w-0">
          {isLoading && conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400">Đang tải hội thoại...</div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 space-y-1">
              <p className="font-semibold text-stone-600">Chưa có cuộc trò chuyện</p>
              <p className="text-[11px]">Khi bạn đặt đơn hàng, cuộc hội thoại sẽ hiển thị tại đây.</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isSelected = conv.orderCode === selectedOrderCode;
              const hasUnread = (conv.unreadCount || 0) > 0;
              const initialChar = (conv.farmName || "N").charAt(0).toUpperCase();

              return (
                <div
                  key={conv.orderCode}
                  onClick={() => handleSelectConversation(conv.orderCode)}
                  className={`p-3.5 transition-colors cursor-pointer border-l-3 ${
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-700"
                      : hasUnread
                      ? "bg-emerald-50/20 border-emerald-400 hover:bg-stone-100/70"
                      : "border-transparent hover:bg-stone-100/60"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shrink-0">
                      {initialChar}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs text-stone-900 truncate">{conv.farmName}</h4>
                        <span className="text-[10px] text-stone-400 shrink-0">
                          {conv.lastMessageTime
                            ? new Date(conv.lastMessageTime).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-stone-100 text-stone-700">
                          #{conv.orderCode}
                        </span>
                        {conv.hasPendingDispute && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900">
                            Khiếu nại
                          </span>
                        )}
                        {conv.adminSupportRequested && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                            Tổng đài
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className={`text-xs truncate ${hasUnread ? "font-semibold text-stone-900" : "text-stone-500"}`}>
                          {cleanMessagePreview(conv.lastMessage)}
                        </p>
                        {hasUnread && <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {activeConv ? (
          <>
            {/* Clean Minimal Header */}
            <div className="px-5 py-3.5 border-b border-stone-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0 ${
                    isAdminChannel ? "bg-rose-800" : "bg-emerald-800"
                  }`}
                >
                  {isAdminChannel ? "CS" : (activeConv.farmName || "N").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-stone-900 truncate">
                      {isAdminChannel ? "Tổng đài CSKH AgriTrace" : activeConv.farmName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        isAdminChannel ? "bg-rose-50 text-rose-800 border border-rose-200" : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isAdminChannel ? "Riêng tư Khách & Admin" : "Riêng tư Khách & Nhà vườn"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500" : "bg-stone-300"}`} />
                      <span>{socketConnected ? "Đang kết nối" : "Ngoại tuyến"}</span>
                    </span>
                    <span>·</span>
                    <span className="truncate">Đơn #{activeConv.orderCode}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {onViewOrderDetail && (
                  <button
                    onClick={() => onViewOrderDetail(activeConv.orderCode)}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Chi tiết đơn
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleEscalateToAdmin}
                  disabled={isEscalating}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    isAdminChannel
                      ? "bg-rose-700 text-white border-rose-700"
                      : "bg-white text-rose-700 border-rose-200 hover:bg-rose-50"
                  }`}
                >
                  {isEscalating ? "Đang kết nối..." : "Hỗ trợ tổng đài"}
                </button>

                <button
                  onClick={() => setShowDisputeModal(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    activeConv.hasPendingDispute
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-white text-amber-800 border-amber-200 hover:bg-amber-50"
                  }`}
                >
                  {activeConv.hasPendingDispute ? "Đang khiếu nại" : "Khiếu nại / Hoàn tiền"}
                </button>
              </div>
            </div>

            {/* Slim Order Context + 2-Channel Switcher */}
            <div className="px-5 py-2.5 bg-stone-50/70 border-b border-stone-200 flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0">
              <div className="flex items-center gap-2 min-w-0 text-stone-700">
                <span className="font-mono font-bold text-stone-900">#{activeConv.orderCode}</span>
                <span className="text-stone-300">·</span>
                <span className="truncate">{activeConv.productSummary}</span>
                <span className="text-stone-300">·</span>
                <span className="font-bold text-emerald-800 whitespace-nowrap">
                  {activeConv.total?.toLocaleString("vi-VN")} đ
                </span>
              </div>

              <div className="inline-flex p-0.5 rounded-xl bg-stone-200/70 text-[11px] shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveChannel("SHOP")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeChannel === "SHOP"
                      ? "bg-white text-emerald-900 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Chat với Shop
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChannel("ADMIN")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    activeChannel === "ADMIN"
                      ? "bg-white text-rose-800 shadow-2xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Tổng đài CSKH
                </button>
              </div>
            </div>

            {/* Message Feed */}
            <div
              ref={chatScrollRef}
              onScroll={handleChatScroll}
              className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 bg-[#f7f8f7] min-w-0"
            >
              <div className="max-w-lg mx-auto px-4 py-2 rounded-xl bg-white border border-stone-200/80 text-center text-[11px] text-stone-500">
                {isAdminChannel
                  ? `Hội thoại riêng giữa ${realCustomerName} và Quản trị viên Tổng đài về đơn #${activeConv.orderCode}.`
                  : `Hội thoại riêng giữa ${realCustomerName} và ${activeConv.farmName}. Khi cần sàn hỗ trợ, bấm "Hỗ trợ tổng đài".`}
              </div>

              {messages.length === 0 && (
                <div className="text-center py-8 text-xs text-stone-400">
                  {isAdminChannel
                    ? 'Chưa có tin nhắn trên kênh Tổng đài. Bấm "Hỗ trợ tổng đài" hoặc nhập nội dung bên dưới.'
                    : `Chưa có tin nhắn nào. Hãy gửi câu hỏi cho ${activeConv.farmName} ở bên dưới.`}
                </div>
              )}

              {messages.map((m) => {
                const isCustomer = m.senderRole === "CUSTOMER";
                const isNotice =
                  m.messageType?.startsWith("DISPUTE_") || m.messageType === "SUPPORT_ESCALATED";

                if (isNotice) {
                  const isApproved = m.messageType === "DISPUTE_APPROVED";
                  const isRejected = m.messageType === "DISPUTE_REJECTED";
                  const isEscalation = m.messageType === "SUPPORT_ESCALATED";
                  return (
                    <div
                      key={m.id}
                      className={`max-w-lg mx-auto p-3.5 rounded-xl bg-white border border-stone-200 border-l-4 text-xs shadow-2xs space-y-1.5 ${
                        isApproved
                          ? "border-l-emerald-600"
                          : isRejected
                          ? "border-l-red-600"
                          : isEscalation
                          ? "border-l-rose-600"
                          : "border-l-amber-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 font-bold text-stone-900">
                        <span>
                          {isEscalation
                            ? "Kết nối Tổng đài CSKH"
                            : isApproved
                            ? "Đã duyệt hoàn tiền"
                            : isRejected
                            ? "Từ chối khiếu nại"
                            : "Yêu cầu Trả hàng / Hoàn tiền"}
                        </span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-wrap text-stone-700">{m.message}</p>
                      {m.imageUrl && (
                        <div className="pt-1">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="Ảnh đính kèm"
                            className="w-full max-h-48 object-cover rounded-lg border border-stone-200"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isCustomer ? "items-end" : "items-start"}`}
                  >
                    {!isCustomer && (
                      <span className="text-[11px] font-semibold text-stone-500 mb-1 px-1">
                        {m.senderRole === "ADMIN"
                          ? `Quản trị viên · ${m.senderName || "Tổng đài CSKH"}`
                          : m.senderName || activeConv.farmName}
                      </span>
                    )}

                    <div
                      className={`max-w-[76%] sm:max-w-[68%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-2xs ${
                        isCustomer
                          ? isAdminChannel
                            ? "bg-rose-800 text-white rounded-br-sm"
                            : "bg-emerald-800 text-white rounded-br-sm"
                          : "bg-white text-stone-900 border border-stone-200 rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>

                      {m.imageUrl && (
                        <div className="rounded-xl overflow-hidden mt-2 border border-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="Ảnh đính kèm"
                            className="max-h-48 object-cover w-full"
                          />
                        </div>
                      )}

                      <div
                        className={`text-[10px] mt-1 text-right ${
                          isCustomer ? "text-white/75" : "text-stone-400"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Clean Quick Reply Pills */}
            <div className="px-4 py-2 bg-white border-t border-stone-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
              {customerQuickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isSending}
                  className="px-3 py-1 rounded-full bg-stone-100 hover:bg-emerald-50 text-stone-700 hover:text-emerald-900 border border-stone-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {imageAttachment && (
              <div className="px-4 py-2 bg-stone-50 border-t border-stone-200 flex items-center gap-3 shrink-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-stone-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageAttachment} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageAttachment(null)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-bl px-1 text-[10px]"
                  >
                    ×
                  </button>
                </div>
                <span className="text-xs text-stone-600">Đã đính kèm 1 ảnh</span>
              </div>
            )}

            {typingUser && (
              <div className="px-5 py-1.5 text-[11px] text-stone-500 italic bg-stone-50 border-t border-stone-100 shrink-0">
                {typingUser.senderName || (isAdminChannel ? "Quản trị viên CSKH" : "Nhà vườn")} đang nhập tin nhắn...
              </div>
            )}

            {/* Minimal Input Bar */}
            <div className="p-3 sm:px-4 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleFileAttachment}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Đính kèm ảnh"
                className="p-2 rounded-xl text-stone-500 hover:text-emerald-800 hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => {
                  setReplyText(e.target.value);
                  sendTyping(e.target.value.trim().length > 0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendTyping(false);
                    handleSendMessage();
                  }
                }}
                placeholder={
                  isAdminChannel
                    ? `Nhắn tin cho Tổng đài CSKH về đơn #${activeConv.orderCode}...`
                    : `Nhắn tin cho ${activeConv.farmName}...`
                }
                className="flex-1 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-stone-400"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isSending || (!replyText.trim() && !imageAttachment)}
                className={`px-4 py-2.5 rounded-xl disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 ${
                  isAdminChannel ? "bg-rose-800 hover:bg-rose-900" : "bg-emerald-800 hover:bg-emerald-900"
                }`}
              >
                {isSending ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-2">
            <h4 className="font-bold text-sm text-stone-700">Chưa chọn cuộc trò chuyện</h4>
            <p className="text-xs max-w-sm">
              Chọn một đơn hàng ở cột bên trái để trao đổi trực tiếp với nhà vườn hoặc Tổng đài CSKH.
            </p>
          </div>
        )}
      </div>

      {showDisputeModal && activeConv && (
        <OrderDisputeModal
          isOpen={showDisputeModal}
          order={{
            id: activeConv.orderCode,
            orderCode: activeConv.orderCode,
            total: activeConv.total,
            items: [{ name: activeConv.productSummary, price: activeConv.total, quantity: 1 }],
          } as unknown as ApiOrder}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={() => {
            setShowDisputeModal(false);
            loadInbox();
            if (selectedOrderCode) loadMessages(selectedOrderCode);
          }}
        />
      )}
    </div>
  );
}
