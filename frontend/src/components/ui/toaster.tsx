"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { useToastStore } from "@/stores/toast-store";

const icons = { success: CheckCircle2, error: XCircle, info: Info };
const classes = { success: "border-success/30 bg-success/10 text-success", error: "border-danger/30 bg-danger/10 text-danger", info: "border-primary/30 bg-primary/10 text-primary" };

export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return <div aria-live="polite" className="fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
    {toasts.map((item) => {
      const Icon = icons[item.kind];
      return <div key={item.id} role="status" className={`flex items-start gap-3 rounded-xl border p-3 text-sm shadow-card ${classes[item.kind]}`}>
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
        <p className="flex-1 font-medium">{item.message}</p>
        <button aria-label="Dismiss notification" onClick={() => dismiss(item.id)} className="rounded p-0.5 hover:bg-card/50"><X aria-hidden className="size-4" /></button>
      </div>;
    })}
  </div>;
}
