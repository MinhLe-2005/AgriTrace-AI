"use client";

import { Bell, CheckCheck, MessageCircle, Package, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { subscribeToDistributorEvents } from "@/features/distributor/realtime";
import type { DistributorNotification } from "@/features/distributor/types";
import { distributorService } from "@/services/distributor.service";
import { cn } from "@/utils/cn";

function iconFor(type: string) {
  if (type === "NEW_MESSAGE") return MessageCircle;
  if (type === "SHIPMENT_CANCELLED" || type === "INCIDENT_REPORTED") return XCircle;
  if (type === "QR_RECEIVED") return CheckCheck;
  return Package;
}

function timestamp(value?: string) {
  if (!value) return "Vừa xong";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Vừa xong";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60_000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  if (minutes < 24 * 60) return `${Math.floor(minutes / 60)} giờ trước`;
  return date.toLocaleDateString("vi-VN");
}

/** Small, role-scoped inbox for the Distributor operational shell. */
export function DistributorNotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<DistributorNotification[]>([]);
  const [unread, setUnread] = useState(0);

  const refresh = async () => {
    try {
      const [notifications, count] = await Promise.all([
        distributorService.getNotifications(),
        distributorService.getUnreadNotificationCount(),
      ]);
      setItems(notifications.slice(0, 6));
      setUnread(count);
    } catch {
      // The bell remains unobtrusive if the current role has no Distributor inbox.
    }
  };

  useEffect(() => {
    void refresh();
    return subscribeToDistributorEvents({ onNotification: () => void refresh() });
  }, []);

  async function openNotification(notification: DistributorNotification) {
    setOpen(false);
    if (!notification.read) {
      setItems((previous) => previous.map((item) => item.id === notification.id ? { ...item, read: true } : item));
      setUnread((count) => Math.max(0, count - 1));
      try {
        await distributorService.markNotificationRead(notification.id);
      } catch {
        void refresh();
      }
    }
    if (notification.referenceCode) {
      router.push(`/dashboard/distributor/shipments/${encodeURIComponent(notification.referenceCode)}`);
    }
  }

  async function markAllRead() {
    try {
      await distributorService.markAllNotificationsRead();
      setItems((previous) => previous.map((item) => ({ ...item, read: true })));
      setUnread(0);
    } catch {
      // Keep the latest server state on the next SSE or open action.
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unread ? `Thông báo, ${unread} chưa đọc` : "Thông báo"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#E4DFD5] bg-white text-[#16261E] shadow-2xs transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
      >
        <Bell size={17} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-600 px-1 text-center text-[9px] font-extrabold leading-4 text-white">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-[#E4DFD5] bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-[#EDE8DD] px-4 py-3">
            <div>
              <p className="text-sm font-extrabold text-[#16261E]">Thông báo vận chuyển</p>
              <p className="text-[11px] text-stone-500">Cập nhật trực tiếp từ hệ thống</p>
            </div>
            {unread > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-[11px] font-bold text-[#166534] hover:underline">
                Đã đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto p-1.5">
            {items.length === 0 ? (
              <p className="px-3 py-8 text-center text-xs text-stone-500">Chưa có thông báo mới.</p>
            ) : items.map((notification) => {
              const Icon = iconFor(notification.type);
              return (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => void openNotification(notification)}
                  className={cn(
                    "flex w-full gap-3 rounded-xl p-3 text-left transition hover:bg-stone-50",
                    !notification.read && "bg-amber-50/70"
                  )}
                >
                  <span className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", notification.type === "NEW_MESSAGE" ? "bg-sky-100 text-sky-700" : "bg-amber-100 text-amber-800")}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs font-bold text-[#16261E]">{notification.title}</span>
                      {!notification.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[11px] leading-relaxed text-stone-600">{notification.content}</span>
                    <span className="mt-1 block text-[10px] font-medium text-stone-400">{timestamp(notification.createdAt)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
