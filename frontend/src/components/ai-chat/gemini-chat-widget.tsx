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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "@/stores/toast-store";

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Xin chào! Tôi là **Trợ lý AI AgriTrace** (Google Gemini). Tôi có thể hỗ trợ bạn:\n\n- 🥬 Tra cứu nguồn gốc lô xà lách, dâu tây, cam sành...\n- 📜 Kiểm tra chứng nhận VietGAP, GlobalGAP\n- ❄️ Quy trình bảo quản kho lạnh FEFO\n- 🎁 Tích điểm & đổi voucher AgriClub\n\nBạn cần hỏi về nội dung nào?",
    time: "Vừa xong",
  },
];

const SUGGESTIONS = [
  "Lô xà lách XL-2026-08?",
  "Bảo quản dâu tây tủ lạnh?",
  "Tích điểm AgriClub?",
  "Quy trình kho FEFO?",
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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load custom key from localStorage on mount
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
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      if (line.trim().startsWith("- ") || line.trim().startsWith("+ ") || line.trim().startsWith("* ")) {
        return (
          <li
            key={idx}
            className="ml-3 list-disc"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-+*]\s/, "") }}
          />
        );
      }
      return (
        <p
          key={idx}
          className="min-h-[1.15em] leading-relaxed"
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
      {/* ── Chat Header (Clean, professional, high contrast) ── */}
      <div className="px-3.5 py-3 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-white text-emerald-800 flex items-center justify-center font-bold shadow-xs">
              <Bot size={18} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-800 rounded-full animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-xs truncate">Trợ Lý AI AgriTrace</h3>
              <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/40 text-emerald-100 shrink-0">
                Gemini
              </span>
            </div>
            <p className="text-[10px] text-emerald-100/80 truncate">Tư vấn VietGAP & nông sản sạch 24/7</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Làm mới đoạn chat"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              showSettings ? "bg-white/20 text-white" : "text-emerald-200 hover:text-white hover:bg-white/10"
            }`}
            title="Cài đặt API Key"
          >
            <Settings size={14} />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Settings Drawer (For API Key) ── */}
      {showSettings && (
        <div className="p-3 bg-emerald-50/90 border-b border-emerald-200 text-xs space-y-2 shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
            <span className="flex items-center gap-1.5">
              <Key size={13} className="text-emerald-700" /> Cấu Hình API Key
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-900 underline flex items-center gap-0.5"
            >
              Lấy Key <ExternalLink size={10} />
            </a>
          </div>

          <form onSubmit={handleSaveKey} className="flex gap-1.5">
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="Dán key AIzaSy... (hoặc để trống dùng .env)"
              className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono text-[11px] bg-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              Lưu
            </button>
          </form>
        </div>
      )}

      {/* ── Message Area (flex-1 with min-h-0 allows proper scrolling!) ── */}
      <div className="flex-1 min-h-0 p-3.5 overflow-y-auto space-y-3 bg-[#f8faf8]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-150`}
          >
            {m.role === "assistant" && (
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Bot size={13} />
              </div>
            )}
            <div
              className={`max-w-[84%] p-2.5 sm:p-3 rounded-2xl text-[12px] leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-emerald-600 text-white rounded-br-xs font-medium"
                  : "bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs"
              }`}
            >
              <div className="space-y-1">{formatMarkdown(m.content)}</div>
              {m.time && (
                <div
                  className={`text-[9px] mt-1 text-right ${
                    m.role === "user" ? "text-emerald-100" : "text-gray-400"
                  }`}
                >
                  {m.time}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <User size={13} />
              </div>
            )}
          </div>
        ))}

        {/* Loading state */}
        {loading && (
          <div className="flex gap-2 justify-start animate-in fade-in duration-150">
            <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={13} />
            </div>
            <div className="bg-white border border-gray-200 p-2.5 rounded-2xl rounded-bl-xs text-xs text-gray-500 shadow-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-[11px] text-gray-400">AgriTrace AI đang trả lời...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested Quick Questions ── */}
      {messages.length <= 2 && !loading && (
        <div className="px-3 py-1.5 bg-emerald-50/50 border-t border-emerald-100/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-emerald-800 font-bold shrink-0">Hỏi nhanh:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[10px] px-2 py-0.5 rounded-full bg-white hover:bg-emerald-100 border border-emerald-200 text-emerald-900 shrink-0 transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat Input Bar ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-2.5 bg-white border-t border-gray-200 flex items-center gap-1.5 shrink-0"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về VietGAP, bảo quản rau, kho lạnh..."
          disabled={loading}
          className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-gray-50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
