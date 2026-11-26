"use client";

import { Bot, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GeminiChatWidget } from "./gemini-chat-widget";

export function GeminiFloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none">
      {/* ── Chat Window Dialog ── */}
      {isOpen && (
        <div
          style={{
            width: "390px",
            maxWidth: "calc(100vw - 28px)",
            height: "590px",
            maxHeight: "calc(100vh - 80px)",
          }}
          className="bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(22,38,30,0.35)] border border-[#E2DDD3] overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-250 ring-1 ring-black/5"
        >
          <GeminiChatWidget
            isFloating
            onClose={() => setIsOpen(false)}
            className="h-full w-full rounded-none border-0"
          />
        </div>
      )}

      {/* ── Trigger Floating Button (Chỉ hiển thị khi khung chat đang đóng) ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="pointer-events-auto group relative flex items-center gap-2.5 px-4 py-3 bg-[#16261E] hover:bg-emerald-900 text-white rounded-full shadow-[0_10px_30px_-5px_rgba(22,38,30,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-emerald-700/60"
          title="Trợ lý AI Nông Sản AgriTrace"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-emerald-800/80 flex items-center justify-center text-emerald-200">
              <Bot size={15} />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#16261E] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#16261E] rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white select-none">
            Hỏi Trợ Lý AI
          </span>
        </button>
      )}
    </div>
  );
}
