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
  Sparkles,
  Headset,
  ShieldCheck,
  Store,
} from "lucide-react";
import { orderChatService, type ChatChannel, type OrderMessage } from "@/services/order-chat.service";
import type { ApiOrder } from "@/services/catalog.service";
import { toast } from "@/stores/toast-store";
import { getApiErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";
import { compressAvatarImage } from "@/utils/image-compress";
import { useOrderChatSocket } from "./useOrderChatSocket";

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
  currentUserName,
}: OrderChatDrawerProps) {
  const authUser = useAuthStore((s) => s.user);
  const resolvedUserName = currentUserName?.trim() || authUser?.name?.trim() || "Khách hàng";

  const [activeChannel, setActiveChannel] = useState<ChatChannel>(
    currentUserRole === "ADMIN" ? "ADMIN" : "SHOP"
  );
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatFileInputRef = useRef<HTMLInputElement>(null);
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

  async function handleChatFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 10MB.");
      return;
    }
    try {
      const compressed = await compressAvatarImage(file, 960, 960, 0.8);
      setSelectedPhoto(compressed.dataUrl);
      toast.success("Đã đính kèm ảnh thực tế!");
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedPhoto((event.target?.result as string) || null);
        toast.success("Đã đính kèm ảnh thực tế!");
      };
      reader.readAsDataURL(file);
    }
  }

  const orderCode = (order?.orderCode || "").replace(/^#/, "").trim();
  const firstItem = order?.items?.[0];
  const farmName = firstItem?.origin || (order?.lotCode?.includes("MC") ? "Hợp Tác Xã Nông Sản Mộc Châu" : "Nông Trại Xanh Thủy Canh Đà Lạt");

  const handleIncomingMessage = (newMsg: OrderMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
  };

  const {
    connected: socketConnected,
    typingUser,
    sendTyping,
  } = useOrderChatSocket({
    orderCode,
    channel: activeChannel,
    currentUserRole,
    currentUserName: resolvedUserName,
    onMessageReceived: handleIncomingMessage,
  });

  useEffect(() => {
    setActiveChannel(currentUserRole === "ADMIN" ? "ADMIN" : "SHOP");
  }, [orderCode, currentUserRole]);

  useEffect(() => {
    if (isOpen && orderCode) {
      isNearBottomRef.current = true;
      loadMessages(activeChannel);
    }
  }, [isOpen, orderCode, activeChannel]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom("smooth");
    }
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("order-chat-drawer-toggle", { detail: { isOpen } })
      );
    }
    return () => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("order-chat-drawer-toggle", { detail: { isOpen: false } })
        );
      }
    };
  }, [isOpen]);

  async function loadMessages(targetChannel: ChatChannel = activeChannel) {
    if (!orderCode) return;
    try {
      const list = await orderChatService.getMessages(orderCode, {
        channel: targetChannel,
        viewerRole: currentUserRole,
      });
      setMessages(list);
    } catch {
      // ignore
    }
  }

  async function handleEscalateToAdmin() {
    if (!orderCode || isEscalating) return;
    setIsEscalating(true);
    try {
      await orderChatService.escalateToAdmin(orderCode, {
        customerName: resolvedUserName,
        customerEmail: authUser?.email,
      });
      setActiveChannel("ADMIN");
      await loadMessages("ADMIN");
      toast.success("Đã kết nối Tổng đài CSKH! Quản trị viên đã nhận yêu cầu hỗ trợ đơn #" + orderCode);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể kết nối Tổng đài CSKH. Vui lòng thử lại!"));
    } finally {
      setIsEscalating(false);
    }
  }

  async function handleSend(textToSend?: string) {
    const text = (textToSend || inputText).trim();
    if (!text && !selectedPhoto) return;
    if (!orderCode) return;

    sendTyping(false);
    setIsSending(true);
    try {
      const newMsg = await orderChatService.sendMessage(orderCode, {
        senderRole: currentUserRole,
        senderName: resolvedUserName,
        senderEmail: authUser?.email,
        channel: activeChannel,
        message: text || "Gửi ảnh chụp nông sản",
        imageUrl: selectedPhoto || undefined,
        messageType: "CHAT",
      });

      setMessages((prev) => (prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]));
      setInputText("");
      setSelectedPhoto(null);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Không thể gửi tin nhắn. Vui lòng thử lại!"));
    } finally {
      setIsSending(false);
    }
  }

  if (!isOpen || !order) return null;

  const isAdminChannel = activeChannel === "ADMIN";
  const quickChips = isAdminChannel
    ? [
        "Mình cần Admin kiểm tra tiến độ xử lý đơn này giúp mình.",
        "Hỗ trợ kiểm tra đối soát thanh toán VietQR đơn hàng.",
        "Nhờ Tổng đài hỗ trợ làm việc với nhà vườn về chất lượng rau.",
      ]
    : [
        "Rau này hái lúc mấy giờ sáng nay?",
        "Đơn của mình dự kiến mấy giờ tới nơi?",
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
      <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-[#f7f8f7] z-50 shadow-2xl flex flex-col border-l border-stone-200 transition-transform animate-in slide-in-from-right duration-250">
        {/* Clean Minimal Header */}
        <div className="bg-white text-stone-900 px-5 py-3.5 flex items-center justify-between border-b border-stone-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center font-bold text-sm shrink-0 ${
              isAdminChannel ? "bg-rose-800" : "bg-emerald-800"
            }`}>
              {isAdminChannel ? "CS" : farmName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-stone-900 truncate">
                  {isAdminChannel ? "Tổng đài CSKH AgriTrace" : farmName}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-500 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${socketConnected ? "bg-emerald-500" : "bg-stone-300"}`} />
                <span>{isAdminChannel ? "Riêng tư Khách & Admin" : "Riêng tư Khách & Nhà vườn"}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Bar + Channel Tabs */}
        <div className="p-3 bg-white border-b border-stone-200 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={firstItem?.image || "/images/products/cai-kale.png"}
                alt={firstItem?.name || "Nông sản"}
                className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/images/products/cai-kale.png";
                }}
              />
              <div className="min-w-0">
                <span className="font-mono font-bold text-xs text-stone-900 block">#{orderCode}</span>
                <p className="text-[11px] text-stone-600 truncate">
                  {firstItem?.name || "Nông sản tươi"} · <strong>{order.total?.toLocaleString("vi-VN")} đ</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {currentUserRole === "CUSTOMER" && (
                <button
                  onClick={handleEscalateToAdmin}
                  disabled={isEscalating}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                    isAdminChannel
                      ? "bg-rose-700 text-white border-rose-700"
                      : "bg-white hover:bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {isEscalating ? "Đang kết nối..." : "Hỗ trợ tổng đài"}
                </button>
              )}

              <button
                onClick={() => onOpenDispute(order)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Khiếu nại
              </button>
            </div>
          </div>

          {currentUserRole === "CUSTOMER" && (
            <div className="grid grid-cols-2 p-0.5 rounded-xl bg-stone-100 text-[11px]">
              <button
                type="button"
                onClick={() => setActiveChannel("SHOP")}
                className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
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
                className={`py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                  activeChannel === "ADMIN"
                    ? "bg-white text-rose-800 shadow-2xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                Tổng đài CSKH
              </button>
            </div>
          )}
        </div>

        {/* Message Feed */}
        <div
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-stone-50/40 px-4 py-4 space-y-3"
        >
          {/* Dispute Banner if PENDING */}
          {order.refundStatus === "PENDING" && (
            <div className="border-l-2 border-amber-500 bg-amber-50/70 rounded-r-xl px-3.5 py-2.5 text-xs space-y-1">
              <div className="font-semibold text-amber-950">
                Đơn hàng đang có yêu cầu hoàn tiền / hỗ trợ
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Lý do: <strong>{order.refundReason || "Rau củ dập nát / lỗi chuỗi lạnh"}</strong>. Bộ phận hỗ trợ & nhà vườn đang đối soát để phản hồi.
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
              msg.messageType === "DISPUTE_REJECTED" ||
              msg.messageType === "SUPPORT_ESCALATED";

            if (isDisputeNotice) {
              const isApproved = msg.messageType === "DISPUTE_APPROVED";
              const isRejected = msg.messageType === "DISPUTE_REJECTED";
              const isSupport = msg.messageType === "SUPPORT_ESCALATED";
              const noticeLabel = isApproved
                ? "Đã duyệt hoàn tiền"
                : isRejected
                ? "Từ chối hoàn tiền"
                : isSupport
                ? "Kết nối Tổng đài CSKH"
                : "Yêu cầu khiếu nại";
              return (
                <div
                  key={msg.id}
                  className={`border-l-2 rounded-r-xl px-3.5 py-2.5 text-xs space-y-1 ${
                    isApproved
                      ? "border-emerald-500 bg-emerald-50/70 text-emerald-950"
                      : isRejected
                      ? "border-rose-500 bg-rose-50/70 text-rose-950"
                      : isSupport
                      ? "border-sky-500 bg-sky-50/70 text-sky-950"
                      : "border-amber-500 bg-amber-50/70 text-amber-950"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-stone-900">{msg.senderName}</span>
                    <span className="text-[10px] font-medium text-stone-500">
                      {noticeLabel} ·{" "}
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-[12px] whitespace-pre-wrap leading-relaxed text-stone-700">
                    {msg.message}
                  </p>
                  {msg.imageUrl && (
                    <div className="pt-1">
                      <img
                        src={msg.imageUrl}
                        alt="Evidence"
                        onClick={() => setPreviewPhotoModal(msg.imageUrl || null)}
                        className="w-24 h-24 object-cover rounded-lg border border-stone-200 cursor-pointer hover:opacity-90"
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
                {!isMe && (
                  <span className="text-[11px] font-medium text-stone-500 mb-1 px-1">
                    {msg.senderRole === "ADMIN" ? "CSKH AgriTrace" : msg.senderName}
                  </span>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    isMe
                      ? "bg-emerald-900 text-white rounded-br-sm"
                      : "bg-white text-stone-800 border border-stone-200/80 rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.message}</p>

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
                    className={`text-[10px] mt-1 text-right ${
                      isMe ? "text-emerald-200/80" : "text-stone-400"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips Bar */}
        <div className="px-4 py-2 bg-white border-t border-stone-100 overflow-x-auto flex items-center gap-1.5 shrink-0">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-2.5 py-1 rounded-full bg-stone-50 hover:bg-stone-100 text-stone-700 text-[11px] border border-stone-200 whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-stone-200/80 shrink-0 space-y-2">
          {selectedPhoto && (
            <div className="relative inline-block">
              <img
                src={selectedPhoto}
                alt="Selected"
                className="w-16 h-16 object-cover rounded-xl border border-stone-300"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-stone-900 text-white rounded-full flex items-center justify-center text-xs cursor-pointer"
              >
                ×
              </button>
            </div>
          )}

          {typingUser && (
            <div className="px-1 text-[11px] text-stone-500 italic">
              {typingUser.senderName || (isAdminChannel ? "CSKH AgriTrace" : "Nhà vườn")} đang soạn tin...
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendTyping(false);
              handleSend();
            }}
            className="flex items-center gap-2"
          >
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
              className="p-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors cursor-pointer"
              title="Đính kèm ảnh"
            >
              <ImageIcon size={18} />
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                sendTyping(e.target.value.trim().length > 0);
              }}
              placeholder={
                isAdminChannel
                  ? "Nhắn tin với Tổng đài CSKH..."
                  : "Nhắn tin với Shop..."
              }
              className="flex-1 py-2 px-3.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 bg-stone-50/70"
            />

            <button
              type="submit"
              disabled={isSending || (!inputText.trim() && !selectedPhoto)}
              className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-950 disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              Gửi
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
