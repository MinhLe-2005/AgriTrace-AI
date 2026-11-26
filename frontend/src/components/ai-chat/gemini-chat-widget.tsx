"use client";

import {
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  ExternalLink,
  Key,
  MessageSquare,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
  Trash2,
  User,
  X,
  ShoppingBag,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

interface ActionLink {
  label: string;
  url: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

const CHAT_STORAGE_KEY = "agritrace_ai_chat_history_v4";

function parseMessageContent(raw: string): { cleanText: string; actions: ActionLink[] } {
  const actions: ActionLink[] = [];
  const regex = /\[\[ACTION:\s*(.*?)\s*\|\s*(.*?)\s*\]\]/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    if (match[1] && match[2]) {
      actions.push({ label: match[1].trim(), url: match[2].trim() });
    }
  }
  const cleanText = raw.replace(regex, "").trim();
  return { cleanText, actions };
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Xin chào! Tôi là **Trợ lý AI Nông Sản AgriTrace**.\nTôi đồng hành cùng bạn 24/7 để cập nhật liên tục giá bán tại vườn, tiêu chuẩn an toàn VietGAP và trạng thái bảo quản chuỗi lạnh:\n\n- 🍓 **Dâu tây New Zealand Mộc Châu**: **170.100 đ** / Hộp 500g *(Trợ giá -19%, gốc 210.000 đ)*\n- 🍊 **Cam sành Hàm Yên tép vàng**: **45.000 đ** / KG *(Giảm -18%, gốc 55.000 đ)*\n- 🥬 **Xà lách thủy canh & Cải Kale**: **33.600 đ – 60.000 đ** / KG *(Vụ mùa tươi mới)*\n- 🥑 **Bơ sáp 034 Cao Nguyên**: **74.700 đ** / KG *(Xả kho -17%, gốc 90.000 đ)*\n- 📜 **Cam kết an toàn**: 100% chứng nhận VietGAP / GlobalGAP, kiểm định Quatest dư lượng BVTV = 0\n\nBạn muốn tìm hiểu thêm về loại nông sản nào, công thức món ngon hay đặt mua giao xe lạnh hôm nay ạ?\n\n[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n[[ACTION: 🥬 Mua Rau Củ Thủy Canh | /products?cat=rau_la]]\n[[ACTION: 🔍 Tra Cứu Lô Dâu Tây LOT-DT-2026-11 | /traceability?batch=LOT-DT-2026-11]]\n[[ACTION: 🎁 Ví Voucher & Điểm Thưởng | /dashboard/customer?tab=vouchers]]",
    time: "Vừa xong",
  },
];

const SUGGESTIONS = [
  "🍓 Dâu tây Mộc Châu giá bao nhiêu?",
  "🍳 Gợi ý thực đơn món ngon từ rau củ?",
  "❄️ Cách bảo quản dâu tây trong tủ lạnh?",
  "🥬 Xà lách thủy canh có an toàn không?",
  "🎁 Áp mã freeship xe lạnh như thế nào?",
];

interface GeminiChatWidgetProps {
  className?: string;
  minHeight?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

export function GeminiChatWidget({
  className = "",
  minHeight,
  isFloating = false,
  onClose,
}: GeminiChatWidgetProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Load saved messages & custom API Key from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedKey = localStorage.getItem("agritrace_gemini_api_key")?.trim() || "";
        if (savedKey) setCustomKey(savedKey);

        const savedHistory = localStorage.getItem(CHAT_STORAGE_KEY);
        if (savedHistory) {
          const parsed = JSON.parse(savedHistory);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (e) {
        console.error("Error reading chat history:", e);
      } finally {
        setIsClientLoaded(true);
      }
    }
  }, []);

  // 2. Persist messages to localStorage whenever messages change
  useEffect(() => {
    if (isClientLoaded && typeof window !== "undefined" && messages.length > 0) {
      try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error("Error saving chat history:", e);
      }
    }
  }, [messages, isClientLoaded]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleActionClick = (url: string) => {
    toast.success("Đang mở sản phẩm & cửa sổ đặt mua...");
    const targetUrl =
      url.includes("buy=") || url.includes("detail=")
        ? `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`
        : url;
    router.push(targetUrl);
    if (isFloating && onClose) {
      onClose();
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customKey.trim();
    if (!clean) {
      localStorage.removeItem("agritrace_gemini_api_key");
      setCustomKey("");
      toast.info("Đã xóa API Key tùy chỉnh. Hệ thống sẽ sử dụng key từ tệp .env.local.");
    } else {
      localStorage.setItem("agritrace_gemini_api_key", clean);
      setCustomKey(clean);
      toast.success("Đã lưu Google Gemini API Key thành công!");
    }
    setShowSettings(false);
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(CHAT_STORAGE_KEY);
      } catch {}
    }
    toast.info("Đã làm mới cuộc hội thoại.");
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const userMsg: Message = { role: "user", content: text, time: now };
    const newHistory = [...messages, userMsg];

    setMessages(newHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          apiKey: customKey || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error(`Máy chủ AI phản hồi mã lỗi ${res.status}`);
      }

      const data = await res.json();
      if (!data.reply) {
        throw new Error("Không nhận được câu trả lời từ AI.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply,
          time: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đã có lỗi xảy ra";
      console.error("Gemini Chat Error:", err);
      toast.error(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "❌ Không thể hoàn thành câu trả lời: " + msg + ". Vui lòng thử lại sau.",
          time: now,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const formattedLine = line
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>')
        .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-mono border border-emerald-200">$1</code>');
      if (line.trim().startsWith("- ") || line.trim().startsWith("+ ") || line.trim().startsWith("* ")) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-1 my-1">
            <span className="text-emerald-600 text-xs mt-0.5 shrink-0">✦</span>
            <span
              className="flex-1 text-[12.5px] leading-relaxed text-stone-800"
              dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-+*]\s/, "") }}
            />
          </div>
        );
      }
      return (
        <p
          key={idx}
          className="min-h-[1.25em] text-[12.5px] leading-relaxed text-stone-800"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div
      style={minHeight ? { minHeight } : undefined}
      className={`flex flex-col h-full w-full bg-[#FBF9F5] overflow-hidden relative ${className}`}
    >
      {/* ── Chat Header (Modern Botanical Luxury Concierge) ── */}
      <div className="px-4 py-3.5 bg-gradient-to-r from-[#072016] via-[#0E3326] to-[#0A261D] text-white flex items-center justify-between border-b border-emerald-900/60 shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 border border-emerald-300/40 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-950/40">
              <Sparkles size={17} className="text-amber-300 fill-amber-300" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-[#0A261D] rounded-full animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs tracking-tight text-white font-serif truncate">AgriTrace AI Concierge</h3>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                Trực tuyến 24/7
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/80 truncate">Tư vấn nông sản sạch & Chuỗi lạnh 24/7</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-xl text-emerald-300/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Xóa lịch sử & Làm mới đoạn chat"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-xl active:scale-95 transition-all cursor-pointer ${
              showSettings ? "bg-white/20 text-white" : "text-emerald-300/80 hover:text-white hover:bg-white/10"
            }`}
            title="Cài đặt API Key"
          >
            <Settings size={14} />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-emerald-300/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer ml-0.5"
              title="Đóng cửa sổ"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Settings Drawer (For API Key) ── */}
      {showSettings && (
        <div className="p-3 bg-white border-b border-[#EBE7DF] text-xs space-y-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Key size={12} className="text-emerald-700" /> Cấu Hình Google Gemini API Key
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5"
            >
              Lấy Key miễn phí <ExternalLink size={10} />
            </a>
          </div>

          <form onSubmit={handleSaveKey} className="flex gap-1.5">
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="Dán key AIzaSy... (hoặc để trống dùng mặc định)"
              className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:border-emerald-600 font-mono text-[11px] bg-white shadow-2xs"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-[#16261E] hover:bg-emerald-800 text-white font-bold rounded-lg text-[11px] transition-colors cursor-pointer shrink-0 shadow-2xs"
            >
              Lưu
            </button>
          </form>
        </div>
      )}

      {/* ── Message Area (Gentle on the eyes, warm botanical tones) ── */}
      <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 bg-[#FBF9F5]">
        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          const { cleanText, actions } = isAssistant ? parseMessageContent(m.content) : { cleanText: m.content, actions: [] };

          return (
            <div
              key={i}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
            >
              {isAssistant && (
                <div className="w-6 h-6 rounded-lg bg-[#16261E] text-emerald-300 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot size={13} />
                </div>
              )}
              <div
                className={`max-w-[88%] p-3.5 rounded-2xl text-[12.5px] leading-relaxed shadow-sm ${
                  m.role === "user"
                    ? "bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-tr-xs font-medium border border-emerald-700/50"
                    : "bg-white text-stone-900 border border-stone-200/90 rounded-tl-xs shadow-2xs"
                }`}
              >
                <div className="space-y-1.5">{formatMarkdown(cleanText)}</div>

                {/* ── Interactive Action Buttons (Sleek Modern 2-Column Grid) ── */}
                {isAssistant && actions.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-stone-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-extrabold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={11} className="text-amber-500 fill-amber-400" />
                        <span>Thao tác nhanh tiện ích:</span>
                      </div>
                      <span className="text-[9px] text-stone-400 font-medium">Bấm để đặt hoặc tra cứu</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {actions.map((act, aIdx) => {
                        const isTraCuu = act.label.toLowerCase().includes("tra cứu") || act.label.toLowerCase().includes("lô") || act.label.toLowerCase().includes("nhật ký");
                        const isVoucher = act.label.toLowerCase().includes("voucher") || act.label.toLowerCase().includes("điểm") || act.label.toLowerCase().includes("ví");
                        const isDauTay = act.label.toLowerCase().includes("dâu");
                        const isCam = act.label.toLowerCase().includes("cam");
                        const isRau = act.label.toLowerCase().includes("rau") || act.label.toLowerCase().includes("cải") || act.label.toLowerCase().includes("thủy canh");

                        let cardStyle = "bg-white border-stone-200/90 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-900 shadow-2xs";
                        let icon = "⚡";
                        let iconBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                        let tagBadge = "Chuẩn VietGAP";
                        let tagBadgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";

                        if (isTraCuu) {
                          cardStyle = "bg-gradient-to-br from-cyan-50/90 via-white to-sky-50/40 border-cyan-200/90 hover:border-cyan-500 hover:shadow-xs text-stone-900 shadow-2xs";
                          icon = "🔍";
                          iconBg = "bg-cyan-100 text-cyan-800 border-cyan-200";
                          tagBadge = "Minh bạch KCS";
                          tagBadgeStyle = "bg-cyan-50 text-cyan-800 border-cyan-200";
                        } else if (isVoucher) {
                          cardStyle = "bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/40 border-purple-200/90 hover:border-purple-500 hover:shadow-xs text-stone-900 shadow-2xs col-span-1 sm:col-span-2";
                          icon = "🎁";
                          iconBg = "bg-purple-100 text-purple-800 border-purple-200";
                          tagBadge = "Đặc quyền VIP";
                          tagBadgeStyle = "bg-purple-50 text-purple-800 border-purple-200";
                        } else if (isDauTay) {
                          cardStyle = "bg-gradient-to-br from-rose-50/90 via-white to-pink-50/40 border-rose-200/90 hover:border-rose-400 hover:shadow-xs text-stone-900 shadow-2xs";
                          icon = "🍓";
                          iconBg = "bg-rose-100 text-rose-800 border-rose-200";
                          tagBadge = "Trợ giá -19%";
                          tagBadgeStyle = "bg-rose-50 text-rose-800 border-rose-200";
                        } else if (isCam) {
                          cardStyle = "bg-gradient-to-br from-amber-50/90 via-white to-orange-50/40 border-amber-200/90 hover:border-amber-400 hover:shadow-xs text-stone-900 shadow-2xs";
                          icon = "🍊";
                          iconBg = "bg-amber-100 text-amber-800 border-amber-200";
                          tagBadge = "Giảm -18%";
                          tagBadgeStyle = "bg-amber-50 text-amber-800 border-amber-200";
                        } else if (isRau) {
                          cardStyle = "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 border-emerald-200/90 hover:border-emerald-400 hover:shadow-xs text-stone-900 shadow-2xs";
                          icon = "🥬";
                          iconBg = "bg-emerald-100 text-emerald-800 border-emerald-200";
                          tagBadge = "Vụ mùa tươi";
                          tagBadgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-200";
                        }

                        const priceMatch = act.label.match(/\(([^)]+)\)/);
                        const price = priceMatch ? priceMatch[1] : null;

                        let displayTitle = act.label
                          .replace(/^[⚡🥦🥬🔍🎁\s]+/, "")
                          .replace(/\([^)]+\)/, "")
                          .replace(/^(Mua Ngay|Mua)\s*/i, "")
                          .trim();

                        if (isTraCuu) displayTitle = "Tra Cứu Lô Nông Sản";
                        else if (isVoucher) displayTitle = "Ví Voucher & Điểm VIP";
                        else if (isDauTay) displayTitle = "Dâu Tây Mộc Châu";
                        else if (isCam) displayTitle = "Cam Sành Hàm Yên";
                        else if (isRau) displayTitle = "Rau Củ Thủy Canh";

                        // If Voucher (full-width row layout)
                        if (isVoucher) {
                          return (
                            <button
                              key={aIdx}
                              type="button"
                              onClick={() => handleActionClick(act.url)}
                              className={cn(
                                "text-left p-2.5 rounded-2xl border transition-all cursor-pointer group active:scale-[0.98] flex items-center justify-between gap-2.5 hover:shadow-xs col-span-1 sm:col-span-2",
                                cardStyle
                              )}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base shadow-2xs border transition-transform group-hover:scale-105", iconBg)}>
                                  {icon}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-[11.5px] text-stone-900 group-hover:text-purple-950 whitespace-nowrap">
                                      {displayTitle}
                                    </span>
                                    <span className={cn("text-[8.5px] font-bold px-1.5 py-0.2 rounded border shrink-0 whitespace-nowrap", tagBadgeStyle)}>
                                      AgriClub
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-purple-800 mt-0.5 whitespace-nowrap font-medium">
                                    Đổi voucher giảm giá & quà VIP
                                  </p>
                                </div>
                              </div>
                              <span className="px-2.5 py-1 rounded-xl bg-purple-900 text-white group-hover:bg-purple-950 text-[10px] font-bold flex items-center gap-1 shrink-0 transition-colors shadow-2xs">
                                Mở ví <ArrowRight size={10} />
                              </span>
                            </button>
                          );
                        }

                        // 2-column vertical card layout for products and lookup
                        return (
                          <button
                            key={aIdx}
                            type="button"
                            onClick={() => handleActionClick(act.url)}
                            className={cn(
                              "text-left p-2.5 rounded-2xl border transition-all cursor-pointer group active:scale-[0.98] flex flex-col justify-between hover:shadow-xs",
                              cardStyle
                            )}
                          >
                            <div className="flex items-center justify-between w-full mb-2">
                              <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm shadow-2xs border transition-transform group-hover:scale-105", iconBg)}>
                                {icon}
                              </div>
                              <span className={cn("text-[8.5px] font-bold px-1.5 py-0.5 rounded border tracking-tight", tagBadgeStyle)}>
                                {tagBadge}
                              </span>
                            </div>

                            <div>
                              <div className="font-bold text-[11px] text-stone-900 group-hover:text-emerald-950 leading-tight">
                                {displayTitle}
                              </div>
                              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200/60">
                                <span className="text-[10.5px] font-extrabold text-emerald-800">
                                  {price || (isTraCuu ? "LOT-DT-2026-11" : "VietGAP")}
                                </span>
                                <span className="text-[9px] font-bold text-emerald-700 group-hover:text-emerald-900 flex items-center gap-0.5">
                                  {price ? "Mua" : "Xem"} <ArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {m.time && (
                  <div
                    className={`text-[9px] mt-1.5 text-right select-none ${
                      m.role === "user" ? "text-emerald-200/80" : "text-stone-400"
                    }`}
                  >
                    {m.time}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 shadow-xs mt-0.5 font-bold text-[10px]">
                  Bạn
                </div>
              )}
            </div>
          );
        })}

        {/* Loading state */}
        {loading && (
          <div className="flex gap-2 justify-start animate-in fade-in duration-150">
            <div className="w-6 h-6 rounded-lg bg-[#16261E] text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={13} />
            </div>
            <div className="bg-white border border-[#EBE7DF] p-3 rounded-2xl rounded-tl-xs text-xs text-gray-500 shadow-2xs flex items-center gap-2">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-[11px] text-gray-500 font-medium">AgriTrace AI đang tra cứu dữ liệu...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested Quick Questions ── */}
      {messages.length <= 2 && !loading && (
        <div className="px-3.5 py-2.5 bg-stone-100/90 border-t border-stone-200 flex items-center gap-2 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="text-[11px] text-emerald-950 font-extrabold shrink-0 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500 fill-amber-400" /> Hỏi nhanh:
          </span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] px-3 py-1 rounded-full bg-white hover:bg-emerald-50 active:scale-95 border border-stone-300/80 hover:border-emerald-500 text-stone-800 hover:text-emerald-950 shrink-0 font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat Input Bar (Modern Floating Luxe Input) ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-stone-200/90 flex items-center gap-2.5 shrink-0 shadow-xs"
      >
        <div className="flex-1 flex items-center bg-stone-50 focus-within:bg-white border-2 border-stone-200 focus-within:border-emerald-600 rounded-2xl px-3.5 py-2 transition-all shadow-inner focus-within:ring-2 focus-within:ring-emerald-500/20">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi giá nông sản, chuẩn VietGAP, công thức..."
            disabled={loading}
            className="w-full text-xs bg-transparent focus:outline-none text-stone-900 placeholder:text-stone-400 disabled:opacity-50 font-normal"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 active:scale-95 disabled:bg-stone-200 disabled:from-stone-200 disabled:to-stone-200 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-md hover:shadow-lg shrink-0 cursor-pointer"
          title="Gửi câu hỏi"
        >
          <Send size={14} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
