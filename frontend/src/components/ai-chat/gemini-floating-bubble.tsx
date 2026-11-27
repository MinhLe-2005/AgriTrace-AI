"use client";

import { Bot, Sparkles, X, GripVertical, RotateCcw } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { GeminiChatWidget } from "./gemini-chat-widget";

interface Position {
  x: number;
  y: number;
}

const STORAGE_KEY = "agritrace_ai_bubble_pos_v2";

export function GeminiFloatingBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasManuallyMovedRef = useRef(false);
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
    hasMoved: boolean;
  }>({ startX: 0, startY: 0, startPosX: 0, startPosY: 0, hasMoved: false });

  // Calculate default position: bottom-right corner with 20px padding
  const getDefaultPosition = useCallback((): Position => {
    if (typeof window === "undefined") return { x: 0, y: 0 };
    const btnWidth = 190;
    const btnHeight = 50;
    return {
      x: Math.max(16, window.innerWidth - btnWidth - 20),
      y: Math.max(16, window.innerHeight - btnHeight - 20),
    };
  }, []);

  // Initialize position from localStorage or default
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === "number" && typeof parsed.y === "number") {
          hasManuallyMovedRef.current = true;
          const btnWidth = 190;
          const btnHeight = 50;
          const maxX = Math.max(16, window.innerWidth - btnWidth - 16);
          const maxY = Math.max(16, window.innerHeight - btnHeight - 16);
          setPosition({
            x: Math.min(maxX, Math.max(16, parsed.x)),
            y: Math.min(maxY, Math.max(16, parsed.y)),
          });
          return;
        }
      }
    } catch {}
    setPosition(getDefaultPosition());
  }, [getDefaultPosition]);

  // Adjust position when browser window is resized
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        if (!prev) return getDefaultPosition();
        const btnWidth = buttonRef.current?.offsetWidth || 190;
        const btnHeight = buttonRef.current?.offsetHeight || 50;
        const maxX = Math.max(16, window.innerWidth - btnWidth - 16);
        const maxY = Math.max(16, window.innerHeight - btnHeight - 16);
        return {
          x: Math.min(maxX, Math.max(16, prev.x)),
          y: Math.min(maxY, Math.max(16, prev.y)),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getDefaultPosition]);

  // Listen for open custom event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-agritrace-chat", handleOpen);
    return () => window.removeEventListener("open-agritrace-chat", handleOpen);
  }, []);

  // Listen to order chat drawer toggle to automatically dodge if overlapping drawer area
  useEffect(() => {
    const handleDrawerToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      setIsDrawerOpen(Boolean(customEvent.detail?.isOpen));
    };

    window.addEventListener("order-chat-drawer-toggle", handleDrawerToggle);
    return () => window.removeEventListener("order-chat-drawer-toggle", handleDrawerToggle);
  }, []);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    // Only primary button (left mouse click or touch)
    if (e.button !== 0) return;

    const currentPos = position || getDefaultPosition();
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: currentPos.x,
      startPosY: currentPos.y,
      hasMoved: false,
    };

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Distinguish between drag and click threshold
    if (!dragStartRef.current.hasMoved && Math.hypot(dx, dy) > 5) {
      dragStartRef.current.hasMoved = true;
      hasManuallyMovedRef.current = true;
      setIsDragging(true);
    }

    if (dragStartRef.current.hasMoved) {
      const btnWidth = buttonRef.current?.offsetWidth || 190;
      const btnHeight = buttonRef.current?.offsetHeight || 50;
      const maxX = Math.max(12, window.innerWidth - btnWidth - 12);
      const maxY = Math.max(12, window.innerHeight - btnHeight - 12);

      const nextX = Math.min(maxX, Math.max(12, dragStartRef.current.startPosX + dx));
      const nextY = Math.min(maxY, Math.max(12, dragStartRef.current.startPosY + dy));

      setPosition({ x: nextX, y: nextY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    if (dragStartRef.current.hasMoved) {
      setIsDragging(false);
      // Save position to localStorage
      if (position) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        } catch {}
      }
    } else {
      // Clean click: toggle open/close
      setIsOpen((prev) => !prev);
    }
  };

  // Reset to original bottom-right position
  const handleResetPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const defaultPos = getDefaultPosition();
    hasManuallyMovedRef.current = false;
    setPosition(defaultPos);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  if (!mounted) return null;

  const basePos = position || getDefaultPosition();

  // If chat drawer is open on the right (takes ~480px on desktop) and the bubble is located in that right area,
  // automatically dodge to the left of the drawer so it never blocks the Send button or chat input!
  let effectiveX = basePos.x;
  const effectiveY = basePos.y;

  if (isDrawerOpen && typeof window !== "undefined") {
    const drawerOverlapThreshold = window.innerWidth - 500;
    if (basePos.x > drawerOverlapThreshold) {
      // Slide smoothly to the left of the drawer
      effectiveX = Math.max(16, window.innerWidth - 510 - 190);
    }
  }

  // Dialog dimensions & positioning calculation
  const dialogWidth = typeof window !== "undefined" ? Math.min(440, window.innerWidth - 24) : 440;
  const dialogHeight = typeof window !== "undefined" ? Math.min(640, window.innerHeight - 80) : 640;

  let dialogLeft = effectiveX + 190 - dialogWidth;
  if (dialogLeft < 12) dialogLeft = 12;
  if (typeof window !== "undefined" && dialogLeft + dialogWidth > window.innerWidth - 12) {
    dialogLeft = window.innerWidth - dialogWidth - 12;
  }

  let dialogTop = effectiveY - dialogHeight - 12;
  if (dialogTop < 12) {
    // If not enough space above, place below if space, or clamp to 12
    if (typeof window !== "undefined" && effectiveY + 60 + dialogHeight <= window.innerHeight - 12) {
      dialogTop = effectiveY + 60;
    } else {
      dialogTop = 12;
    }
  }

  return (
    <>
      {/* ── Chat Window Dialog ── */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            left: `${dialogLeft}px`,
            top: `${dialogTop}px`,
            width: `${dialogWidth}px`,
            height: `${dialogHeight}px`,
            zIndex: 65,
          }}
          className="bg-white rounded-3xl shadow-[0_25px_70px_-15px_rgba(10,38,29,0.4)] border-2 border-emerald-900/20 overflow-hidden flex flex-col transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ring-1 ring-black/5"
        >
          <GeminiChatWidget
            isFloating
            onClose={() => setIsOpen(false)}
            className="h-full w-full rounded-none border-0"
          />
        </div>
      )}

      {/* ── Draggable Floating Bubble ── */}
      <div
        style={{
          position: "fixed",
          left: `${effectiveX}px`,
          top: `${effectiveY}px`,
          zIndex: 65,
          touchAction: "none",
          transition: isDragging ? "none" : "left 0.25s cubic-bezier(0.16, 1, 0.3, 1), top 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="select-none"
      >
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`group relative flex items-center gap-2 pl-2.5 pr-4 py-2.5 bg-gradient-to-r from-[#0B251B] to-[#123E2F] hover:from-[#0E3326] hover:to-[#174F3C] text-white rounded-full shadow-[0_12px_35px_-5px_rgba(10,38,29,0.45)] border border-emerald-500/50 transition-all select-none ${
            isDragging
              ? "cursor-grabbing scale-105 shadow-2xl ring-2 ring-emerald-400"
              : "cursor-grab hover:scale-105 active:scale-95"
          }`}
          title="Bấm giữ để kéo di chuyển | Nhấp để mở Trợ lý AI"
        >
          {/* Grip dots to clearly indicate draggable capability */}
          <div className="text-emerald-400/70 group-hover:text-emerald-200 transition-colors shrink-0">
            <GripVertical size={14} />
          </div>

          <div className="relative flex items-center justify-center shrink-0">
            <div className="w-6 h-6 rounded-full bg-emerald-800/80 flex items-center justify-center text-emerald-200">
              <Bot size={15} />
            </div>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B251B] rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#0B251B] rounded-full" />
          </div>

          <span className="text-xs font-bold tracking-tight text-white select-none flex items-center gap-1.5 whitespace-nowrap">
            <span>Hỏi Trợ Lý AI</span>
            <Sparkles size={12} className="text-amber-300 fill-amber-300" />
          </span>
        </button>
      </div>
    </>
  );
}
