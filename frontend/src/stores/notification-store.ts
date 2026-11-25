import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ApiOrder, ApiVoucher } from "@/services/catalog.service";
import type { VerificationRequest } from "@/types/verification";

export type NotificationType = "order" | "voucher" | "promo" | "season" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  link?: string;
  badge?: string;
};

type NotificationStore = {
  notifications: NotificationItem[];
  addNotification: (item: {
    id?: string;
    title: string;
    message: string;
    type: NotificationType;
    createdAt?: string;
    link?: string;
    badge?: string;
  }) => void;
  syncFromLiveSystem: (params: {
    orders?: ApiOrder[];
    vouchers?: ApiVoucher[];
    verification?: VerificationRequest | null;
  }) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
};

const initialNotifications: NotificationItem[] = [];

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: initialNotifications,
      addNotification: (item) =>
        set((state) => {
          const newId = item.id || `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          const filtered = state.notifications.filter((n) => n.id !== newId);
          const newNotif: NotificationItem = {
            id: newId,
            title: item.title,
            message: item.message,
            type: item.type,
            createdAt: item.createdAt || "Vừa xong",
            read: false,
            link: item.link,
            badge: item.badge,
          };
          return {
            notifications: [newNotif, ...filtered],
          };
        }),
      syncFromLiveSystem: ({ orders, vouchers, verification }) =>
        set((state) => {
          // Remove legacy fake notifications
          const currentList = state.notifications.filter(
            (n) =>
              n.id !== "notif-season-pricing" &&
              !n.title.includes("QĐ #88") &&
              !n.title.includes("Quyết định")
          );

          const newItems: NotificationItem[] = [];

          // 1. Sync live orders
          if (orders && orders.length > 0) {
            orders.slice(0, 5).forEach((ord) => {
              const code = ord.orderCode || `DH-${ord.id}`;
              const exists = currentList.some((n) => n.id === `notif-order-${code}`);
              if (!exists) {
                let title = `📦 Đơn hàng #${code} đã được tiếp nhận`;
                let message = `Đơn hàng gồm ${ord.items?.length || 1} món nông sản đang được xử lý tại kho lạnh. Bấm để xem chi tiết!`;
                let badge = "Đã đặt";
                if (ord.status === "SHIPPING") {
                  title = `🚚 Đơn hàng #${code} đang giao xe lạnh`;
                  message = `Nông sản đang trên tuyến xe lạnh 2°C – 5°C. Bấm để theo dõi lộ trình và định vị tài xế!`;
                  badge = "Đang giao";
                } else if (ord.status === "PENDING_PAYMENT") {
                  title = `⏳ Đơn hàng #${code} chờ thanh toán VietQR`;
                  message = `Kho lạnh đang giữ đơn hàng trong 30 phút. Vui lòng quét mã VietQR để kho xuất hàng!`;
                  badge = "Chờ chuyển khoản";
                } else if (ord.status === "DELIVERED" || ord.status === "COMPLETED") {
                  title = `✅ Đơn hàng #${code} đã giao thành công`;
                  message = `Nông sản tươi sạch đã được giao an toàn. Chúc bạn và gia đình có bữa ăn ngon lành!`;
                  badge = "Đã nhận";
                }
                newItems.push({
                  id: `notif-order-${code}`,
                  title,
                  message,
                  type: "order",
                  createdAt: "Gần đây",
                  read: false,
                  link: `/dashboard/customer?tab=orders&order=${code}`,
                  badge,
                });
              }
            });
          }

          // 2. Sync live vouchers created by Admin
          if (vouchers && vouchers.length > 0) {
            vouchers
              .filter((v) => v.active)
              .slice(0, 3)
              .forEach((v) => {
                const exists = currentList.some((n) => n.id === `notif-voucher-${v.code}`);
                if (!exists) {
                  const discountText = v.discount.toLowerCase().startsWith("giảm")
                    ? v.discount
                    : `Giảm ${v.discount}`;
                  const minOrderText = v.minOrder.toLowerCase().startsWith("đơn từ")
                    ? v.minOrder
                    : `đơn từ ${v.minOrder}`;
                  const expText = v.exp.replace(/^HSD:\s*/i, "");
                  newItems.push({
                    id: `notif-voucher-${v.code}`,
                    title: `🎟️ Voucher Mới: ${v.code} (${v.badge || "Ưu đãi"})`,
                    message: `${discountText} cho ${minOrderText}. HSD: ${expText}. Bấm để nhận và áp dụng!`,
                    type: "voucher",
                    createdAt: "Mới cập nhật",
                    read: false,
                    link: `/vouchers`,
                    badge: v.badge || "Voucher",
                  });
                }
              });
          }

          // 3. Sync partner verification status
          if (verification) {
            const exists = currentList.some((n) => n.id === `notif-verify-${verification.id}-${verification.status}`);
            if (!exists) {
              const roleTitle = verification.type === "FARMER" ? "Nông dân" : "Vận chuyển";
              let title = `📋 Hồ sơ đối tác ${roleTitle}: Đang thẩm định`;
              let message = `Hồ sơ ${roleTitle} (${verification.organizationName}) đang được Ban Quản Trị xem xét trong 24h.`;
              let badge = "Chờ duyệt";
              if (verification.status === "APPROVED") {
                title = `🎉 Chúc mừng! Hồ sơ đối tác ${roleTitle} đã được phê duyệt!`;
                message = `Bạn đã có quyền truy cập Cổng Quản Trị Vận Hành. Bấm để bắt đầu!`;
                badge = "Đã duyệt";
              } else if (verification.status === "CHANGES_REQUESTED") {
                title = `⚠️ Hồ sơ đối tác ${roleTitle}: Cần bổ sung tài liệu`;
                message = `${verification.decisionReason || "Vui lòng cập nhật lại hồ sơ năng lực."} Bấm để hoàn thiện.`;
                badge = "Cần bổ sung";
              }
              newItems.push({
                id: `notif-verify-${verification.id}-${verification.status}`,
                title,
                message,
                type: "system",
                createdAt: "Mới nhất",
                read: false,
                link: `/dashboard`,
                badge,
              });
            }
          }

          if (newItems.length === 0) return { notifications: currentList };
          return { notifications: [...newItems, ...currentList] };
        }),
      markAsRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      deleteNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "agritrace-notifications-v8",
    }
  )
);
