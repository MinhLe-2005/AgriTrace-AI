import { create } from "zustand";

export type NotificationType = "order" | "voucher" | "promo" | "season" | "system";

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
    id: "notif-season-pricing",
    title: "📢 Thông báo Quyết định Trợ giá Mùa Vụ Thu Đông 2026",
    message: "Quyết định số 88/2026/QĐ-AGRI: Trợ giá trực tiếp 13% - 18% cho rau củ quả chính vụ tại Đà Lạt & Mộc Châu (Áp dụng: 01/10 – 31/12/2026). Không cần nhập mã!",
    type: "season",
    createdAt: "Vừa xong",
    read: false,
    link: "/seasons#pricing-policy",
  },
  {
    id: "notif-season-1",
    title: "🍓 Mở bán Mùa Dâu Tây Mộc Châu Vụ Đông",
    message: "Dâu tây New Zealand Mộc Châu chính thức vào vụ thu hái chín rộ. Chuỗi xe lạnh 2-5°C giao tận bàn ăn trong 24h!",
    type: "season",
    createdAt: "30 phút trước",
    read: false,
    link: "/products?cat=trai_cay",
  },
  {
    id: "notif-promo-1",
    title: "🎉 Tuần Lễ Nông Sản Xanh - Giảm 20% & Freeship",
    message: "Áp mã NONGNGHIEPXANH giảm ngay 20.000đ cho đơn nông sản VietGAP. Tích thêm x1.5 điểm AgriClub!",
    type: "promo",
    createdAt: "1 giờ trước",
    read: false,
    link: "/vouchers",
  },
  {
    id: "notif-order-1",
    title: "🚚 Đang giao hàng xe lạnh (AGRI-8841)",
    message: "Đơn hàng AGRI-8841 đang được tài xế giao bằng xe lạnh 4.1°C. Dự kiến nhận trước 16:30 chiều nay.",
    type: "order",
    createdAt: "2 giờ trước",
    read: false,
    link: "/dashboard/customer?tab=orders",
  },
  {
    id: "notif-season-2",
    title: "🍊 Sự kiện Mùa Vụ Cam Sành Hàm Yên",
    message: "HTX Mộc Châu vừa thu hoạch đợt Cam Sành tép vàng mọng nước chuẩn VietGAP, dồi dào Vitamin C tươi ngon.",
    type: "season",
    createdAt: "1 ngày trước",
    read: true,
    link: "/products",
  },
  {
    id: "notif-voucher-1",
    title: "🎁 Tặng Voucher AGRI30K mừng Hội Viên VIP",
    message: "Hệ thống tặng bạn mã giảm giá 30.000đ trong ví voucher mừng nâng hạng Hội Viên AgriClub.",
    type: "voucher",
    createdAt: "2 ngày trước",
    read: true,
    link: "/dashboard/customer?tab=vouchers",
  },
  {
    id: "notif-system-1",
    title: "🛡️ Nhật ký VietGAP được cập nhật",
    message: "Lô Xà Lách Thủy Canh XL-2026-08 vừa bổ sung kết quả kiểm định phòng Lab: Dư lượng thuốc BVTV = 0.",
    type: "system",
    createdAt: "3 ngày trước",
    read: true,
    link: "/traceability?batch=LOT-XL-2026-08",
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
