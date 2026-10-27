import { create } from "zustand";

export type NotificationType = "order" | "voucher" | "system";

export type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  link?: string;
};

type NotificationStore = {
  notifications: NotificationItem[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
};

const initialNotifications: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Đang giao hàng xe lạnh",
    message: "Đơn hàng AGRI-8841 đang được tài xế giao bằng xe lạnh 5°C. Dự kiến nhận trước 16:30.",
    type: "order",
    createdAt: "15 phút trước",
    read: false,
    link: "/dashboard/customer?tab=orders&order=AGRI-8841",
  },
  {
    id: "notif-2",
    title: "Voucher mới trong ví của bạn",
    message: "Bạn đã nhận được mã AGRI30 giảm 14.000đ và FREESHIP25 mừng vụ thu hoạch Mộc Châu.",
    type: "voucher",
    createdAt: "2 giờ trước",
    read: false,
    link: "/dashboard/customer?tab=vouchers",
  },
  {
    id: "notif-3",
    title: "Nhật ký VietGAP được cập nhật",
    message: "Lô Xà Lách Thủy Canh XL-2026-08 vừa bổ sung kết quả kiểm định tồn dư thuốc BVTV = 0.",
    type: "system",
    createdAt: "1 ngày trước",
    read: false,
    link: "/traceability?lot=XL-2026-08",
  },
  {
    id: "notif-4",
    title: "Đơn hàng đã hoàn thành",
    message: "Đơn hàng AGRI-8790 đã giao thành công. Bạn được tích lũy +28 điểm hội viên.",
    type: "order",
    createdAt: "3 ngày trước",
    read: true,
    link: "/dashboard/customer?tab=orders",
  },
];

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: initialNotifications,
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
}));
