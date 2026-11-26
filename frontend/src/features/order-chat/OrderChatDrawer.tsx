"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Image as ImageIcon,
  CheckCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Phone,
  ShieldCheck,
  Store,
  Clock,
  ArrowRight,
  Gift,
} from "lucide-react";
import Image from "next/image";
import { orderChatService, type OrderMessage } from "@/services/order-chat.service";
import type { ApiOrder } from "@/services/catalog.service";
import { toast } from "@/stores/toast-store";

interface OrderChatDrawerProps {
  order: ApiOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenDispute: (order: ApiOrder) => void;
  currentUserRole?: "CUSTOMER" | "FARMER" | "ADMIN";
  currentUserName?: string;
}

export function OrderChatDrawer({
  order,
  isOpen,
  onClose,
  onOpenDispute,
  currentUserRole = "CUSTOMER",
  currentUserName = "Lê Quang Minh",
}: OrderChatDrawerProps) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  function handleChatFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 8MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedPhoto(event.target?.result as string);
        toast.success("Đã đính kèm ảnh!");
      };
      reader.readAsDataURL(file);
    }
  }

  const orderCode = order?.orderCode || "";
  const firstItem = order?.items?.[0];
  const farmName = firstItem?.origin || (order?.lotCode?.includes("MC") ? "Hợp Tác Xã Nông Sản Mộc Châu" : "Nông Trại Xanh Thủy Canh Đà Lạt");

  // Fetch messages
  useEffect(() => {
    if (isOpen && orderCode) {
      loadMessages();
    }
  }, [isOpen, orderCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    if (!orderCode) return;
    try {
      const list = await orderChatService.getMessages(orderCode);
      setMessages(list);
    } catch {
      // ignore
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text && !selectedPhoto) return;
    if (!orderCode) return;

    setIsSending(true);
    try {
      const newMsg = await orderChatService.sendMessage(orderCode, {
        senderRole: currentUserRole,
        senderName: currentUserName,
        message: text || "Gửi ảnh chụp nông sản",
        imageUrl: selectedPhoto || undefined,
        messageType: "CHAT",
      });

      setMessages((prev) => [...prev, newMsg]);
      setInputText("");
      setSelectedPhoto(null);

      // Auto-reply simulation if customer asks and no farmer replied yet
      if (currentUserRole === "CUSTOMER") {
        setTimeout(async () => {
          await loadMessages();
        }, 1500);
      }
    } catch {
      toast.error("Không thể gửi tin nhắn. Vui lòng thử lại!");
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen || !order) return null;

  const quickChips = [
    "Rau này hái lúc mấy giờ sáng nay?",
    "Đơn của mình dự kiến mấy giờ tới nơi?",
    "Rau nhận được bị dập hỏng, hỗ trợ đổi trả giúp mình!",
    "Bảo quản trong tủ lạnh được mấy ngày shop?",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-[#f8faf8] z-50 shadow-2xl flex flex-col border-l border-emerald-950/10 transition-transform animate-in slide-in-from-right duration-250">
        {/* Header Shopee-style */}
        <div className="bg-[#0b281f] text-white p-4 flex items-center justify-between border-b border-emerald-900/40 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-2xl bg-emerald-800/80 border border-emerald-500/40 flex items-center justify-center text-emerald-200 font-black shadow-xs">
              <Store size={22} className="text-emerald-300" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-[#0b281f] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white line-clamp-1">{farmName}</h3>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-emerald-200/80 mt-0.5">
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
                  <ShieldCheck size={12} />
                  Chủ Nhà Vườn Official
                </span>
                <span>•</span>
                <span className="text-emerald-400">Trực tuyến</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng chat"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Pinned Order Context Card (Shopee Style) */}
        <div className="p-3 bg-white border-b border-gray-200/90 shadow-2xs shrink-0 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
              <img
                src={firstItem?.image || "/images/products/cai-kale.png"}
                alt={firstItem?.name || "Nông sản"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/products/cai-kale.png";
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-xs text-emerald-800">#{order.orderCode}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {order.status === "DELIVERED"
                    ? "Đã giao hàng"
                    : order.status === "SHIPPING"
                    ? "Đang giao xe lạnh"
                    : order.status === "REFUNDED"
                    ? "Đã hoàn tiền"
                    : order.status}
                </span>
              </div>
              <p className="text-xs text-gray-800 font-medium truncate mt-0.5">
                {firstItem?.name || "Nông sản tươi"} {order.items?.length > 1 ? `(+${order.items.length - 1} món)` : ""}
              </p>
              <p className="text-xs font-bold text-gray-900 font-mono">
                {order.total?.toLocaleString("vi-VN")} đ
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenDispute(order)}
            className="shrink-0 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
            title="Gửi khiếu nại hoặc yêu cầu hoàn tiền"
          >
            <AlertTriangle size={12} className="text-amber-600" />
            <span>Khiếu nại / Trả hàng</span>
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Dispute Banner if PENDING */}
          {order.refundStatus === "PENDING" && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs space-y-1.5 animate-pulse">
              <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                <span>Đơn hàng đang có Yêu Cầu Hoàn Tiền / Trả Hàng</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Lý do: <strong>{order.refundReason || "Rau củ dập nát / lỗi chuỗi lạnh"}</strong>. Quản trị viên & Chủ nông trại đang đối soát hình ảnh để phản hồi.
              </p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe =
              (currentUserRole === "CUSTOMER" && msg.senderRole === "CUSTOMER") ||
              (currentUserRole === "FARMER" && msg.senderRole === "FARMER") ||
              (currentUserRole === "ADMIN" && msg.senderRole === "ADMIN");

            const isDisputeNotice =
              msg.messageType === "DISPUTE_SUBMITTED" ||
              msg.messageType === "DISPUTE_APPROVED" ||
              msg.messageType === "DISPUTE_REJECTED";

            if (isDisputeNotice) {
              const isApproved = msg.messageType === "DISPUTE_APPROVED";
              const isRejected = msg.messageType === "DISPUTE_REJECTED";
              return (
                <div
                  key={msg.id}
                  className={`p-3.5 rounded-2xl border text-xs shadow-2xs space-y-1.5 ${
                    isApproved
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                      : isRejected
                      ? "bg-red-50 border-red-300 text-red-950"
                      : "bg-amber-50 border-amber-300 text-amber-950"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span className="flex items-center gap-1.5">
                      {isApproved ? (
                        <CheckCircle2 size={14} className="text-emerald-700" />
                      ) : isRejected ? (
                        <XCircle size={14} className="text-red-600" />
                      ) : (
                        <AlertTriangle size={14} className="text-amber-600" />
                      )}
                      {msg.senderName} ({new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-white/80 border">
                      {msg.messageType}
                    </span>
                  </div>
                  <pre className="font-sans text-[11px] whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </pre>
                  {msg.imageUrl && (
                    <div className="mt-2">
                      <p className="text-[10px] text-gray-500 font-bold mb-1">Ảnh bằng chứng:</p>
                      <img
                        src={msg.imageUrl}
                        alt="Evidence"
                        onClick={() => setPreviewPhotoModal(msg.imageUrl || null)}
                        className="w-24 h-24 object-cover rounded-xl border border-gray-300 shadow-2xs cursor-pointer hover:opacity-90"
                      />
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                {/* Sender badge */}
                {!isMe && (
                  <span className="text-[10px] font-bold text-gray-500 mb-1 flex items-center gap-1 px-1">
                    {msg.senderRole === "FARMER" ? (
                      <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        🌿 {msg.senderName}
                      </span>
                    ) : msg.senderRole === "ADMIN" ? (
                      <span className="text-red-700 bg-red-100 px-1.5 py-0.5 rounded-md">
                        🛡️ CSKH AgriTrace
                      </span>
                    ) : (
                      <span className="text-gray-700 font-semibold">{msg.senderName}</span>
                    )}
                  </span>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-2xs leading-relaxed ${
                    isMe
                      ? "bg-[#135d3d] text-white rounded-br-xs"
                      : "bg-white text-gray-900 border border-gray-200/90 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>

                  {/* Attached photo if any */}
                  {msg.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={msg.imageUrl}
                        alt="Attached"
                        onClick={() => setPreviewPhotoModal(msg.imageUrl || null)}
                        className="w-48 h-32 object-cover rounded-xl border border-black/10 cursor-pointer hover:opacity-95"
                      />
                    </div>
                  )}

                  <div
                    className={`text-[9px] mt-1 text-right flex items-center justify-end gap-1 ${
                      isMe ? "text-emerald-200/80" : "text-gray-400"
                    }`}
                  >
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    {isMe && <CheckCheck size={11} className="text-emerald-300" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips Shopee Bar */}
        <div className="px-3 py-2 bg-emerald-50/70 border-t border-emerald-900/10 overflow-x-auto flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-bold text-emerald-900 whitespace-nowrap flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500 fill-amber-500" />
            Hỏi nhanh:
          </span>
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-white hover:bg-emerald-100 text-gray-800 text-[11px] border border-emerald-200/80 whitespace-nowrap transition-colors shadow-2xs cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-200/90 shrink-0 space-y-2">
          {/* Selected photo preview before send */}
          {selectedPhoto && (
            <div className="relative inline-block">
              <img
                src={selectedPhoto}
                alt="Selected"
                className="w-16 h-16 object-cover rounded-xl border-2 border-emerald-500 shadow-xs"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs cursor-pointer shadow-xs"
              >
                ×
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Quick Photo Upload Preset Button */}
            <input
              type="file"
              ref={chatFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleChatFile}
            />
            <button
              type="button"
              onClick={() => chatFileInputRef.current?.click()}
              className="p-2.5 rounded-xl text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 transition-colors cursor-pointer"
              title="Đính kèm ảnh thực tế từ máy / điện thoại"
            >
              <ImageIcon size={18} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn trao đổi với Shop..."
              className="flex-1 py-2.5 px-3.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-gray-50/50"
            />

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !selectedPhoto)}
              className="px-4 py-2.5 rounded-xl bg-[#135d3d] hover:bg-[#0e482f] disabled:bg-gray-300 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={14} />
              <span>Gửi</span>
            </button>
          </form>
        </div>
      </div>

      {/* Lightbox Preview */}
      {previewPhotoModal && (
        <div
          className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoModal(null)}
        >
          <div className="relative max-w-lg w-full bg-black rounded-2xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setPreviewPhotoModal(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhotoModal}
              alt="Preview"
              className="w-full max-h-[80vh] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
