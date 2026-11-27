"use client";

import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { useToastStore, ToastKind } from "@/stores/toast-store";

const toastConfig: Record<
  ToastKind,
  {
    icon: typeof CheckCircle2;
    borderAccent: string;
    iconBg: string;
    iconColor: string;
    title: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    borderAccent: "border-l-emerald-600",
    iconBg: "bg-emerald-50 border border-emerald-200/80",
    iconColor: "text-emerald-700",
    title: "Thành công",
  },
  error: {
    icon: XCircle,
    borderAccent: "border-l-rose-600",
    iconBg: "bg-rose-50 border border-rose-200/80",
    iconColor: "text-rose-700",
    title: "Có lỗi xảy ra",
  },
  info: {
    icon: Info,
    borderAccent: "border-l-blue-600",
    iconBg: "bg-blue-50 border border-blue-200/80",
    iconColor: "text-blue-700",
    title: "Thông báo",
  },
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed right-4 sm:right-6 top-20 z-[9999] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map((item) => {
        const config = toastConfig[item.kind] || toastConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            role="status"
            className={`pointer-events-auto flex items-start gap-3 rounded-2xl border border-gray-200/90 border-l-4 ${config.borderAccent} bg-white p-3.5 shadow-xl shadow-gray-900/10 animate-fade-in-up transition-all`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${config.iconBg} ${config.iconColor}`}
            >
              <Icon size={17} strokeWidth={2.2} />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">
                {config.title}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-gray-900 leading-snug break-words">
                {item.message}
              </p>
            </div>

            <button
              type="button"
              aria-label="Đóng thông báo"
              onClick={() => dismiss(item.id)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors shrink-0 -mr-1 -mt-1"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
