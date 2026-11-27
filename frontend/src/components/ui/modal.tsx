import { X } from "lucide-react";
import { type ReactNode } from "react";

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-50 grid place-items-center p-4"><button aria-label="Close dialog" className="absolute inset-0 bg-foreground/30" onClick={onClose} /><section className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-lg font-semibold">{title}</h2><button aria-label="Close dialog" className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={onClose}><X aria-hidden className="size-5" /></button></div>{children}</section></div>;
}
