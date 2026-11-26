"use client";

import { Bot, Sparkles, X } from "lucide-react";
import { useState, useEffect } from "react";
import { GeminiChatWidget } from "./gemini-chat-widget";

export function GeminiFloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-agritrace-chat", handleOpen);
    return () => window.removeEventListener("open-agritrace-chat", handleOpen);
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-none">
      {/* ── Chat Window Dialog ── */}
      {isOpen && (
        <div
          style={{
            width: "440px",
            maxWidth: "calc(100vw - 28px)",
            height: "640px",
            maxHeight: "calc(100vh - 80px)",
          }}
          className="bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(10,38,29,0.4)] border-2 border-emerald-900/20 overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-250 ring-1 ring-black/5"
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
          className="pointer-events-auto group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-[#0B251B] to-[#123E2F] hover:from-[#0E3326] hover:to-[#174F3C] text-white rounded-full shadow-[0_12px_35px_-5px_rgba(10,38,29,0.45)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-emerald-500/50"
          title="Trợ lý AI Nông Sản AgriTrace"
        >
          <div className="relative flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-emerald-800/80 flex items-center justify-center text-emerald-200">
              <Bot size={15} />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B251B] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B251B] rounded-full" />
          </div>
          <span className="text-xs font-bold tracking-tight text-white select-none flex items-center gap-1.5">
            <span>Hỏi Trợ Lý AI</span>
            <Sparkles size={12} className="text-amber-300 fill-amber-300" />
          </span>
        </button>
      )}
    </div>
  );
}
