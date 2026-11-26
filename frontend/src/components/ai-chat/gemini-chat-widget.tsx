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

interface ActionLink {
  label: string;
  url: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

const CHAT_STORAGE_KEY = "agritrace_ai_chat_history_v2";

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
      "Xin chào! Tôi là **Trợ lý AI AgriTrace**. Tôi theo dõi liên tục giá bán thực tế, tiêu chuẩn VietGAP và chuỗi lạnh trực tiếp trên hệ thống:\n\n- 🍓 **Dâu tây New Zealand Mộc Châu**: **170.100 đ / Hộp 500g** (Đang trợ giá -19%, gốc 210.000 đ)\n- 🍊 **Cam sành Hàm Yên tép vàng**: **45.000 đ / KG** (Giảm 18%, gốc 55.000 đ)\n- 🥬 **Xà lách thủy canh & Cải Kale**: **33.600 đ – 60.000 đ / KG** (Trợ giá vụ mùa -20%)\n- 🥑 **Bơ sáp 034 Cao Nguyên**: **74.700 đ / KG** (Xả kho cuối vụ -17%, gốc 90.000 đ)\n- 📜 **Chứng nhận an toàn**: VietGAP / GlobalGAP, kiểm định Quatest BVTV = 0\n\nBạn muốn tìm hiểu loại nông sản nào, công thức món ngon hay đặt mua hôm nay ạ?\n\n[[ACTION: ⚡ Mua Ngay Dâu Tây (170.100đ) | /products?search=Dâu+Tây&buy=LOT-DT-2026-11]]\n[[ACTION: ⚡ Mua Ngay Cam Sành (45.000đ) | /products?search=Cam+Sành&buy=SP-CS-03]]\n[[ACTION: 🥬 Mua Rau Củ Thủy Canh | /products?cat=rau_la]]\n[[ACTION: 🔍 Tra Cứu Lô Dâu Tây LOT-DT-2026-11 | /traceability?batch=LOT-DT-2026-11]]\n[[ACTION: 🎁 Ví Voucher & Điểm Thưởng | /dashboard/customer?tab=vouchers]]",
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
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-[#16261E]">$1</strong>');
      if (line.trim().startsWith("- ") || line.trim().startsWith("+ ") || line.trim().startsWith("* ")) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-1 my-1">
            <span className="text-emerald-700 text-xs mt-0.5">•</span>
            <span
              className="flex-1 text-[12px] leading-relaxed text-[#1E2923]"
              dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-+*]\s/, "") }}
            />
          </div>
        );
      }
      return (
        <p
          key={idx}
          className="min-h-[1.25em] text-[12px] leading-relaxed text-[#1E2923]"
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
      {/* ── Chat Header (Botanical Forest Luxury) ── */}
      <div className="px-4 py-3.5 bg-[#16261E] text-white flex items-center justify-between border-b border-emerald-950 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-800/80 border border-emerald-600/50 text-emerald-200 flex items-center justify-center font-bold shadow-xs">
              <Bot size={17} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#16261E] rounded-full animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs tracking-tight text-white truncate">AgriTrace AI</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                Trực tuyến 24/7
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/70 truncate">Tư vấn nông sản sạch & Chuỗi lạnh VietGAP</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Xóa lịch sử & Làm mới đoạn chat"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
              showSettings ? "bg-white/20 text-white" : "text-emerald-300/80 hover:text-white hover:bg-white/10"
            }`}
            title="Cài đặt API Key"
          >
            <Settings size={14} />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-300/80 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer ml-0.5"
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
                className={`max-w-[88%] p-3.5 rounded-2xl text-[12px] leading-relaxed shadow-2xs ${
                  m.role === "user"
                    ? "bg-[#16261E] text-white rounded-tr-xs font-medium"
                    : "bg-white text-[#16261E] border border-[#EBE7DF] rounded-tl-xs"
                }`}
              >
                <div className="space-y-1">{formatMarkdown(cleanText)}</div>

                {/* ── Interactive Action Buttons Generated by AI ── */}
                {isAssistant && actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-[#EBE7DF] space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-emerald-700" />
                      <span>Thao tác nhanh:</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActionClick(act.url)}
                          className="w-full text-left px-3 py-2 rounded-xl bg-[#F8F6F0] hover:bg-emerald-50 border border-[#E5E0D5] hover:border-emerald-400 text-[#16261E] hover:text-emerald-900 font-bold text-[11px] flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer group"
                        >
                          <span className="truncate">{act.label}</span>
                          <span className="w-5 h-5 rounded-lg bg-[#16261E] group-hover:bg-emerald-800 text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                            <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {m.time && (
                  <div
                    className={`text-[9px] mt-1.5 text-right select-none ${
                      m.role === "user" ? "text-emerald-200/80" : "text-gray-400"
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
        <div className="px-3 py-2 bg-[#F4F1EA] border-t border-[#E8E4DC] flex items-center gap-1.5 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="text-[10px] text-emerald-900 font-bold shrink-0">Hỏi nhanh:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-emerald-50 active:scale-95 border border-[#DDD8CE] hover:border-emerald-300 text-gray-700 hover:text-emerald-900 shrink-0 font-medium transition-all shadow-2xs cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat Input Bar (Sleek Botanical) ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-[#EBE7DF] flex items-center gap-2 shrink-0"
      >
        <div className="flex-1 flex items-center bg-[#F4F1EA] focus-within:bg-white border border-transparent focus-within:border-emerald-600 rounded-full px-4 py-2 transition-all shadow-2xs">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về giá nông sản, VietGAP, công thức món ngon..."
            disabled={loading}
            className="w-full text-xs bg-transparent focus:outline-none text-[#16261E] placeholder:text-gray-400 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-9 h-9 flex items-center justify-center bg-[#16261E] hover:bg-emerald-800 active:scale-95 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-2xs shrink-0 cursor-pointer"
        >
          <Send size={13} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
