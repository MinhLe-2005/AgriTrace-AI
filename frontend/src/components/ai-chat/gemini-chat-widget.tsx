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
      "Xin chào! Tôi là **Trợ lý AI AgriTrace** (Google Gemini). Tôi có thể tư vấn nông sản theo mùa, quy trình VietGAP, kiểm tra tem QR và đưa bạn đến thẳng trang mua hàng:\n\n- 🍓 **Dâu tây New Zealand Mộc Châu** rộ mùa đông xuân (180.000 đ/hộp)\n- 🍊 **Cam sành Hàm Yên** tép vàng mọng nước (45.000 đ/kg)\n- 🥬 **Xà lách thủy canh & Cải Kale** hái mới 05:30 sáng nay\n- 📜 **Chứng nhận an toàn VietGAP/GlobalGAP** kiểm định Quatest BVTV = 0\n\nBạn muốn tìm hiểu hoặc đặt mua sản phẩm nào hôm nay ạ?\n\n[[ACTION: 🍓 Đặt Mua Dâu Tây Mộc Châu | /products?search=Dâu+Tây]]\n[[ACTION: 🍊 Đặt Mua Cam Sành Hàm Yên | /products?search=Cam+Sành]]\n[[ACTION: 🥬 Mua Rau Củ Thủy Canh | /products?cat=rau_la]]\n[[ACTION: 🔍 Tra Cứu Lô Xà Lách XL-2026-08 | /traceability?batch=LOT-XL-2026-08]]\n[[ACTION: 🎁 Ví Voucher & Điểm Thưởng | /dashboard/customer?tab=vouchers]]",
    time: "Vừa xong",
  },
];

