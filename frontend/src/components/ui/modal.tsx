"use client";

import { X } from "lucide-react";
import { useEffect, useId, type ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);
  return <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="fixed inset-0 z-50 grid place-items-center overflow-y-auto overscroll-contain p-4"><button type="button" aria-label="Đóng hộp thoại" className="absolute inset-0 cursor-default bg-[#16261E]/50 backdrop-blur-xs" onClick={onClose} /><section className="relative z-10 w-full max-w-lg rounded-2xl border border-[#E4DFD5] bg-[#FBF9F5] p-5 shadow-2xl sm:p-6"><div className="mb-5 flex items-center justify-between gap-4 border-b border-[#E4DFD5] pb-3.5"><h2 id={titleId} className="font-serif text-lg font-bold text-[#16261E] text-balance">{title}</h2><button type="button" aria-label="Đóng hộp thoại" className="rounded-xl p-2 text-stone-500 hover:bg-[#F3EFE6] hover:text-[#16261E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]" onClick={onClose}><X aria-hidden="true" size={18} /></button></div>{children}</section></div>;
}
