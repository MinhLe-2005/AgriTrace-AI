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
  DollarSign,
  Gift,
  Check,
  X,
  ShieldCheck,
} from "lucide-react";
import {
  orderChatService,
  type ConversationSummary,
  type OrderMessage,
} from "@/services/order-chat.service";
import { toast } from "@/stores/toast-store";
import { useOrderChatSocket } from "./useOrderChatSocket";

export function AdminMessagesPanel({
  initialOrderCode,
  onDisputeResolved,
}: {
  initialOrderCode?: string | null;
  onDisputeResolved?: () => void;
} = {}) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(initialOrderCode || null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [filterDispute, setFilterDispute] = useState<"ALL" | "PENDING_DISPUTE" | "RESOLVED">("ALL");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
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
    if (initialOrderCode) {
      setSelectedOrderCode(initialOrderCode);
      orderChatService.markAsRead(initialOrderCode, "ADMIN");
    }
  }, [initialOrderCode]);

  // Load inbox
  useEffect(() => {
    loadInbox();

    // Smart polling
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        orderChatService
          .getInbox({
            status: filterDispute === "PENDING_DISPUTE" ? "DISPUTE" : undefined,
          })
          .then((list) => {
            setConversations(list);
          })
          .catch(() => {});

        if (selectedOrderCode) {
          orderChatService
            .getMessages(selectedOrderCode)
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
  }, [filterDispute, selectedOrderCode]);

  async function loadInbox() {
    setIsLoading(true);
    try {
      const list = await orderChatService.getInbox({
        status: filterDispute === "PENDING_DISPUTE" ? "DISPUTE" : undefined,
      });
      setConversations(list);
      if (list.length > 0 && !selectedOrderCode) {
        const targetCode =
          (initialOrderCode && list.find((c) => c.orderCode.toUpperCase() === initialOrderCode.toUpperCase())?.orderCode) ||
          list[0].orderCode;
        setSelectedOrderCode(targetCode);
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
    orderChatService.markAsRead(code, "ADMIN");
    loadMessages(code);
  }

  // Load messages
  useEffect(() => {
    if (selectedOrderCode) {
      loadMessages(selectedOrderCode);
    }
  }, [selectedOrderCode]);

  useEffect(() => {
    // Only scroll to bottom if user is already near bottom (prevent drag down when scrolling up)
    if (isNearBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages]);

  async function loadMessages(code: string) {
    try {
      const msgs = await orderChatService.getMessages(code);
      setMessages(msgs);
      setTimeout(() => scrollToBottom("instant"), 50);
    } catch {
      // ignore
    }
  }

  const activeConv = conversations.find((c) => c.orderCode === selectedOrderCode);

  const handleIncomingMessage = (newMsg: OrderMessage) => {
    setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
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
    currentUserRole: "ADMIN",
    currentUserName: "CSKH AgriTrace",
    onMessageReceived: handleIncomingMessage,
  });

  async function handleSendReply(customText?: string) {
    const text = (customText || replyText).trim();
    if (!text || !selectedOrderCode) return;

    sendTyping(false);
    isNearBottomRef.current = true;
    setIsSending(true);
    try {
      const newMsg = await orderChatService.sendMessage(selectedOrderCode, {
        senderRole: "ADMIN",
        senderName: "CSKH AgriTrace",
        message: text,
        messageType: "CHAT",
      });

      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setReplyText("");
      toast.success("Đã gửi tin nhắn CSKH tới khách hàng!");
      loadInbox();
      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setIsSending(false);
    }
  }

  async function handleApproveRefund() {
    if (!selectedOrderCode) return;
    setIsResolving(true);
    try {
      await orderChatService.resolveDispute(selectedOrderCode, {
        action: "APPROVE",
        note: "Quản trị viên đã xem xét hình ảnh và duyệt hoàn tiền 100% cho khách hàng.",
        refundAmount: activeConv?.total,
      });

      toast.success("Đã duyệt hoàn tiền thành công! Đơn hàng chuyển sang REFUNDED.");
      onDisputeResolved?.();
      await loadInbox();
      await loadMessages(selectedOrderCode);
    } catch {
      toast.error("Không thể duyệt hoàn tiền. Vui lòng thử lại!");
    } finally {
      setIsResolving(false);
    }
  }

  async function handleRejectRefund() {
    if (!selectedOrderCode) return;
    const note = rejectReason.trim() || "Hình ảnh không đủ cơ sở hoặc đã quá thời gian khiếu nại quy định.";
    setIsResolving(true);
    try {
      await orderChatService.resolveDispute(selectedOrderCode, {
        action: "REJECT",
        note,
      });

      toast.success("Đã từ chối khiếu nại đơn hàng.");
      setRejectModalOpen(false);
      setRejectReason("");
      onDisputeResolved?.();
      await loadInbox();
      await loadMessages(selectedOrderCode);
    } catch {
      toast.error("Không thể từ chối khiếu nại. Vui lòng thử lại!");
    } finally {
      setIsResolving(false);
    }
  }

  const pendingDisputesCount = conversations.filter((c) => c.hasPendingDispute).length;
  const connectedFarmsCount = new Set(conversations.map((c) => c.farmName).filter(Boolean)).size;

  const filteredConvs = conversations.filter((c) => {
    if (filterDispute === "PENDING_DISPUTE" && !c.hasPendingDispute) return false;
    if (filterDispute === "RESOLVED" && c.refundStatus !== "APPROVED" && c.refundStatus !== "REJECTED") return false;
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (
      c.orderCode.toLowerCase().includes(q) ||
      c.customerName.toLowerCase().includes(q) ||
      c.customerPhone?.includes(q) ||
      c.farmName.toLowerCase().includes(q) ||
      c.productSummary.toLowerCase().includes(q)
    );
  });

  const adminChips = [
    "Dạ AgriTrace đã tiếp nhận khiếu nại và đang đối soát với đội ngũ chuỗi lạnh. Chúng tôi sẽ giải quyết trong 15 phút ạ.",
    "Dạ yêu cầu hoàn tiền của bạn đã được duyệt 100%. Tiền sẽ được hoàn về tài khoản VietQR của bạn ngay ạ.",
    "Dạ thay mặt sàn AgriTrace và nhà vườn, chúng tôi xin gửi tặng bạn Voucher giảm giá 100% kèm lời xin lỗi chân thành!",
    "Dạ bạn có thể cung cấp thêm ảnh chụp góc khác của thùng hàng giúp bộ phận kiểm định được không ạ?",
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ── Metric Header Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng hội thoại</div>
            <div className="text-xl font-extrabold text-gray-900 mt-0.5">{conversations.length} đơn</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <MessageSquare size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-300 shadow-2xs flex items-center justify-between bg-amber-50/30">
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Khiếu nại chờ duyệt</div>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5 flex items-center gap-2">
              <span>{pendingDisputesCount} đơn</span>
              {pendingDisputesCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white font-bold animate-pulse">
                  Cần xử lý
                </span>
              )}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200/90 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Chủ Nông Trại Đang Kết Nối</div>
            <div className="text-xl font-extrabold text-emerald-800 mt-0.5">{connectedFarmsCount || 1} Hợp Tác Xã</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <Store size={18} />
          </div>
        </div>
      </div>

      {/* ── Main Chat Room Container ── */}
      <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[760px] w-full min-w-0">
        {/* Left Sidebar */}
        <div className="w-full md:w-80 lg:w-[320px] xl:w-[360px] border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/50 min-w-0">
          <div className="p-4 border-b border-gray-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-700" />
                <span>Khiếu Nại & Tin Nhắn Toàn Sàn</span>
              </h3>
              <button
                onClick={loadInbox}
                className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                title="Làm mới"
              >
                <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Tìm mã đơn, khách, nhà vườn..."
                className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                onClick={() => setFilterDispute("ALL")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterDispute === "ALL"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                onClick={() => setFilterDispute("PENDING_DISPUTE")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  filterDispute === "PENDING_DISPUTE"
                    ? "bg-amber-600 text-white shadow-2xs"
                    : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-50"
                }`}
              >
                <AlertTriangle size={12} />
                <span>Chờ duyệt ({pendingDisputesCount})</span>
              </button>
              <button
                onClick={() => setFilterDispute("RESOLVED")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  filterDispute === "RESOLVED"
                    ? "bg-gray-900 text-white shadow-2xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                Đã xử lý
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {filteredConvs.map((conv) => {
              const isSelected = conv.orderCode === selectedOrderCode;
              const hasUnread = Boolean(conv.unreadCount && conv.unreadCount > 0);
              return (
                <div
                  key={conv.orderCode}
                  onClick={() => handleSelectConversation(conv.orderCode)}
                  className={`p-3.5 transition-colors cursor-pointer text-xs ${
                    isSelected ? "bg-emerald-50/80 border-l-4 border-emerald-700" : "hover:bg-gray-100/70"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-emerald-800">#{conv.orderCode}</span>
                      {hasUnread && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-red-600 text-white font-extrabold text-[9px] animate-pulse shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          {conv.unreadCount} tin mới
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0">
                      {conv.lastMessageTime
                        ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-bold text-gray-900 truncate">{conv.customerName || "Khách Hàng"}</span>
                    <span className="text-[10px] text-emerald-800 font-semibold truncate bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      {(conv.farmName || "Nông trại").replace("Nông Trại Xanh ", "").replace("Hợp Tác Xã Nông Sản ", "")}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-600 line-clamp-1 mb-1.5 font-medium">
                    {conv.productSummary} • <strong>{conv.total?.toLocaleString("vi-VN")} đ</strong>
                  </p>

                  {conv.hasPendingDispute ? (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-bold text-[10px] border border-amber-300 animate-pulse">
                      <AlertTriangle size={11} className="text-amber-700" />
                      <span>Yêu cầu hoàn tiền: {conv.refundReason || "Khiếu nại"}</span>
                    </div>
                  ) : conv.refundStatus === "APPROVED" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                      <CheckCircle2 size={11} /> Đã duyệt hoàn tiền
                    </span>
                  ) : conv.refundStatus === "REJECTED" ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-bold">
                      <XCircle size={11} /> Đã từ chối khiếu nại
                    </span>
                  ) : (
                    <p className="text-[11px] text-gray-400 truncate italic">&ldquo;{conv.lastMessage}&rdquo;</p>
                  )}
                </div>
              );
            })}

            {filteredConvs.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs">
                Không tìm thấy cuộc hội thoại nào.
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-950 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                  {(activeConv.customerName || "K").charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-gray-900">{activeConv.customerName}</h4>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      #{activeConv.orderCode}
                    </span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                      🌿 {activeConv.farmName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Phone size={11} />
                      {activeConv.customerPhone}
                    </span>
                    <span>•</span>
                    <span>Tổng đơn: <strong className="font-mono">{activeConv.total?.toLocaleString("vi-VN")} đ</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                      <span className={`w-2 h-2 rounded-full ${socketConnected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"}`} />
                      {socketConnected ? "WebSocket Trực tiếp" : "Trực tuyến"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="text-right flex items-center gap-2">
                <span className="text-[11px] px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 font-bold border border-gray-200">
                  {activeConv.orderStatus}
                </span>
              </div>
            </div>

            {/* Dispute Action Banner for Admin */}
            {activeConv.hasPendingDispute && (
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-300 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-2xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-extrabold text-amber-900 text-sm">
                    <ShieldAlert size={17} className="text-amber-700 shrink-0" />
                    <span>YÊU CẦU TRẢ HÀNG / HOÀN TIỀN CẦN ADMIN DUYỆT</span>
                  </div>
                  <p className="text-xs text-amber-900">
                    • Lý do khiếu nại: <strong>{activeConv.refundReason}</strong>
                  </p>
                  <p className="text-[11px] text-amber-800">
                    • Số tiền đề xuất hoàn: <strong className="font-mono text-emerald-800 text-sm">{activeConv.total?.toLocaleString("vi-VN")} đ</strong> (Hoàn tiền 100% không cần trả hàng)
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isResolving}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-300 font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                  >
                    Từ chối khiếu nại
                  </button>

                  <button
                    onClick={handleApproveRefund}
                    disabled={isResolving}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check size={14} />
                    <span>{isResolving ? "Đang xử lý..." : "Duyệt Hoàn Tiền 100%"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Resolved Notice */}
            {activeConv.refundStatus === "APPROVED" && (
              <div className="p-3 bg-emerald-50 border-b border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 shrink-0">
                <CheckCircle2 size={16} className="text-emerald-700" />
                <span>Đơn hàng đã được <strong>Quản Trị Viên Duyệt Hoàn Tiền</strong> thành công. Trạng thái đơn: <strong>REFUNDED</strong>.</span>
              </div>
            )}

            {activeConv.refundStatus === "REJECTED" && (
              <div className="p-3 bg-red-50 border-b border-red-300 text-red-950 text-xs flex items-center gap-2 shrink-0">
                <XCircle size={16} className="text-red-600" />
                <span>Yêu cầu khiếu nại của đơn này đã bị từ chối do không đủ căn cứ đối soát.</span>
              </div>
            )}

            {/* Message Thread */}
            <div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8faf8]">
              {messages.map((m) => {
                const isAdmin = m.senderRole === "ADMIN";
                const isDispute =
                  m.messageType === "DISPUTE_SUBMITTED" ||
                  m.messageType === "DISPUTE_APPROVED" ||
                  m.messageType === "DISPUTE_REJECTED";

                if (isDispute) {
                  const isApproved = m.messageType === "DISPUTE_APPROVED";
                  const isRejected = m.messageType === "DISPUTE_REJECTED";
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-2xl border text-xs shadow-2xs space-y-1.5 max-w-lg mx-auto ${
                        isApproved
                          ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                          : isRejected
                          ? "bg-red-50 border-red-300 text-red-950"
                          : "bg-amber-50 border-amber-300 text-amber-950"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          {isApproved ? <CheckCircle2 size={14} className="text-emerald-700" /> : isRejected ? <XCircle size={14} className="text-red-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                          {m.senderName} ({new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                        </span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-white border">
                          {m.messageType}
                        </span>
                      </div>
                      <pre className="font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                        {m.message}
                      </pre>
                      {m.imageUrl && (
                        <div className="mt-2">
                          <p className="text-[10px] font-bold text-gray-600 mb-1">Ảnh khách tải lên lúc khui thùng:</p>
                          <img
                            src={m.imageUrl}
                            alt="Evidence"
                            onClick={() => setPreviewPhoto(m.imageUrl || null)}
                            className="w-32 h-32 object-cover rounded-xl border border-gray-300 shadow-2xs cursor-pointer hover:opacity-90"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] font-bold text-gray-500 mb-1 px-1">
                      {isAdmin ? (
                        <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md font-bold">
                          🛡️ CSKH AgriTrace (Bạn)
                        </span>
                      ) : m.senderRole === "FARMER" ? (
                        <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          🌿 {m.senderName}
                        </span>
                      ) : (
                        <span className="text-gray-700 font-semibold">Khách hàng: {m.senderName}</span>
                      )}
                    </span>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-2xs leading-relaxed ${
                        isAdmin
                          ? "bg-[#0b281f] text-white rounded-br-xs"
                          : "bg-white text-gray-900 border border-gray-200/90 rounded-bl-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      {m.imageUrl && (
                        <img
                          src={m.imageUrl}
                          alt="Att"
                          onClick={() => setPreviewPhoto(m.imageUrl || null)}
                          className="w-48 h-32 object-cover rounded-xl mt-2 border border-black/10 cursor-pointer"
                        />
                      )}
                      <div
                        className={`text-[9px] mt-1 text-right ${
                          isAdmin ? "text-emerald-300" : "text-gray-400"
                        }`}
                      >
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips for CSKH */}
            <div className="p-2.5 bg-gray-50 border-t border-gray-200 overflow-x-auto flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap flex items-center gap-1">
                <Sparkles size={11} className="text-amber-500 fill-amber-500" />
                Mẫu CSKH:
              </span>
              {adminChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReply(chip)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 text-gray-800 text-[11px] border border-gray-200 whitespace-nowrap transition-colors shadow-2xs cursor-pointer shrink-0"
                >
                  {chip.substring(0, 32)}...
                </button>
              ))}
            </div>

            {/* Animated Typing Indicator */}
            {typingUser && (
              <div className="flex items-center gap-2 px-4 py-1.5 text-xs text-emerald-800 bg-emerald-50/90 border-t border-emerald-100 transition-all shrink-0">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                </div>
                <span className="italic font-medium">{typingUser.senderName || "Khách hàng"} đang soạn tin nhắn...</span>
              </div>
            )}

            {/* Reply Input Bar */}
            <div className="p-3 bg-white border-t border-gray-200 shrink-0">
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
                  placeholder="Gõ tin nhắn hỗ trợ khách hàng với danh nghĩa CSKH AgriTrace..."
                  className="flex-1 py-2.5 px-3.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-gray-900 hover:bg-black disabled:bg-gray-300 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  <Send size={14} />
                  <span>Gửi CSKH</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400 text-xs">
            Chọn một cuộc hội thoại từ danh sách bên trái để kiểm tra.
          </div>
        )}
      </div>

      {/* Reject Dispute Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
                <AlertTriangle size={16} className="text-red-600" />
                <span>Từ Chối Khiếu Nại Đơn Hàng</span>
              </h4>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">
                Lý do từ chối (sẽ thông báo rõ cho khách hàng trong khung chat):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="VD: Hình ảnh mở thùng không khớp với quy cách đóng gói hoặc đã quá hạn 24h đồng kiểm..."
                className="w-full p-3 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50/50"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectRefund}
                disabled={isResolving}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                {isResolving ? "Đang xử lý..." : "Xác nhận từ chối"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Lightbox */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-lg w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X size={18} />
            </button>
            <img src={previewPhoto} alt="Evidence" className="w-full max-h-[80vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