const SUGGESTIONS = [
  "🍓 Dâu tây mùa này ngon không? Mua ở đâu?",
  "🍊 Cam sành Hàm Yên giá bao nhiêu?",
  "🥬 Xà lách thủy canh có an toàn không?",
  "🔍 Tra cứu nguồn gốc lô dâu tây DT-MC?",
  "🎁 Đổi điểm AgriClub lấy voucher gì?",
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleActionClick = (url: string) => {
    toast.success("Đang chuyển trang...");
    router.push(url);
    if (isFloating && onClose) {
      // Optional auto-close on navigation if desired
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("agritrace_gemini_api_key")?.trim() || "";
      setCustomKey(savedKey);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "NO_API_KEY") {
          setShowSettings(true);
          toast.error("Vui lòng cấu hình Google Gemini API Key.");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "⚠️ **Chưa cấu hình API Key**: Bạn cần có một Google Gemini API Key từ [Google AI Studio](https://aistudio.google.com/app/apikey). Hãy bấm vào biểu tượng ⚙️ Cài đặt ở góc trên để dán API Key vào nhé!",
              time: now,
            },
          ]);
          return;
        }
        throw new Error(data.message || "Lỗi khi gọi Gemini API");
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

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
    toast.info("Đã làm mới cuộc hội thoại.");
  };

  const formatMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>');
      if (line.trim().startsWith("- ") || line.trim().startsWith("+ ") || line.trim().startsWith("* ")) {
        return (
          <div key={idx} className="flex items-start gap-1.5 ml-1 my-0.5">
            <span className="text-emerald-600 text-xs mt-0.5">•</span>
            <span
              className="flex-1 text-[12px] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-+*]\s/, "") }}
            />
          </div>
        );
      }
      return (
        <p
          key={idx}
          className="min-h-[1.2em] text-[12px] leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div
      style={minHeight ? { minHeight } : undefined}
      className={`flex flex-col h-full w-full bg-white overflow-hidden relative ${className}`}
    >
      {/* ── Chat Header (Gleaming Emerald Gradient) ── */}
      <div className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-200 text-emerald-950 flex items-center justify-center font-bold shadow-sm ring-2 ring-emerald-500/30">
              <Sparkles size={16} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-900 rounded-full animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs tracking-tight text-white truncate">AgriTrace AI</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 shrink-0">
                Gemini
              </span>
            </div>
            <p className="text-[10px] text-emerald-200/80 truncate">Tư vấn nông sản sạch & VietGAP 24/7</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            title="Làm mới đoạn chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer ${
              showSettings ? "bg-white/20 text-white" : "text-emerald-200 hover:text-white hover:bg-white/10"
            }`}
            title="Cài đặt API Key"
          >
            <Settings size={14} />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer ml-0.5"
              title="Đóng chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Settings Drawer (For API Key) ── */}
      {showSettings && (
        <div className="p-3 bg-emerald-50/95 border-b border-emerald-200 text-xs space-y-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Key size={12} className="text-emerald-700" /> Cấu Hình API Key
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
              placeholder="Dán key AIzaSy... (hoặc để trống dùng .env)"
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px] bg-white shadow-xs"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-[11px] transition-colors cursor-pointer shrink-0"
            >
              Lưu
            </button>
          </form>
        </div>
      )}

      {/* ── Message Area (flex-1 with min-h-0 allows proper scrolling) ── */}
      <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 bg-gradient-to-b from-[#f8faf8] to-[#f4f7f4]">
        {messages.map((m, i) => {
          const isAssistant = m.role === "assistant";
          const { cleanText, actions } = isAssistant ? parseMessageContent(m.content) : { cleanText: m.content, actions: [] };

          return (
            <div
              key={i}
              className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
            >
              {isAssistant && (
                <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <Bot size={13} />
                </div>
              )}
              <div
                className={`max-w-[88%] p-3 rounded-2xl text-[12px] leading-relaxed shadow-xs ${
                  m.role === "user"
                    ? "bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-tr-xs font-medium"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs"
                }`}
              >
                <div className="space-y-1">{formatMarkdown(cleanText)}</div>

                {/* ── Interactive Action Buttons Generated by AI ── */}
                {isAssistant && actions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-emerald-100/80 space-y-1.5">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles size={11} className="text-emerald-600" />
                      <span>Thao tác nhanh:</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {actions.map((act, aIdx) => (
                        <button
                          key={aIdx}
                          type="button"
                          onClick={() => handleActionClick(act.url)}
                          className="w-full text-left px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 text-emerald-950 font-bold text-[11px] flex items-center justify-between gap-2 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer group"
                        >
                          <span className="truncate">{act.label}</span>
                          <span className="w-5 h-5 rounded-lg bg-emerald-700 group-hover:bg-emerald-800 text-white flex items-center justify-center shrink-0 transition-colors shadow-2xs">
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
                      m.role === "user" ? "text-emerald-100/90" : "text-gray-400"
                    }`}
                  >
                    {m.time}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading state */}
        {loading && (
          <div className="flex gap-2 justify-start animate-in fade-in duration-150">
            <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={13} />
            </div>
            <div className="bg-white border border-gray-200 p-2.5 rounded-2xl rounded-tl-xs text-xs text-gray-500 shadow-xs flex items-center gap-2">
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-[11px] text-gray-400">AgriTrace AI đang suy nghĩ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested Quick Questions (Hidden scrollbar, sleek pills) ── */}
      {messages.length <= 2 && !loading && (
        <div className="px-3 py-2 bg-emerald-50/60 border-t border-emerald-100/60 flex items-center gap-1.5 overflow-x-auto shrink-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <span className="text-[10px] text-emerald-800 font-bold shrink-0">Hỏi nhanh:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[10px] px-2.5 py-1 rounded-full bg-white hover:bg-emerald-100/70 active:scale-95 border border-emerald-200/90 text-emerald-900 shrink-0 font-medium transition-all shadow-2xs cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat Input Bar (Modern pill container) ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
      >
        <div className="flex-1 flex items-center bg-gray-100/80 hover:bg-gray-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/25 border border-transparent focus-within:border-emerald-500 rounded-full px-3.5 py-1.5 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hỏi về VietGAP, bảo quản rau, kho lạnh..."
            disabled={loading}
            className="w-full text-xs bg-transparent focus:outline-none text-slate-800 placeholder-slate-400 disabled:opacity-50"
          />
        </div>
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="w-8 h-8 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-full transition-all shadow-xs shrink-0 cursor-pointer"
        >
          <Send size={13} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
