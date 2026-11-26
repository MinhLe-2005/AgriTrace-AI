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

interface FarmerMessagesPanelProps {
  farmerFarmName?: string;
}

export function FarmerMessagesPanel({ farmerFarmName }: FarmerMessagesPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [searchQ, setSearchQ] = useState("");
  const [filterDispute, setFilterDispute] = useState<"ALL" | "DISPUTE">("ALL");
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load inbox
  useEffect(() => {
    loadInbox();

    // Smart polling: định kỳ 3.5s lấy tin nhắn mới khi tab đang xem (tiết kiệm database)
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        orderChatService
          .getInbox({
            farmName: farmerFarmName,
            status: filterDispute === "DISPUTE" ? "DISPUTE" : undefined,
          })
          .then((list) => {
            setConversations(list);
          })
          .catch(() => {});

        if (selectedOrderCode) {
          orderChatService
            .getMessages(selectedOrderCode)
            .then((msgs) => {
              setMessages(msgs);
            })
            .catch(() => {});
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [farmerFarmName, filterDispute, selectedOrderCode]);

  async function loadInbox() {
    setIsLoading(true);
    try {
      const list = await orderChatService.getInbox({
        farmName: farmerFarmName,
        status: filterDispute === "DISPUTE" ? "DISPUTE" : undefined,
      });
      setConversations(list);
      if (list.length > 0 && !selectedOrderCode) {
        setSelectedOrderCode(list[0].orderCode);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectConversation(code: string) {
    setSelectedOrderCode(code);
    // Xóa ngay chấm đỏ trong giao diện khi xem
    setConversations((prev) =>
      prev.map((c) => (c.orderCode === code ? { ...c, unreadCount: 0 } : c))
    );
    orderChatService.markAsRead(code);
    loadMessages(code);
  }

  // Load messages when conversation selected
  useEffect(() => {
    if (selectedOrderCode) {
      loadMessages(selectedOrderCode);
    }
  }, [selectedOrderCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages(code: string) {
    try {
      const msgs = await orderChatService.getMessages(code);
      setMessages(msgs);
    } catch {
      // ignore
    }
  }

  const activeConv = conversations.find((c) => c.orderCode === selectedOrderCode);

  async function handleSendReply(customText?: string) {
    const text = (customText || replyText).trim();
    if (!text || !selectedOrderCode) return;

    setIsSending(true);
    try {
      const farmName = activeConv?.farmName || "Chủ Nông Trại Xanh";
      const newMsg = await orderChatService.sendMessage(selectedOrderCode, {
        senderRole: "FARMER",
        senderName: farmName,
        message: text,
        messageType: "CHAT",
      });

      setMessages((prev) => [...prev, newMsg]);
      setReplyText("");
      toast.success("Đã gửi tin nhắn phản hồi tới khách hàng!");
      loadInbox();
    } catch {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
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
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row h-[760px] animate-in fade-in duration-200 w-full min-w-0">
      {/* ── Left Sidebar: Conversation List ── */}
      <div className="w-full md:w-80 lg:w-[320px] xl:w-[360px] border-r border-gray-200 flex flex-col shrink-0 bg-gray-50/50 min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 flex items-center gap-2">
              <MessageSquare size={17} className="text-emerald-700" />
              <span>Hộp Thư Khách Hàng</span>
              {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-600 text-white font-extrabold text-[10px] animate-pulse flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)} mới
                </span>
              )}
            </h3>
            <button
              onClick={loadInbox}
              className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="Làm mới"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Tìm theo mã đơn, tên khách, SĐT..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterDispute("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterDispute === "ALL"
                  ? "bg-emerald-700 text-white shadow-2xs"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              Tất cả ({conversations.length})
            </button>
            <button
              onClick={() => setFilterDispute("DISPUTE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterDispute === "DISPUTE"
                  ? "bg-amber-600 text-white shadow-2xs"
                  : "bg-white text-amber-700 border border-amber-300 hover:bg-amber-50"
              }`}
            >
              <AlertTriangle size={12} />
              <span>Khiếu nại / Hoàn tiền</span>
              {conversations.filter((c) => c.hasPendingDispute).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              )}
            </button>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-w-0">
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

                <div className="flex items-center gap-1.5 font-bold text-gray-900 mb-0.5">
                  <User size={13} className="text-gray-400" />
                  <span className="truncate">{conv.customerName}</span>
                  {conv.customerPhone && (
                    <span className="text-[10px] text-gray-400 font-mono font-normal">
                      ({conv.customerPhone})
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-gray-600 line-clamp-1 mb-1 font-medium">
                  {conv.productSummary}
                </p>

                {/* Dispute alert or last msg */}
                {conv.hasPendingDispute ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-300">
                    <AlertTriangle size={11} className="text-amber-700" />
                    <span>Khiếu nại: {conv.refundReason || "Yêu cầu hoàn tiền"}</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 truncate italic">
                    "{conv.lastMessage}"
                  </p>
                )}
              </div>
            );
          })}

          {filteredConvs.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-xs">
              Không có cuộc hội thoại nào phù hợp.
            </div>
          )}
        </div>
      </div>

      {/* ── Right Content: Trao Đổi Với Khách Hàng ── */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white min-w-0 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
                {(activeConv.customerName || "K").charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-gray-900">{activeConv.customerName}</h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    #{activeConv.orderCode}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Phone size={11} />
                    {activeConv.customerPhone}
                  </span>
                  <span>•</span>
                  <span>Tổng tiền: <strong>{activeConv.total?.toLocaleString("vi-VN")} đ</strong></span>
                </div>
              </div>
            </div>

            {/* Status pill */}
            <div className="text-right">
              <span className="text-[11px] px-2.5 py-1 rounded-xl bg-gray-100 text-gray-800 font-bold border border-gray-200">
                {activeConv.orderStatus}
              </span>
            </div>
          </div>

          {/* Dispute Attention Banner if PENDING */}
          {activeConv.hasPendingDispute && (
            <div className="p-3.5 bg-amber-50 border-b border-amber-300 text-amber-950 text-xs flex items-start justify-between gap-3 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <ShieldAlert size={15} className="text-amber-700 shrink-0" />
                  <span>Khách hàng đang khiếu nại yêu cầu hoàn tiền / đổi hàng:</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  • Lý do: <strong>{activeConv.refundReason}</strong>
                </p>
                <p className="text-[10px] text-amber-700 italic">
                  Chủ nhà vườn có thể gõ giải thích, cam kết đổi hàng hoặc đề xuất CSKH Admin giải quyết hoàn tiền thỏa đáng.
                </p>
              </div>

              <button
                onClick={() =>
                  handleSendReply(
                    "Dạ chào anh/chị! Nhà vườn đã nhận được phản hồi về tình trạng rau. Nhà vườn thành thật xin lỗi và sẽ đóng gói bù một combo rau mới gửi tới anh/chị ngay chuyến sáng mai ạ!"
                  )
                }
                className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
              >
                Nhận lỗi & Đổi bù ngay
              </button>
            </div>
          )}

          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8faf8]">
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
                    className={`p-3.5 rounded-2xl border text-xs shadow-2xs space-y-1.5 max-w-lg mx-auto ${
                      isApproved ? "bg-emerald-50 border-emerald-300 text-emerald-950" : "bg-amber-50 border-amber-300 text-amber-950"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span className="flex items-center gap-1.5">
                        {isApproved ? <CheckCircle2 size={14} className="text-emerald-700" /> : <AlertTriangle size={14} className="text-amber-600" />}
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
                      <div className="mt-1">
                        <img src={m.imageUrl} alt="Evidence" className="w-28 h-28 object-cover rounded-xl border border-gray-300 shadow-2xs" />
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
                  <span className="text-[10px] font-bold text-gray-500 mb-1 px-1">
                    {isFarmer ? (
                      <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        🌿 Chủ Nông Trại (Bạn)
                      </span>
                    ) : m.senderRole === "ADMIN" ? (
                      <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">
                        🛡️ CSKH AgriTrace
                      </span>
                    ) : (
                      <span className="text-gray-700">Khách hàng: {m.senderName}</span>
                    )}
                  </span>

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-2xs leading-relaxed ${
                      isFarmer
                        ? "bg-[#135d3d] text-white rounded-br-xs"
                        : "bg-white text-gray-900 border border-gray-200/90 rounded-bl-xs"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    {m.imageUrl && (
                      <img src={m.imageUrl} alt="Att" className="w-48 h-32 object-cover rounded-xl mt-2 border border-black/10" />
                    )}
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        isFarmer ? "text-emerald-200/80" : "text-gray-400"
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

          {/* Quick Reply Chips for Farmer */}
          <div className="p-2.5 bg-emerald-50/70 border-t border-emerald-900/10 overflow-x-auto flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-emerald-900 whitespace-nowrap flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500 fill-amber-500" />
              Mẫu rep nhanh:
            </span>
            {farmerQuickChips.map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSendReply(chip)}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-100 text-gray-800 text-[11px] border border-emerald-200/80 whitespace-nowrap transition-colors shadow-2xs cursor-pointer shrink-0"
              >
                {chip.substring(0, 32)}...
              </button>
            ))}
          </div>

          {/* Reply Input Bar */}
          <div className="p-3 bg-white border-t border-gray-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendReply();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Gõ tin nhắn phản hồi tới khách hàng với tư cách Chủ Nông Trại..."
                className="flex-1 py-2.5 px-3.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
              />
              <button
                type="submit"
                disabled={isSending || !replyText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <Send size={14} />
                <span>Trả lời</span>
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400 text-xs">
          Chọn một cuộc hội thoại từ danh sách bên trái để xem tin nhắn.
        </div>
      )}
    </div>
  );
}
