"use client";

import { Sparkles, X } from "lucide-react";
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
            width: "385px",
            maxWidth: "calc(100vw - 28px)",
            height: "570px",
            maxHeight: "calc(100vh - 100px)",
          }}
          className="mb-3 bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(5,150,105,0.28)] border border-emerald-500/20 overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-5 duration-250 ring-1 ring-black/5"
        >
          <GeminiChatWidget
            isFloating
            onClose={() => setIsOpen(false)}
            className="h-full w-full rounded-none border-0"
          />
        </div>
      )}

      {/* ── Trigger Floating Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto group relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-full shadow-[0_8px_25px_-4px_rgba(5,150,105,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/90"
        title="Trợ lý AI Nông Sản AgriTrace"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X size={18} className="text-white transition-transform group-hover:rotate-90 duration-200" />
          ) : (
            <>
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles size={14} className="text-white animate-pulse" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-emerald-600 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 border-2 border-emerald-600 rounded-full" />
            </>
          )}
        </div>
        <span className="text-xs font-bold tracking-tight text-white select-none">
          {isOpen ? "Đóng chat" : "Hỏi Trợ Lý AI"}
        </span>
      </button>
    </div>
  );
}
