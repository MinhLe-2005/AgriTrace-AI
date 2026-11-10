"use client";

import { Bot, MessageSquare, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GeminiChatWidget } from "./gemini-chat-widget";

export function GeminiFloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {/* ── Chat Window Dialog (Compact, right-aligned, vertical) ── */}
      {isOpen && (
        <div
          style={{
            width: "380px",
            maxWidth: "calc(100vw - 32px)",
            height: "560px",
            maxHeight: "calc(100vh - 110px)",
          }}
          className="mb-3 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] border border-emerald-200 overflow-hidden flex flex-col pointer-events-auto transition-all animate-in fade-in slide-in-from-bottom-4 duration-200 ring-1 ring-black/5"
        >
          <GeminiChatWidget
            isFloating
            onClose={() => setIsOpen(false)}
            className="h-full w-full rounded-none border-0"
          />
        </div>
      )}

      {/* ── Trigger Floating Button (Clear, vibrant emerald, high contrast) ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto group relative flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-[0_6px_20px_rgba(16,185,129,0.45)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer border-2 border-white"
        title="Trợ lý AI Nông Sản AgriTrace"
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X size={18} className="text-white" />
          ) : (
            <>
              <Sparkles size={18} className="text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full" />
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
