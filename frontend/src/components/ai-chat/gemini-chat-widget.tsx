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
      "Xin chào! Tôi là **Trợ lý AI Nông Sản Sạch AgriTrace** (được cung cấp bởi **Google Gemini**). Tôi có thể hỗ trợ bạn tra cứu nguồn gốc lô hàng VietGAP, mẹo bảo quản rau củ tươi lâu, quy trình kho lạnh FEFO hoặc điểm thưởng AgriClub. Bạn cần hỗ trợ thông tin gì ạ?",
    time: "Vừa xong",
  },
];

const SUGGESTIONS = [
  "Lô xà lách thủy canh XL-2026-08 có chứng nhận gì?",
  "Cách bảo quản dâu tây Mộc Châu trong tủ lạnh?",
  "Chính sách tích điểm và thăng hạng AgriClub?",
  "Quy trình kho lạnh FEFO hoạt động như thế nào?",
];

interface GeminiChatWidgetProps {
  className?: string;
  minHeight?: string;
  isFloating?: boolean;
  onClose?: () => void;
}

export function GeminiChatWidget({
  className = "",
  minHeight = "520px",
  isFloating = false,
  onClose,
}: GeminiChatWidgetProps) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(true);
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
      setHasApiKey(true);
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
          setHasApiKey(false);
          setShowSettings(true);
          toast.error("Vui lòng cấu hình Google Gemini API Key để tiếp tục trò chuyện.");
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "⚠️ **Chưa cấu hình API Key**: Bạn cần có một Google Gemini API Key miễn phí từ [Google AI Studio](https://aistudio.google.com/app/apikey). Hãy bấm vào biểu tượng ⚙️ Cài đặt ở góc trên để dán API Key vào nhé!",
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

  // Simple Markdown formatter for bold, code, bullets and newlines
  const formatMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, idx) => {
      // Bold replace
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Bullet point
      if (line.trim().startsWith("- ") || line.trim().startsWith("+ ") || line.trim().startsWith("* ")) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-+*]\s/, "") }}
          />
        );
      }
      return (
        <p
          key={idx}
          className="min-h-[1.2em]"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  return (
    <div
      style={{ minHeight }}
      className={`flex flex-col bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm relative ${className}`}
    >
      {/* ── Chat Header ── */}
      <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-200 text-emerald-950 flex items-center justify-center font-bold shadow-md">
              <Sparkles size={18} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 border-2 border-emerald-950 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight">AgriTrace AI Assistant</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
                Gemini 1.5 Flash
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80">Trợ lý truy xuất nguồn gốc & tư vấn 24/7</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearHistory}
            className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Làm mới đoạn chat"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              showSettings ? "bg-white/20 text-white" : "text-emerald-200 hover:text-white hover:bg-white/10"
            }`}
            title="Cài đặt Gemini API Key"
          >
            <Settings size={15} />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Đóng chat"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Settings Drawer (For API Key) ── */}
      {showSettings && (
        <div className="p-4 bg-emerald-50/80 border-b border-emerald-200 text-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-emerald-950">
              <Key size={14} className="text-emerald-700" />
              <span>Cấu Hình Google Gemini API Key</span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 text-[11px] underline"
            >
              <span>Lấy Key miễn phí</span>
              <ExternalLink size={11} />
            </a>
          </div>

          <p className="text-gray-600 text-[11px] leading-relaxed">
            Dán <strong>Google Gemini API Key</strong> của bạn vào đây (hoặc cấu hình biến <code>GEMINI_API_KEY</code> trong <code>frontend/.env.local</code>). Hoàn toàn miễn phí 100% từ Google.
          </p>

          <form onSubmit={handleSaveKey} className="flex gap-2">
            <input
              type="password"
              value={customKey}
              onChange={(e) => setCustomKey(e.target.value)}
              placeholder="AIzaSy..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs bg-white"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Lưu
            </button>
          </form>
        </div>
      )}

      {/* ── Message Area ── */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fbfdfb]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-200`}
          >
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot size={15} />
              </div>
            )}
            <div
              className={`max-w-[85%] sm:max-w-[78%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                m.role === "user"
                  ? "bg-emerald-700 text-white rounded-br-xs"
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-xs"
              }`}
            >
              <div className="space-y-1">{formatMarkdown(m.content)}</div>
              {m.time && (
                <div
                  className={`text-[10px] mt-1.5 flex justify-end ${
                    m.role === "user" ? "text-emerald-200" : "text-gray-400"
                  }`}
                >
                  {m.time}
                </div>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 shadow-xs">
                <User size={15} />
              </div>
            )}
          </div>
        ))}

        {/* Loading state */}
        {loading && (
          <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
              <Bot size={15} />
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-xs text-xs text-gray-500 shadow-xs flex items-center gap-2">
              <span className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </span>
              <span className="text-[11px] text-gray-400 font-medium">AgriTrace AI đang suy nghĩ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested Questions Pills ── */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 py-2 bg-emerald-50/40 border-t border-emerald-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-emerald-800 font-semibold shrink-0">Gợi ý:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(s)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-emerald-100/60 border border-emerald-200 text-emerald-900 shrink-0 transition-colors cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Chat Input ── */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-white border-t border-gray-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi về VietGAP, cách bảo quản nông sản, quy trình kho..."
          disabled={loading}
          className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white rounded-xl transition-colors cursor-pointer shrink-0"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
