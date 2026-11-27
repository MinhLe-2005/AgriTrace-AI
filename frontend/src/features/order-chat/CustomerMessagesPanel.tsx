"use client";

import { useState, useEffect, useRef } from "react";
import {
  MessageSquare,
  Search,
  AlertTriangle,
  CheckCircle2,
  Send,
  Phone,
  Package,
  Calendar,
  Sparkles,
  Store,
  RefreshCw,
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
  Truck,
  RotateCcw,
} from "lucide-react";
import {
  orderChatService,
  type ConversationSummary,
  type OrderMessage,
} from "@/services/order-chat.service";
import { toast } from "@/stores/toast-store";
import { OrderDisputeModal } from "./OrderDisputeModal";
import type { ApiOrder } from "@/services/catalog.service";

interface CustomerMessagesPanelProps {
  customerEmail?: string;
  initialOrderCode?: string;
  fallbackOrders?: any[];
  onViewOrderDetail?: (orderCode: string) => void;
}

export function CustomerMessagesPanel({
  customerEmail,
  initialOrderCode,
  fallbackOrders,
  onViewOrderDetail,
}: CustomerMessagesPanelProps) {
  // Map fallback orders to initial conversations so UI is immediately populated without waiting for network
  const initialList: ConversationSummary[] = (fallbackOrders || []).map((o) => {
    const code = (o.id || o.orderCode || "").replace(/^#/, "");
    const farm = o.items?.[0]?.origin || "Nông Trại Xanh Thủy Canh Đà Lạt";
    const prod = o.items?.map((it: any) => it.name).join(", ") || "Nông sản VietGAP";
    return {
      orderCode: code,
      customerName: o.receiverName || "Khách Hàng",
      customerPhone: o.receiverPhone || "",
      customerEmail: o.userEmail,
      farmName: farm,
      productSummary: prod,
      total: o.total || 0,
      orderStatus: o.status || "CONFIRMED",
      refundStatus: o.refundStatus,
      refundReason: o.refundReason,
      lastMessage: o.refundStatus === "PENDING" ? "Đang có yêu cầu khiếu nại hoàn tiền" : "Chưa có tin nhắn mới",
      lastMessageTime: o.createdAt || new Date().toISOString(),
      messageCount: 0,
      hasPendingDispute: o.refundStatus === "PENDING",
      unreadCount: 0,
    };
  });

  const [conversations, setConversations] = useState<ConversationSummary[]>(initialList);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(
    initialOrderCode || (initialList.length > 0 ? initialList[0].orderCode : null)
  );
  const selectedOrderCodeRef = useRef<string | null>(selectedOrderCode);
  selectedOrderCodeRef.current = selectedOrderCode;

  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "UNREAD" | "DISPUTE">("ALL");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [imageAttachment, setImageAttachment] = useState<string | null>(null);

  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync initialOrderCode when prop changes
  useEffect(() => {
    if (initialOrderCode) {
      setSelectedOrderCode(initialOrderCode);
    }
  }, [initialOrderCode]);

  // Load inbox
  useEffect(() => {
    loadInbox();

    // Smart polling: mỗi 3.5s lấy tin nhắn mới
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        orderChatService
          .getInbox({
            customerEmail: customerEmail || undefined,
            status: filterType === "DISPUTE" ? "DISPUTE" : undefined,
          })
          .then((list) => {
            if (list && list.length > 0) {
              const map = new Map<string, ConversationSummary>();
              initialList.forEach((c) => map.set(c.orderCode, c));
              list.forEach((c) => map.set(c.orderCode, c));
              setConversations(Array.from(map.values()));
            }
          })
          .catch(() => {});

        const currentActive = selectedOrderCodeRef.current;
        if (currentActive) {
          orderChatService
            .getMessages(currentActive)
            .then((msgs) => {
              if (selectedOrderCodeRef.current === currentActive) {
                setMessages(msgs);
              }
            })
            .catch(() => {});
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [customerEmail, filterType]);

  async function loadInbox() {
    setIsLoading(true);
    try {
      const list = await orderChatService.getInbox({
        customerEmail: customerEmail || undefined,
        status: filterType === "DISPUTE" ? "DISPUTE" : undefined,
      });
      const map = new Map<string, ConversationSummary>();
      initialList.forEach((c) => map.set(c.orderCode, c));
      (list || []).forEach((c) => map.set(c.orderCode, c));
      const merged = Array.from(map.values());
      if (merged.length > 0) {
        setConversations(merged);
        setSelectedOrderCode((curr) => curr || merged[0].orderCode);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectConversation(code: string) {
    if (code === selectedOrderCode) return;
    setSelectedOrderCode(code);
    setMessages([]); // Clear previous thread immediately to avoid stale overlap
    orderChatService.markAsRead(code);
    loadMessages(code);
    setConversations((prev) =>
      prev.map((c) => (c.orderCode === code ? { ...c, unreadCount: 0 } : c))
    );
  }

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedOrderCode) {
      loadMessages(selectedOrderCode);
    }
  }, [selectedOrderCode]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadMessages(code: string) {
    try {
      const msgs = await orderChatService.getMessages(code);
      if (selectedOrderCodeRef.current === code) {
        setMessages(msgs);
      }
    } catch {
      // ignore
    }
  }

  const activeConv = conversations.find((c) => c.orderCode === selectedOrderCode);

  async function handleSendMessage(customText?: string) {
    const text = (customText || replyText).trim();
    if (!text || !selectedOrderCode) return;

    setIsSending(true);
    try {
      const newMsg = await orderChatService.sendMessage(selectedOrderCode, {
        senderRole: "CUSTOMER",
        senderName: activeConv?.customerName || "Khách Hàng",
        senderEmail: customerEmail,
        message: text,
        imageUrl: imageAttachment || undefined,
        messageType: "CHAT",
      });

      setMessages((prev) => [...prev, newMsg]);
      setReplyText("");
      setImageAttachment(null);
      toast.success("Đã gửi tin nhắn tới chủ nhà vườn!");
      loadInbox();
    } catch {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
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

  const customerQuickChips = [
    "🌿 Rau này thu hoạch lúc mấy giờ sáng nay vậy shop?",
    "🚚 Đơn hàng của mình dự kiến khoảng mấy giờ giao tới?",
    "❄️ Cho mình hỏi cách bảo quản rau trong ngăn mát tươi ngon lâu nhất?",
    "✅ Cho mình xem chứng nhận VietGAP của đợt thu hoạch này nhé!",
    "💬 Cảm ơn shop, rau nhận được rất giòn và tươi xanh!",
  ];

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[760px] animate-in fade-in duration-200 w-full min-w-0">
      {/* ── Left Sidebar: Danh sách nhà vườn & Cuộc trò chuyện ── */}
      <div className="w-full md:w-80 lg:w-[340px] xl:w-[380px] border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/50 min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <MessageSquare size={17} className="text-emerald-700" />
              <span>Hộp Thư & Nhà Vườn</span>
              {totalUnread > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] animate-pulse flex items-center gap-1 shadow-2xs">
                  {totalUnread} mới
                </span>
              )}
            </h3>
            <button
              onClick={() => loadInbox()}
              disabled={isLoading}
              title="Làm mới hộp thư"
              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm theo nhà vườn, mã đơn (#AGRI...)"
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-gray-400"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 text-[11px] font-semibold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                filterType === "ALL"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              onClick={() => setFilterType("UNREAD")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === "UNREAD"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>Chưa đọc</span>
              {totalUnread > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
            <button
              onClick={() => setFilterType("DISPUTE")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                filterType === "DISPUTE"
                  ? "bg-amber-700 text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <AlertTriangle size={11} className="text-amber-500" />
              <span>Khiếu nại</span>
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-w-0">
          {isLoading && conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              <RefreshCw size={18} className="animate-spin mx-auto mb-2 text-emerald-600" />
              <span>Đang tải danh sách hộp thư...</span>
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-1">
              <Store size={22} className="mx-auto text-gray-300 mb-1" />
              <p className="font-semibold text-gray-600">Không tìm thấy cuộc trò chuyện nào</p>
              <p className="text-[11px] text-gray-400">Khi bạn đặt đơn hàng, các nhà vườn sẽ tự động kết nối tại đây.</p>
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const isSelected = conv.orderCode === selectedOrderCode;
              const hasUnread = (conv.unreadCount || 0) > 0;

              return (
                <div
                  key={conv.orderCode}
                  onClick={() => handleSelectConversation(conv.orderCode)}
                  className={`p-3.5 transition-colors cursor-pointer relative border-l-4 ${
                    isSelected
                      ? "bg-emerald-50/70 border-emerald-600 shadow-2xs"
                      : hasUnread
                      ? "bg-emerald-50/25 border-emerald-400 hover:bg-gray-100/70"
                      : "border-transparent hover:bg-gray-100/60"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Farm Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs border border-emerald-200 shadow-2xs">
                        <Store size={18} />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" title="Trực tuyến" />
                    </div>

                    {/* Meta */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-bold text-xs text-gray-900 truncate">
                          {conv.farmName}
                        </h4>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {conv.lastMessageTime
                            ? new Date(conv.lastMessageTime).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>

                      {/* Order Tag & Status */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-gray-100 text-gray-700">
                          #{conv.orderCode}
                        </span>
                        {conv.hasPendingDispute && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 flex items-center gap-0.5">
                            <AlertTriangle size={10} />
                            Khiếu nại
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 truncate">
                          {conv.productSummary}
                        </span>
                      </div>

                      {/* Last Message Preview */}
                      <div className="flex items-center justify-between gap-1">
                        <p
                          className={`text-xs truncate ${
                            hasUnread
                              ? "font-bold text-gray-900"
                              : "text-gray-500 font-normal"
                          }`}
                        >
                          {conv.lastMessage}
                        </p>
                        {hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right Panel: Khung Chat Trực Tiếp Với Chủ Nhà Vườn ── */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {activeConv ? (
          <>
            {/* Chat Top Header */}
            <div className="p-3.5 sm:px-6 sm:py-3 border-b border-gray-200 bg-white flex items-center justify-between gap-3 shadow-2xs z-10 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                  <Store size={20} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-gray-900 truncate">
                      {activeConv.farmName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0 flex items-center gap-1">
                      <ShieldCheck size={11} />
                      Chủ Nhà Vườn Official
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Trực tuyến
                    </span>
                    <span>•</span>
                    <span className="truncate">Chuỗi lạnh VietGAP khép kín</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {onViewOrderDetail && (
                  <button
                    onClick={() => onViewOrderDetail(activeConv.orderCode)}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50/50 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    <span className="hidden sm:inline">Xem đơn</span>
                  </button>
                )}

                <button
                  onClick={() => setShowDisputeModal(true)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    activeConv.hasPendingDispute
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                  }`}
                >
                  <AlertTriangle size={13} />
                  <span>
                    {activeConv.hasPendingDispute ? "Đang khiếu nại" : "Khiếu nại / Hoàn tiền"}
                  </span>
                </button>
              </div>
            </div>

            {/* Pinned Order Summary Banner */}
            <div className="px-4 py-2.5 bg-gray-50/90 border-b border-gray-200 flex items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                  <Package size={14} />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-gray-900 font-mono mr-2">
                    #{activeConv.orderCode}
                  </span>
                  <span className="text-gray-600 truncate mr-2">
                    {activeConv.productSummary}
                  </span>
                  <span className="font-extrabold text-emerald-800">
                    {activeConv.total?.toLocaleString("vi-VN")} đ
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5 text-[11px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-bold ${
                    activeConv.orderStatus === "DELIVERED" || activeConv.orderStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : activeConv.orderStatus === "SHIPPING"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {activeConv.orderStatus === "DELIVERED" || activeConv.orderStatus === "COMPLETED"
                    ? "Đã nhận hàng"
                    : activeConv.orderStatus === "SHIPPING"
                    ? "Đang giao xe lạnh"
                    : "Chờ xuất kho"}
                </span>
              </div>
            </div>

            {/* Message Stream */}
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-gray-50/40 min-w-0">
              {/* Default Welcome System Card */}
              <div className="max-w-md mx-auto p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/90 text-center space-y-1.5 text-xs text-emerald-950 shadow-2xs">
                <div className="flex items-center justify-center gap-1.5 font-bold text-emerald-900">
                  <ShieldCheck size={16} className="text-emerald-700" />
                  <span>Kênh kết nối trực tiếp với {activeConv.farmName}</span>
                </div>
                <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                  Mọi sản phẩm được giám sát chuẩn chuỗi lạnh VietGAP khép kín. Bạn có thể nhắn tin hỏi về giờ thu hoạch, bảo quản tươi hoặc yêu cầu đổi trả 100% trong 24H nếu nông sản bị dập úa.
                </p>
              </div>

              {messages.map((m) => {
                const isCustomer = m.senderRole === "CUSTOMER";
                const isDispute = m.messageType?.startsWith("DISPUTE_");

                if (isDispute) {
                  return (
                    <div
                      key={m.id}
                      className="max-w-md mx-auto p-4 rounded-2xl bg-amber-50 border border-amber-300 text-xs shadow-2xs space-y-2 animate-in fade-in"
                    >
                      <div className="flex items-center gap-2 font-bold text-amber-950">
                        <AlertTriangle size={16} className="text-amber-700" />
                        <span>Thông báo khiếu nại đơn #{m.orderCode}</span>
                      </div>
                      <p className="text-amber-900 leading-relaxed">{m.message}</p>
                      {m.imageUrl && (
                        <div className="mt-2 rounded-xl overflow-hidden border border-amber-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="Ảnh khiếu nại"
                            className="w-full max-h-48 object-cover"
                          />
                        </div>
                      )}
                      <div className="text-[10px] text-amber-700 font-semibold text-right">
                        {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2.5 ${
                      isCustomer ? "justify-end" : "justify-start"
                    }`}
                  >
                    {!isCustomer && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-800 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-2xs">
                        <Store size={15} />
                      </div>
                    )}

                    <div
                      className={`max-w-[78%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs space-y-1.5 ${
                        isCustomer
                          ? "bg-emerald-700 text-white rounded-br-xs"
                          : "bg-white text-gray-900 border border-gray-200/90 rounded-bl-xs"
                      }`}
                    >
                      {!isCustomer && (
                        <div className="font-bold text-[11px] text-emerald-800 flex items-center gap-1">
                          <span>{activeConv?.farmName || m.senderName || "Chủ vườn"}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-normal">
                            Chủ vườn
                          </span>
                        </div>
                      )}

                      <p className="leading-relaxed whitespace-pre-wrap">{m.message}</p>

                      {m.imageUrl && (
                        <div className="rounded-xl overflow-hidden mt-1 border border-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.imageUrl}
                            alt="Ảnh đính kèm"
                            className="max-h-48 object-cover w-full"
                          />
                        </div>
                      )}

                      <div
                        className={`text-[10px] flex items-center justify-end gap-1 ${
                          isCustomer ? "text-emerald-200" : "text-gray-400"
                        }`}
                      >
                        <span>
                          {new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isCustomer && <CheckCircle2 size={11} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Suggestion Chips */}
            <div className="px-4 py-2 bg-white border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 no-scrollbar">
              <span className="text-gray-400 shrink-0 flex items-center gap-1 font-semibold">
                <Sparkles size={12} className="text-amber-500" />
                Hỏi nhanh:
              </span>
              {customerQuickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip)}
                  disabled={isSending}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/70 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Image Preview if selected */}
            {imageAttachment && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 flex items-center gap-3 shrink-0">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageAttachment} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageAttachment(null)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
                <span className="text-xs text-gray-600">Đã đính kèm 1 ảnh minh họa đồng kiểm</span>
              </div>
            )}

            {/* Message Input Box */}
            <div className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2 shrink-0">
              {/* Demo Image Picker Menu */}
              <button
                type="button"
                onClick={() => {
                  const demoPhotos = [
                    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=600&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
                  ];
                  setImageAttachment(demoPhotos[Math.floor(Math.random() * demoPhotos.length)]);
                  toast.info("Đã đính kèm ảnh chụp thực tế lúc mở thùng đồng kiểm!");
                }}
                title="Đính kèm ảnh thực tế mở thùng đồng kiểm"
                className="p-2 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
              >
                <ImageIcon size={18} />
              </button>

              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Nhập tin nhắn trao đổi với ${activeConv.farmName}... (Nhấn Enter để gửi)`}
                className="flex-1 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all placeholder:text-gray-400"
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={isSending || (!replyText.trim() && !imageAttachment)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                {isSending ? (
                  <RefreshCw size={15} className="animate-spin" />
                ) : (
                  <>
                    <span>Gửi</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <MessageSquare size={32} />
            </div>
            <div className="max-w-sm space-y-1">
              <h4 className="font-extrabold text-base text-gray-800">
                Chưa chọn cuộc trò chuyện nào
              </h4>
              <p className="text-xs text-gray-500">
                Chọn một nhà vườn ở danh sách bên trái để nhắn tin, đặt câu hỏi hoặc gửi yêu cầu bảo hành chất lượng nông sản.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal Khiếu Nại Trả Hàng Hoàn Tiền nếu cần */}
      {showDisputeModal && activeConv && (
        <OrderDisputeModal
          isOpen={showDisputeModal}
          order={{
            id: activeConv.orderCode as any,
            orderCode: activeConv.orderCode,
            total: activeConv.total,
            items: [{ name: activeConv.productSummary, price: activeConv.total, quantity: 1 } as any],
          } as ApiOrder}
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
