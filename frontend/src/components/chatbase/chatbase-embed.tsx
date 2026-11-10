"use client";

import {
  AlertCircle,
  Bot,
  Check,
  ExternalLink,
  Key,
  MessageSquare,
  RefreshCw,
  Settings,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "@/stores/toast-store";

interface ChatbaseEmbedProps {
  defaultChatbotId?: string;
  className?: string;
  minHeight?: string;
}

export function ChatbaseEmbed({
  defaultChatbotId,
  className = "",
  minHeight = "620px",
}: ChatbaseEmbedProps) {
  const [chatbotId, setChatbotId] = useState<string>("");
  const [inputVal, setInputVal] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);
  const [iframeKey, setIframeKey] = useState(Date.now());

  useEffect(() => {
    const envId = process.env.NEXT_PUBLIC_CHATBASE_CHATBOT_ID?.trim() || "";
    const localId = typeof window !== "undefined" ? localStorage.getItem("agritrace_chatbase_id")?.trim() || "" : "";
    const active = defaultChatbotId || envId || localId;
    setChatbotId(active);
    setInputVal(active);
  }, [defaultChatbotId]);

  const handleSaveId = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim();
    if (!clean) {
      toast.error("Vui lòng nhập Chatbot ID từ Chatbase.");
      return;
    }
    localStorage.setItem("agritrace_chatbase_id", clean);
    setChatbotId(clean);
    setIframeKey(Date.now());
    window.dispatchEvent(new CustomEvent("chatbase_id_updated", { detail: clean }));
    setShowConfig(false);
    toast.success("Đã kết nối Chatbase AI thành công!");
  };

  const handleReset = () => {
    localStorage.removeItem("agritrace_chatbase_id");
    const fallback = process.env.NEXT_PUBLIC_CHATBASE_CHATBOT_ID?.trim() || "";
    setChatbotId(fallback);
    setInputVal(fallback);
    setIframeKey(Date.now());
    window.dispatchEvent(new CustomEvent("chatbase_id_updated", { detail: fallback }));
    toast.info("Đã xóa Chatbot ID tùy chỉnh.");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ── Status Bar & Config Toggle ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl text-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-950 flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            Chatbase AI Assistant (LLM Real-time)
          </span>
          {chatbotId ? (
            <span className="px-2 py-0.5 rounded-md bg-white border border-emerald-300 text-[11px] font-mono text-emerald-800">
              ID: {chatbotId.slice(0, 8)}...{chatbotId.slice(-4)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-medium">
              Chưa nhập Chatbot ID
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {chatbotId && (
            <button
              onClick={() => setIframeKey(Date.now())}
              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tải lại Chatbot"
            >
              <RefreshCw size={13} />
              <span>Tải lại</span>
            </button>
          )}

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-100/60 text-emerald-800 border border-emerald-200 font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings size={13} />
            <span>{showConfig ? "Đóng cài đặt" : "Cấu hình ID"}</span>
          </button>

          <a
            href="https://www.chatbase.co"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium flex items-center gap-1 transition-colors"
          >
            <span>Chatbase.co</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* ── Config Panel (Collapsible or if missing ID) ── */}
      {(showConfig || !chatbotId) && (
        <div className="p-5 bg-white border border-emerald-200 rounded-2xl shadow-sm space-y-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Key size={16} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Cài Đặt Chatbot ID từ Chatbase</h4>
              <p className="text-gray-500 mt-0.5 leading-relaxed">
                Nhập Chatbot ID của bạn tạo trên{" "}
                <a
                  href="https://www.chatbase.co"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-medium underline"
                >
                  Chatbase.co
                </a>{" "}
                để nhúng trợ lý AI trả lời tự động dựa trên tài liệu chuỗi cung ứng nông sản của dự án.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveId} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ví dụ: n-e62a_b5rXwKq9yZa12c"
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs text-gray-800 bg-gray-50/50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Check size={14} />
                <span>Lưu & Kích hoạt</span>
              </button>
              {chatbotId && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors cursor-pointer"
                >
                  Đặt lại
                </button>
              )}
            </div>
          </form>

          {/* Quick guide */}
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 space-y-1">
            <p className="font-semibold text-gray-800 flex items-center gap-1.5">
              <AlertCircle size={13} className="text-emerald-600" />
              Cách lấy Chatbot ID chỉ trong 1 phút:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-gray-500">
              <li>Đăng nhập <a href="https://www.chatbase.co" target="_blank" rel="noreferrer" className="underline text-emerald-700">chatbase.co</a> ➔ Bấm <strong>&quot;New Chatbot&quot;</strong>.</li>
              <li>Upload file tài liệu báo cáo hoặc nhập đường dẫn website nông sản của bạn.</li>
              <li>Vào <strong>Settings</strong> ➔ Sao chép <strong>Chatbot ID</strong> và dán vào ô bên trên (hoặc đặt vào file <code>.env.local</code> với biến <code>NEXT_PUBLIC_CHATBASE_CHATBOT_ID</code>).</li>
            </ol>
          </div>
        </div>
      )}

      {/* ── Live Chatbot Iframe ── */}
      {chatbotId ? (
        <div className="relative rounded-3xl overflow-hidden border border-gray-200 shadow-md bg-white">
          <iframe
            key={iframeKey}
            src={`https://www.chatbase.co/chatbot-iframe/${chatbotId}`}
            title="AgriTrace AI Chatbase Assistant"
            width="100%"
            style={{ height: "100%", minHeight }}
            className="border-0 w-full"
            allow="microphone"
          />
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl border-2 border-dashed border-gray-200 bg-white space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bot size={28} />
          </div>
          <h3 className="font-bold text-gray-800 text-base">Chưa kết nối Chatbase AI</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Vui lòng dán <strong>Chatbot ID</strong> từ tài khoản Chatbase của bạn vào khung cài đặt phía trên để kích hoạt trợ lý AI thông minh trên toàn hệ thống.
          </p>
        </div>
      )}
    </div>
  );
}
