"use client";

import { Bot, MessageSquare, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GeminiChatWidget } from "./gemini-chat-widget";

export function GeminiFloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {/* ── Chat Window Dialog ── */}
      {isOpen && (
        <div className="mb-3 w-[92vw] sm:w-[400px] h-[580px] max-h-[82vh] shadow-2xl rounded-3xl overflow-hidden border border-emerald-200 animate-in slide-in-from-bottom-5 duration-200 flex flex-col">
          <GeminiChatWidget
            isFloating
            onClose={() => setIsOpen(false)}
            minHeight="100%"
            className="h-full rounded-none border-0"
          />
        </div>
      )}

      {/* ── Trigger Floating Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-full shadow-xl transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-emerald-400/40"
        title="Trợ lý AI Nông Sản AgriTrace"
      >
        <div className="relative">
          {isOpen ? <X size={20} /> : <Sparkles size={20} className="animate-spin-slow" />}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-xs font-bold tracking-tight pr-1 hidden sm:inline">
          {isOpen ? "Đóng AI" : "Hỏi Trợ Lý AI"}
        </span>
      </button>
    </div>
  );
}
