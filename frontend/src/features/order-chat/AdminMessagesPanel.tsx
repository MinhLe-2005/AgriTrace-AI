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
  Headset,
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

interface AdminMessagesPanelProps {
  adminName?: string;
  initialOrderCode?: string | null;
  onDisputeResolved?: () => void;
}

export function AdminMessagesPanel({
  adminName,
  initialOrderCode,
  onDisputeResolved,
}: AdminMessagesPanelProps = {}) {
  const authUser = useAuthStore((s) => s.user);
  const resolvedAdminName = adminName?.trim() || authUser?.name?.trim() || "Quản trị viên CSKH";

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(
    initialOrderCode ? initialOrderCode.replace(/^#/, "").trim().toUpperCase() : null
  );
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
      const normalized = initialOrderCode.replace(/^#/, "").trim().toUpperCase();
      setSelectedOrderCode(normalized);
      orderChatService.markAsRead(normalized, { channel: "ADMIN", viewerRole: "ADMIN" });
    }
  }, [initialOrderCode]);
  useEffect(() => {
    loadInbox();

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        orderChatService
          .getInbox({
            viewerRole: "ADMIN",
            channel: "ADMIN",
            status: filterDispute === "PENDING_DISPUTE" ? "DISPUTE" : undefined,
          })
          .then((list) => {
            setConversations(list);
          })
          .catch(() => {});

        if (selectedOrderCode) {
          orderChatService
            .getMessages(selectedOrderCode, { channel: "ADMIN", viewerRole: "ADMIN" })
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
        viewerRole: "ADMIN",
        channel: "ADMIN",
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
    orderChatService.markAsRead(code, { channel: "ADMIN", viewerRole: "ADMIN" });
    loadMessages(code);
  }

  useEffect(() => {
    if (selectedOrderCode) {
      loadMessages(selectedOrderCode);
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
        channel: "ADMIN",
        viewerRole: "ADMIN",
      });
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
    channel: "ADMIN",
    subscribeAdminInbox: true,
    currentUserRole: "ADMIN",
    currentUserName: resolvedAdminName,
    onMessageReceived: handleIncomingMessage,
    onAdminInboxEvent: (ev) => {
      loadInbox();
      if (ev?.type === "SUPPORT_ESCALATED" && ev.orderCode) {
        toast.info(
          `Khách hàng ${ev.customerName || ""} vừa yêu cầu Hỗ trợ Tổng đài cho đơn #${ev.orderCode}`
        );
      }
    },
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
        senderName: resolvedAdminName,
        senderEmail: authUser?.email,
        channel: "ADMIN",
        message: text,
        messageType: "CHAT",
      });

      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setReplyText("");
      toast.success("Đã gửi phản hồi trực tiếp tới khách hàng!");
      loadInbox();
      setTimeout(() => scrollToBottom("smooth"), 50);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi tin nhắn. Vui lòng thử lại!"));
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
      {/* ── Compact Clean Metric Bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white px-4 py-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Tổng đài hội thoại</div>
          <div className="text-xl font-extrabold text-stone-900 mt-0.5">{conversations.length} đơn</div>
        </div>

        <div className="bg-white px-4 py-3.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">Chờ duyệt hoàn tiền</div>
            <div className="text-xl font-extrabold text-amber-900 mt-0.5">{pendingDisputesCount} đơn</div>
          </div>
          {pendingDisputesCount > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
              Cần xử lý
            </span>
          )}
        </div>

        <div className="bg-white px-4 py-3.5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">Nhà vườn liên quan</div>
          <div className="text-xl font-extrabold text-emerald-900 mt-0.5">
            {new Set(conversations.map((c) => c.farmName).filter(Boolean)).size} nhà vườn
          </div>
        </div>
      </div>

      {/* ── Main Chat Room Container ── */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[720px] w-full min-w-0">
        {/* Left Sidebar */}
        <div className="w-full md:w-80 lg:w-[320px] xl:w-[340px] border-r border-stone-200 flex flex-col shrink-0 bg-stone-50/40 min-w-0">
          <div className="p-4 border-b border-stone-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900">Tổng đài CSKH & Khiếu nại</h3>
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
                placeholder="Tìm mã đơn, khách, nhà vườn..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-stone-50 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setFilterDispute("ALL")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterDispute === "ALL"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                onClick={() => setFilterDispute("PENDING_DISPUTE")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterDispute === "PENDING_DISPUTE"
                    ? "bg-amber-700 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Chờ duyệt ({pendingDisputesCount})
              </button>
              <button
                onClick={() => setFilterDispute("RESOLVED")}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  filterDispute === "RESOLVED"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Đã xử lý
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredConvs.map((conv) => {
              const isSelected = conv.orderCode === selectedOrderCode;
              const hasUnread = Boolean(conv.unreadCount && conv.unreadCount > 0);
              return (
                <div
                  key={conv.orderCode}
                  onClick={() => handleSelectConversation(conv.orderCode)}
                  className={`p-3.5 transition-colors cursor-pointer text-xs border-l-3 ${
                    isSelected ? "bg-rose-50/50 border-rose-700" : "border-transparent hover:bg-stone-100/70"
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

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-semibold text-stone-900 truncate">{conv.customerName || "Khách hàng"}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded truncate max-w-[140px]">
                      {(conv.farmName || "Nhà vườn").replace("Nông Trại Xanh ", "").replace("Hợp Tác Xã Nông Sản ", "")}
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 line-clamp-1 mb-1">
                    {conv.productSummary} · <strong>{conv.total?.toLocaleString("vi-VN")} đ</strong>
                  </p>

                  {conv.hasPendingDispute ? (
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold text-[10px]">
                      Hoàn tiền: {conv.refundReason || "Khiếu nại"}
                    </span>
                  ) : conv.refundStatus === "APPROVED" ? (
                    <span className="text-[10px] text-emerald-700 font-semibold">Đã duyệt hoàn tiền</span>
                  ) : conv.refundStatus === "REJECTED" ? (
                    <span className="text-[10px] text-red-600 font-semibold">Đã từ chối</span>
                  ) : (
                    <p className="text-[11px] text-stone-400 truncate">{conv.lastMessage}</p>
                  )}
                </div>
              );
            })}

            {filteredConvs.length === 0 && (
              <div className="p-8 text-center text-stone-400 text-xs">
                Chưa có đơn hàng nào yêu cầu Hỗ trợ tổng đài hoặc Khiếu nại.
              </div>
            )}
          </div>
        </div>

        {/* Right Content */}
        {activeConv ? (
          <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-rose-900 text-white font-bold flex items-center justify-center text-sm shrink-0">
                  {(activeConv.customerName || "K").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-sm text-stone-900 truncate">{activeConv.customerName}</h4>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-stone-100 text-stone-800 font-semibold">
                      #{activeConv.orderCode}
                    </span>
                    <span className="text-[10px] text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full font-semibold">
                      Kênh riêng Khách & Admin
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    {activeConv.customerPhone && <span>{activeConv.customerPhone}</span>}
                    <span>·</span>
                    <span className="truncate">{activeConv.farmName}</span>
                    <span>·</span>
                    <span className="font-mono font-semibold text-stone-800">{activeConv.total?.toLocaleString("vi-VN")} đ</span>
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

            {/* Dispute Action Banner */}
            {activeConv.hasPendingDispute && (
              <div className="px-5 py-3.5 bg-amber-50/70 border-b border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">Yêu cầu Trả hàng / Hoàn tiền chờ Admin duyệt</p>
                  <p className="text-[11px] text-amber-900">
                    Lý do: <strong>{activeConv.refundReason}</strong> · Hoàn đề xuất: <strong className="font-mono">{activeConv.total?.toLocaleString("vi-VN")} đ</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setRejectModalOpen(true)}
                    disabled={isResolving}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Từ chối
                  </button>
                  <button
                    onClick={handleApproveRefund}
                    disabled={isResolving}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {isResolving ? "Đang xử lý..." : "Duyệt hoàn tiền 100%"}
                  </button>
                </div>
              </div>
            )}

            {activeConv.refundStatus === "APPROVED" && (
              <div className="px-5 py-2.5 bg-emerald-50/70 border-b border-emerald-200 text-emerald-900 text-xs shrink-0">
                Đã duyệt hoàn tiền cho đơn hàng này (REFUNDED).
              </div>
            )}

            {activeConv.refundStatus === "REJECTED" && (
              <div className="px-5 py-2.5 bg-red-50/70 border-b border-red-200 text-red-900 text-xs shrink-0">
                Yêu cầu hoàn tiền cho đơn này đã bị từ chối.
              </div>
            )}

            {/* Message Thread */}
            <div ref={chatScrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-3.5 bg-[#f7f8f7]">
              {messages.length === 0 && (
                <div className="text-center py-8 text-xs text-stone-400">
                  Kênh trao đổi riêng 1-1 giữa {resolvedAdminName} và Khách hàng {activeConv.customerName}.
                </div>
              )}

              {messages.map((m) => {
                const isAdmin = m.senderRole === "ADMIN";
                const isNotice =
                  m.messageType === "DISPUTE_SUBMITTED" ||
                  m.messageType === "DISPUTE_APPROVED" ||
                  m.messageType === "DISPUTE_REJECTED" ||
                  m.messageType === "SUPPORT_ESCALATED";

                if (isNotice) {
                  const isApproved = m.messageType === "DISPUTE_APPROVED";
                  const isRejected = m.messageType === "DISPUTE_REJECTED";
                  const isEscalation = m.messageType === "SUPPORT_ESCALATED";
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl bg-white border border-stone-200 border-l-4 text-xs shadow-2xs space-y-1.5 max-w-lg mx-auto ${
                        isApproved
                          ? "border-l-emerald-600"
                          : isRejected
                          ? "border-l-red-600"
                          : isEscalation
                          ? "border-l-rose-600"
                          : "border-l-amber-500"
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-stone-900">
                        <span>
                          {isEscalation
                            ? "Yêu cầu Hỗ trợ Tổng đài"
                            : isApproved
                            ? "Đã duyệt hoàn tiền"
                            : isRejected
                            ? "Từ chối khiếu nại"
                            : "Yêu cầu Trả hàng / Hoàn tiền"}
                        </span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed">{m.message}</p>
                      {m.imageUrl && (
                        <div className="pt-1">
                          <img
                            src={m.imageUrl}
                            alt="Evidence"
                            onClick={() => setPreviewPhoto(m.imageUrl || null)}
                            className="w-36 h-36 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-90"
                          />
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}>
                    <span className="text-[11px] font-semibold text-stone-500 mb-1 px-1">
                      {isAdmin
                        ? m.senderName || resolvedAdminName
                        : `Khách hàng · ${m.senderName || activeConv.customerName}`}
                    </span>

                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs shadow-2xs leading-relaxed ${
                        isAdmin
                          ? "bg-stone-900 text-white rounded-br-sm"
                          : "bg-white text-stone-900 border border-stone-200 rounded-bl-sm"
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
                      <div className={`text-[10px] mt-1 text-right ${isAdmin ? "text-stone-300" : "text-stone-400"}`}>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Clean Quick Reply Pills */}
            <div className="px-4 py-2 bg-white border-t border-stone-100 overflow-x-auto flex items-center gap-1.5 shrink-0 no-scrollbar">
              {adminChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendReply(chip)}
                  className="px-3 py-1 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-[11px] border border-stone-200/80 whitespace-nowrap transition-colors cursor-pointer shrink-0"
                >
                  {chip.substring(0, 38)}...
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
                  placeholder={`Nhắn tin riêng với ${activeConv.customerName} về đơn #${activeConv.orderCode}...`}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-stone-200 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-stone-700 bg-stone-50 focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Gửi
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-stone-400 text-xs">
            Chọn một cuộc hội thoại ở danh sách bên trái để kiểm tra.
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
