"use client";

import {
  Award,
  Bell,
  Calendar,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Info,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  QrCode,
  Receipt,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Star,
  Tag,
  ThermometerSnowflake,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
  Warehouse,
  X,
  PhoneCall,
  Zap,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { catalogService, type ApiOrder } from "@/services/catalog.service";
import { OrderChatDrawer } from "@/features/order-chat/OrderChatDrawer";
import { OrderDisputeModal } from "@/features/order-chat/OrderDisputeModal";
import { CustomerMessagesPanel } from "@/features/order-chat/CustomerMessagesPanel";
import { orderChatService } from "@/services/order-chat.service";
import { loyaltyService, type LoyaltyProfile } from "@/services/loyalty.service";
import { paymentService, type PaymentLinkResponse } from "@/services/payment.service";
import { reviewService } from "@/services/review.service";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useNotificationStore } from "@/stores/notification-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";
import { compressAvatarImage, formatBytes } from "@/utils/image-compress";

type OrderItem = {
  name: string;
  origin: string;
  cert: string;
  qty: string;
  price: number;
  image: string;
};

type Order = {
  id: string;
  numericId?: number;
  createdAtRaw?: string;
  date: string;
  status: string;
  statusText: string;
  statusColor: string;
  paymentStatusText: string;
  paymentStatusColor: string;
  holdMinutesLeft?: number;
  lotCode: string;
  items: OrderItem[];
  voucherUsed?: string;
  discount?: number;
  shippingFee: number;
  total: number;
  pointsAwarded: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  deliverySlot?: string;
  deliveryNote?: string;
  driverName?: string;
  driverPhone?: string;
  cancelReason?: string;
  paymentMethod?: string;
  paymentRef?: string;
  paidAt?: string;
  refundStatus?: string;
  refundReason?: string;
  refundSolution?: string;
  refundAmount?: number;
  timeline: { title: string; time: string; completed: boolean }[];
};

function getOrderStatusDetails(
  status: string,
  paymentMethod?: string,
  createdAt?: string,
  paidAt?: string,
  paymentRef?: string
) {
  const normStatus = (status || "CONFIRMED").toUpperCase();
  const normPay = (paymentMethod || "COD").toUpperCase();
  const isQr = normPay === "PAYOS" || normPay === "BANK";

  // Calculate remaining minutes for 30-min hold if PENDING_PAYMENT
  let holdMinutesLeft = 30;
  if (normStatus === "PENDING_PAYMENT" && createdAt) {
    const createdMs = new Date(createdAt).getTime();
    if (!Number.isNaN(createdMs)) {
      const elapsedMin = Math.floor((Date.now() - createdMs) / 60000);
      holdMinutesLeft = Math.max(1, 30 - elapsedMin);
    }
  }

  // 1. Payment Status Badge (Trạng thái Thanh toán tách biệt rõ ràng)
  let paymentStatusText = "Chưa thanh toán (Thu hộ COD khi giao)";
  let paymentStatusColor = "bg-orange-50 text-orange-800 border-orange-200/80";

  if (normStatus === "CANCELLED") {
    if (!!paidAt || (paymentRef || "").toUpperCase().startsWith("REFUND")) {
      paymentStatusText = "Hoàn tiền 100% VietQR (Đơn hủy sau TT)";
      paymentStatusColor = "bg-purple-50 text-purple-800 border-purple-200/80";
    } else {
      paymentStatusText = isQr ? "Đã hủy QR (Chưa thu tiền)" : "Đã hủy COD (Không thu tiền)";
      paymentStatusColor = "bg-gray-100 text-gray-500 border-gray-200";
    }
  } else if (normStatus === "REFUNDED") {
    paymentStatusText = "Đã hoàn tiền 100%";
    paymentStatusColor = "bg-purple-50 text-purple-800 border-purple-200/80";
  } else if (isQr) {
    if (normStatus === "PENDING_PAYMENT") {
      if ((paymentRef || "").toUpperCase().includes("PENDING_ADMIN") || (paymentRef || "").toUpperCase().includes("APPROVAL")) {
        paymentStatusText = "Chờ Admin/Kế toán duyệt chuyển khoản";
        paymentStatusColor = "bg-amber-100 text-amber-900 border-amber-300 font-semibold";
      } else if ((paymentRef || "").toUpperCase().includes("REJECTED")) {
        paymentStatusText = "Chưa nhận được chuyển khoản (Quét lại QR)";
        paymentStatusColor = "bg-rose-100 text-rose-900 border-rose-300 font-semibold";
      } else {
        paymentStatusText = `Chưa thanh toán (Giữ hàng 30p · Còn ${holdMinutesLeft}p)`;
        paymentStatusColor = "bg-amber-100 text-amber-900 border-amber-300";
      }
    } else {
      paymentStatusText = "Đã thanh toán (Chuyển khoản VietQR)";
      paymentStatusColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
    }
  } else {
    // Tiền mặt (COD): Chỉ chuyển sang Đã thanh toán khi Đã giao hàng thành công (DELIVERED/COMPLETED) hoặc có paidAt
    if (normStatus === "DELIVERED" || normStatus === "COMPLETED" || !!paidAt) {
      paymentStatusText = "Đã thanh toán (Đã thu tiền mặt COD)";
      paymentStatusColor = "bg-emerald-100 text-emerald-900 border-emerald-300";
    } else {
      paymentStatusText = "Chưa thanh toán (Thu hộ COD khi nhận hàng)";
      paymentStatusColor = "bg-orange-50 text-orange-800 border-orange-200/80";
    }
  }

  // 2. Delivery / Fulfillment Status Badge (Trạng thái Vận chuyển & Đơn hàng)
  switch (normStatus) {
    case "PENDING_PAYMENT":
      return {
        text: "Chờ thanh toán (Giữ hàng 30p)",
        color: "bg-amber-50 text-amber-900 border-amber-300",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft,
      };
    case "PAID":
      return {
        text: "Kho lạnh đang chuẩn bị hàng",
        color: "bg-teal-50 text-teal-800 border-teal-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    case "CONFIRMED":
      return {
        text: "Kho lạnh đã xác nhận đơn",
        color: "bg-indigo-50 text-indigo-700 border-indigo-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    case "PREPARING":
      return {
        text: "Đang đóng gói bảo quản lạnh",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    case "SHIPPING":
      return {
        text: "Đang giao hàng xe lạnh (2°C – 5°C)",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    case "DELIVERED":
    case "COMPLETED":
      return {
        text: "Đã giao hàng thành công",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    case "CANCELLED":
      return {
        text: "Đã hủy đơn hàng",
        color: "bg-rose-50 text-rose-700 border-rose-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    case "REFUNDED":
      return {
        text: "Đã hoàn tiền",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
    default:
      return {
        text: "Kho lạnh đang chuẩn bị hàng",
        color: "bg-gray-50 text-gray-700 border-gray-200",
        paymentStatusText,
        paymentStatusColor,
        holdMinutesLeft: 0,
      };
  }
}

const mockOrders: Order[] = [
  {
    id: "AGRI-8841",
    date: "Hôm nay, 14:15",
    status: "SHIPPING",
    statusText: "Đang giao hàng xe lạnh (2°C – 5°C)",
    statusColor: "bg-blue-50 text-blue-800 border-blue-200",
    paymentStatusText: "Chưa thanh toán (Thu hộ COD khi nhận hàng)",
    paymentStatusColor: "bg-orange-50 text-orange-800 border-orange-200",
    lotCode: "XL-2026-08",
    receiverName: "Lê Quang Minh",
    receiverPhone: "0988 776 655",
    receiverAddress: "Số 123 Cầu Giấy, Hà Nội",
    deliverySlot: "Giờ hành chính (08:00 - 17:00)",
    deliveryNote: "Gọi điện trước khi giao 15 phút, giao tại quầy lễ tân nếu vắng mặt",
    driverName: "Nguyễn Văn Thắng",
    driverPhone: "0912.888.777",
    paymentMethod: "COD",
    timeline: [
      { title: "Đặt hàng thành công", time: "08:30 Hôm nay", completed: true },
      { title: "Nông trại thu hái & kiểm định VietGAP", time: "10:15 Hôm nay", completed: true },
      { title: "Đang vận chuyển xe lạnh (Nhiệt độ thùng xe 4.5°C)", time: "14:15 Hôm nay", completed: true },
      { title: "Giao hàng thành công & Đối soát thanh toán", time: "Dự kiến 16:30", completed: false },
    ],
    items: [
      {
        name: "Xà Lách Lô Lô Thủy Canh",
        origin: "Nông Trại Xanh - Đà Lạt",
        cert: "VietGAP",
        qty: "2 KG",
        price: 70000,
        image: "/images/fresh-produce.png",
      },
      {
        name: "Dâu Tây New Zealand Mộc Châu",
        origin: "HTX Dâu Tây Mộc Châu",
        cert: "GlobalGAP",
        qty: "1 Hộp 500g",
        price: 180000,
        image: "/images/fresh-produce.png",
      },
    ],
    voucherUsed: "AGRI30 (-14.000đ)",
    discount: 14000,
    shippingFee: 0,
    total: 236000,
    pointsAwarded: 28,
  },
  {
    id: "AGRI-8790",
    date: "10/10/2026",
    status: "COMPLETED",
    statusText: "Đã giao hàng thành công",
    statusColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
    paymentStatusText: "Đã thanh toán (Đã thu tiền mặt COD)",
    paymentStatusColor: "bg-emerald-100/90 text-emerald-900 border-emerald-300",
    lotCode: "CS-BG-2026-03",
    receiverName: "Lê Quang Minh",
    receiverPhone: "0988 776 655",
    receiverAddress: "Số 123 Cầu Giấy, Hà Nội",
    deliverySlot: "Giao sau 17:30 (Buổi tối)",
    deliveryNote: "Để hàng cẩn thận trong thùng giữ nhiệt",
    driverName: "Trần Đình Trọng",
    driverPhone: "0934.555.222",
    paymentMethod: "COD",
    paymentRef: "COD-CASH-REC-8790",
    paidAt: "2026-10-10T11:20:00Z",
    timeline: [
      { title: "Đặt hàng thành công", time: "09:00 - 09/10/2026", completed: true },
      { title: "Đóng gói tại kho bảo quản lạnh", time: "14:30 - 09/10/2026", completed: true },
      { title: "Vận chuyển xe lạnh", time: "07:00 - 10/10/2026", completed: true },
      { title: "Đã giao thành công & Đã thu tiền COD", time: "11:20 - 10/10/2026", completed: true },
    ],
    items: [
      {
        name: "Cam Sành Hàm Yên Mọng Nước",
        origin: "HTX Cam Sành Tuyên Quang",
        cert: "VietGAP",
        qty: "2 KG",
        price: 90000,
        image: "/images/fresh-produce.png",
      },
      {
        name: "Bơ Sáp 034 Cao Nguyên",
        origin: "Nông Trại Bơ Bảo Lộc",
        cert: "VietGAP",
        qty: "1 KG",
        price: 75000,
        image: "/images/fresh-produce.png",
      },
    ],
    shippingFee: 35000,
    total: 200000,
    pointsAwarded: 24,
  },
];

type SavedVoucher = {
  code: string;
  title: string;
  desc: string;
  type: "discount" | "shipping";
  exp: string;
  min: string;
  status: "active" | "expired" | "used";
  category: string;
};

const mockSavedVouchers: SavedVoucher[] = [
  {
    code: "FREESHIP25",
    title: "Miễn Phí Vận Chuyển Xe Lạnh",
    desc: "Giảm tối đa 25.000đ phí giao hàng xe lạnh bảo quản nông sản tươi",
    type: "shipping",
    exp: "Còn 15 ngày (Đến 15/11/2026)",
    min: "Đơn từ 100.000đ",
    status: "active",
    category: "Vận chuyển",
  },
  {
    code: "AGRI30",
    title: "Ưu Đãi Rau Củ Chính Vụ",
    desc: "Giảm trực tiếp 30.000đ vào tổng tiền hàng cho rau củ quả Đà Lạt & Mộc Châu",
    type: "discount",
    exp: "Đến 31/12/2026",
    min: "Đơn từ 150.000đ",
    status: "active",
    category: "Giảm giá hàng",
  },
  {
    code: "VIETGAP10",
    title: "Khuyến Mãi Nông Sản VietGAP",
    desc: "Giảm 10% tối đa 40.000đ cho tất cả nông sản đạt chứng nhận VietGAP",
    type: "discount",
    exp: "Đến 20/11/2026",
    min: "Đơn từ 200.000đ",
    status: "active",
    category: "Giảm giá hàng",
  },
  {
    code: "CHAOBANMOI",
    title: "Voucher Chào Bạn Mới",
    desc: "Giảm 20.000đ đơn đầu tiên khi đăng ký tài khoản thành công",
    type: "discount",
    exp: "Đã hết hạn",
    min: "Đơn từ 99.000đ",
    status: "expired",
    category: "Chào mừng",
  },
];

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const { addItem } = useCartStore();
  const { notifications, addNotification, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabParam = searchParams.get("tab");
  const orderParam = searchParams.get("order");

  type TabType = "orders" | "messages" | "profile" | "password" | "vouchers" | "notifications" | "points";

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (
      tabParam === "profile" ||
      tabParam === "password" ||
      tabParam === "vouchers" ||
      tabParam === "notifications" ||
      tabParam === "points" ||
      tabParam === "messages"
    ) {
      return tabParam;
    }
    return "orders";
  });

  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  // Poll unread messages count for customer across all farms
  useEffect(() => {
    if (!user?.email) return;
    const fetchUnread = () => {
      orderChatService
        .getInbox({ customerEmail: user.email })
        .then((list) => {
          const total = list.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setUnreadMessagesCount(total);
        })
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user?.email, activeTab]);

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [usedVoucherCodes, setUsedVoucherCodes] = useState<string[]>([]);
  const [isUpdatingOrderStatus, setIsUpdatingOrderStatus] = useState(false);

  // Avatar upload & client-side compression state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<{
    original: string;
    compressed: string;
    saved: number;
  } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.avatarUrl) setAvatarPreview(user.avatarUrl);
  }, [user?.avatarUrl]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const res = await compressAvatarImage(file, 360, 360, 0.82);
      setAvatarPreview(res.dataUrl);
      setCompressionInfo({
        original: formatBytes(res.originalSize),
        compressed: formatBytes(res.compressedSize),
        saved: res.savedPercent,
      });
      updateUser({ avatarUrl: res.dataUrl });
      toast.success(
        `Đã nén tối ưu (${formatBytes(res.originalSize)} -> ${formatBytes(res.compressedSize)}, giảm ${res.savedPercent}%) và cập nhật ảnh đại diện!`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Không thể nén và cập nhật ảnh đại diện.";
      toast.error(message);
    } finally {
      setIsCompressing(false);
      e.target.value = "";
    }
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    setCompressionInfo(null);
    updateUser({ avatarUrl: undefined });
    toast.success("Đã xóa ảnh đại diện, chuyển về avatar chữ mặc định.");
  }

  // Live Supabase data
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedVouchers, setSavedVouchers] = useState<SavedVoucher[]>(mockSavedVouchers);
  const [loyaltyProfile, setLoyaltyProfile] = useState<LoyaltyProfile | null>(null);
  const totalLoyaltyPoints = loyaltyProfile?.currentPoints ?? orders.reduce((sum, o) => sum + (o.pointsAwarded || 0), 100);

  useEffect(() => {
    async function loadSupabaseCustomerData() {
      try {
        const targetEmail = user?.email || "customer@gmail.com";
        const [apiOrders, apiVouchers, apiLoyalty, usedCodes] = await Promise.all([
          catalogService.getOrders(targetEmail),
          catalogService.getVouchers(),
          loyaltyService.getLoyaltyMe(targetEmail),
          catalogService.getUsedVouchers(targetEmail),
        ]);
        setUsedVoucherCodes(usedCodes || []);
        if (apiLoyalty) {
          setLoyaltyProfile(apiLoyalty);
        }
        if (apiOrders && apiOrders.length > 0) {
          // Sort so newest orders (with createdAt or highest id) are ALWAYS at the top (never buried under NULL createdAt legacy rows)
          const sortedApiOrders = [...apiOrders].sort((a, b) => {
            const cleanTarget = (orderParam || "").replace(/^#/, "").trim().toUpperCase();
            if (cleanTarget) {
              if (a.orderCode?.toUpperCase() === cleanTarget && b.orderCode?.toUpperCase() !== cleanTarget) return -1;
              if (b.orderCode?.toUpperCase() === cleanTarget && a.orderCode?.toUpperCase() !== cleanTarget) return 1;
            }
            const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            if (timeA !== timeB) return timeB - timeA;
            return (b.id || 0) - (a.id || 0);
          });

          const mapped: Order[] = sortedApiOrders.map((o) => {
            const details = getOrderStatusDetails(o.status, o.paymentMethod, o.createdAt, o.paidAt, o.paymentRef);
            const rawItems =
              o.items && o.items.length > 0
                ? o.items.map((it) => ({
                    name: it.name?.replace(/Dau Tay New Zealand Moc Chau/i, "Dâu Tây New Zealand Mộc Châu") || "Nông sản VietGAP",
                    origin: it.origin?.replace(/HTX Nong San Sach Moc Chau/i, "HTX Nông Sản Sạch Mộc Châu") || "Nông Trại Xanh Đà Lạt",
                    cert: it.cert || "VietGAP",
                    qty: it.qty,
                    price: it.price,
                    image: it.image || "/images/products/xa-lach.jpg",
                  }))
                : [
                    {
                      name: "Combo Nông Sản Tươi Chính Vụ",
                      origin: "Nông Trại Xanh Đà Lạt",
                      cert: "VietGAP",
                      qty: "1 Phần",
                      price: Math.max(0, (o.total || 0) - (o.shippingFee || 0) + (o.discount || 0)),
                      image: "/images/products/xa-lach.jpg",
                    },
                  ];
            const isQr = (o.paymentMethod || "").toUpperCase() === "PAYOS" || (o.paymentMethod || "").toUpperCase() === "BANK";
            return {
              id: o.orderCode,
              numericId: o.id,
              createdAtRaw: o.createdAt,
              date: o.createdAt
                ? new Date(o.createdAt).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "10/11/2026",
              status: o.status,
              statusText: details.text,
              statusColor: details.color,
              paymentStatusText: details.paymentStatusText,
              paymentStatusColor: details.paymentStatusColor,
              holdMinutesLeft: details.holdMinutesLeft,
              lotCode: o.lotCode || "XL-2026-08",
              receiverName: o.receiverName || user?.name || "Khách Hàng",
              receiverPhone: o.receiverPhone || user?.phone || "0988 776 655",
              receiverAddress: o.receiverAddress || "Hà Nội, Việt Nam",
              deliverySlot: o.deliverySlot || "Giờ hành chính (08:00 - 17:00)",
              deliveryNote: o.deliveryNote || "",
              driverName: o.driverName || "Nguyễn Văn Thắng",
              driverPhone: o.driverPhone || "0912.888.777",
              shippingFee: o.shippingFee || 0,
              total: o.total,
              pointsAwarded: o.pointsAwarded || 20,
              voucherUsed: o.voucherUsed,
              discount: o.discount,
              cancelReason: o.cancelReason,
              paymentMethod: o.paymentMethod || "COD",
              paymentRef: o.paymentRef,
              paidAt: o.paidAt,
              refundStatus: o.refundStatus || undefined,
              refundReason: o.refundReason || undefined,
              refundSolution: o.refundSolution || undefined,
              refundAmount: o.refundAmount || undefined,
              items: rawItems,
              timeline: [
                {
                  title: isQr
                    ? o.status === "PENDING_PAYMENT"
                      ? `Đã tạo đơn & Giữ hàng 30 phút (Chờ quét VietQR)`
                      : "Đặt hàng & Thanh toán VietQR 24/7 thành công"
                    : "Đặt hàng thành công (Phương thức Tiền mặt COD)",
                  time: o.createdAt ? new Date(o.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "Ghi nhận hệ thống",
                  completed: true,
                },
                {
                  title: "Kho lạnh đóng gói & Kiểm định tem QR VietGAP",
                  time: o.status === "PENDING_PAYMENT" ? "Chờ xác nhận thanh toán" : "Tại kho lạnh 2°C - 5°C",
                  completed: !["PENDING_PAYMENT", "CANCELLED"].includes(o.status),
                },
                {
                  title: "Đang vận chuyển xe lạnh chuyên dụng (Nhiệt độ 4.2°C)",
                  time: ["SHIPPING", "DELIVERED", "COMPLETED"].includes(o.status) ? "Tài xế Nguyễn Văn Thắng (0912.888.777)" : "Chờ điều phối xe lạnh",
                  completed: ["SHIPPING", "DELIVERED", "COMPLETED"].includes(o.status),
                },
                {
                  title: isQr
                    ? "Giao hàng thành công tận tay khách hàng"
                    : "Giao hàng thành công & Đã thu tiền mặt (COD)",
                  time: ["DELIVERED", "COMPLETED"].includes(o.status) ? "Đã đối soát hoàn tất" : "Khi khách nhận hàng",
                  completed: ["DELIVERED", "COMPLETED"].includes(o.status),
                },
              ],
            };
          });
          const combined = [...mapped];
          mockOrders.forEach((m) => {
            if (!combined.some((c) => c.id === m.id)) {
              combined.push(m);
            }
          });
          setOrders(combined);
        } else {
          setOrders(mockOrders);
        }
        if (apiVouchers && apiVouchers.length > 0) {
          const usedUpper = new Set((usedCodes || []).map((c) => c.toUpperCase()));
          const mappedVouchers: SavedVoucher[] = apiVouchers.map((v) => ({
            code: v.code,
            title: v.title,
            desc: v.description,
            min: v.minOrder?.startsWith("Đơn") ? v.minOrder : `Đơn từ ${v.minOrder || "100.000đ"}`,
            exp: v.exp,
            status: usedUpper.has(v.code.toUpperCase()) ? "used" : v.active ? "active" : "expired",
            type: v.code.includes("SHIP") ? "shipping" : "discount",
            category: v.code.includes("SHIP") ? "Vận chuyển" : "Giảm giá hàng",
          }));
          setSavedVouchers(mappedVouchers);
        }
      } catch (err) {
        console.error("Error loading customer data from Supabase:", err);
      }
    }
    loadSupabaseCustomerData();
  }, [user?.email, orderParam]);

  useEffect(() => {
    if (
      tabParam === "profile" ||
      tabParam === "password" ||
      tabParam === "vouchers" ||
      tabParam === "notifications" ||
      tabParam === "points" ||
      tabParam === "messages" ||
      tabParam === "orders"
    ) {
      setActiveTab(tabParam);
    }
    if (orderParam && orders.length > 0) {
      const cleanParam = orderParam.replace(/^#/, "").trim().toLowerCase();
      const match = orders.find((o) => o.id?.replace(/^#/, "").trim().toLowerCase() === cleanParam);
      if (match) {
        setSelectedOrder(match);
      }
    }
  }, [tabParam, orderParam, orders]);

  // Auto mark notifications as read when viewing the notifications tab
  useEffect(() => {
    if (activeTab === "notifications" && unreadCount > 0) {
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab, unreadCount, markAllAsRead]);

  // Order filter & search
  const [orderFilter, setOrderFilter] = useState<string>("ALL");
  const [orderSearchText, setOrderSearchText] = useState<string>("");

  // FEATURE 2: ❄️ Cam Kết Chuỗi Lạnh & Hạn Dùng Tươi (Cold-Chain & Best Before Guarantee)
  function getFreshnessDetails(order: Order) {
    const origin = order.items?.[0]?.origin || "Nông Trại Xanh Thủy Canh Đà Lạt";
    const farmShort = origin.replace(/nông trại/i, "").trim();

    const isDelivered = order.status === "DELIVERED" || order.status === "COMPLETED";
    const isShipping = order.status === "SHIPPING";

    if (isDelivered) {
      return {
        status: "DELIVERED",
        tag: "Chuỗi Lạnh & Hạn Dùng Tươi",
        headline: `Đã giao tận tay · Dùng ngon nhất trong 3–5 ngày tới (Bảo quản mát 2°C – 5°C)`,
        subline: `Nông sản tươi từ ${farmShort} được bảo quản xe lạnh khép kín · Bao đổi trả 100% trong 24H nếu dập úa.`,
        hoursBadge: `🌿 Dùng ngon trong 3-5 ngày`,
      };
    }

    if (isShipping) {
      return {
        status: "SHIPPING",
        tag: "Xe Lạnh Đang Vận Chuyển",
        headline: `Xe lạnh chuyên dụng 4.2°C đang di chuyển · Giữ trọn độ tươi giòn từ ${farmShort}`,
        subline: `Tài xế giao chuẩn giờ và hỗ trợ quý khách mở thùng đồng kiểm độ tươi trước khi nhận hàng.`,
        hoursBadge: `❄️ Xe lạnh 4.2°C VietGAP`,
      };
    }

    return {
      status: "PROCESSING",
      tag: "Chuẩn Bị Lô Thu Hoạch Mới",
      headline: `Đang chuẩn bị từ lô thu hoạch mới tại ${farmShort} · Đóng thùng giữ nhiệt kèm tem niêm phong`,
      subline: `Cam kết chuỗi cung ứng khép kín Farm-to-Table, chuẩn bị bàn giao đội xe lạnh thông minh.`,
      hoursBadge: `📦 Giao hỏa tốc trong ngày`,
    };
  }

  // FEATURE 3: ⚡ Mua Lại Nhanh Trong 1 Click (1-Click Fresh Reorder)
  function handleReorder(order: Order) {
    if (!order.items || order.items.length === 0) {
      router.push("/products");
      return;
    }
    let totalItemsAdded = 0;
    order.items.forEach((item, idx) => {
      let parsedQty = 1;
      if (item.qty) {
        const num = parseInt(item.qty.replace(/[^0-9]/g, ""), 10);
        if (!isNaN(num) && num > 0) parsedQty = num;
      }
      addItem(
        {
          id: `reorder-${order.id}-${idx}`,
          name: item.name,
          price: Math.round((item.price || 50000) / parsedQty),
          unit: "Phần",
          farm: item.origin || "Đà Lạt, Lâm Đồng",
          cert: item.cert || "VietGAP",
          image: item.image || "/images/products/rau-cu-combo.png",
          batchCode: order.lotCode || "XL-2026-08",
        },
        parsedQty
      );
      totalItemsAdded += parsedQty;
    });

    addNotification({
      id: `notif-reorder-${order.id}-${Date.now()}`,
      title: `⚡ Mua lại nhanh combo tươi ngon thành công`,
      message: `Đã gom toàn bộ ${order.items.length} món (${totalItemsAdded} phần) nông sản tươi từ đơn #${order.id} vào giỏ hàng của bạn.`,
      type: "order",
      link: `/cart`,
    });

    toast.success(
      `⚡ 1-Click Reorder thành công! Đã gom ${order.items.length} món nông sản tươi vào giỏ hàng. Đang chuyển tới giỏ hàng...`
    );
    router.push("/cart");
  }

  // FEATURE 4: ⭐ Đồng Kiểm Độ Tươi & Đánh Giá Nhận Điểm Thưởng (Photo Freshness Review)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewOrderCode, setReviewOrderCode] = useState("");
  const [reviewProductName, setReviewProductName] = useState("");
  const [reviewProductImage, setReviewProductImage] = useState("");
  const [reviewLotCode, setReviewLotCode] = useState("");
  const [reviewFarmName, setReviewFarmName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState<string>("");
  const [reviewFreshCheck, setReviewFreshCheck] = useState(true);
  const [reviewColdCheck, setReviewColdCheck] = useState(true);
  const [reviewDriverCheck, setReviewDriverCheck] = useState(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState<Record<string, boolean>>({});

  // SHOPEE-STYLE: Chat với Shop & Yêu cầu Trả hàng / Hoàn tiền
  const [chatOrder, setChatOrder] = useState<ApiOrder | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<ApiOrder | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("agri_reviewed_orders");
      if (saved) setReviewedOrders(JSON.parse(saved));
    } catch {}
  }, []);

  // Cancel order modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelTargetCode, setCancelTargetCode] = useState("");
  const [cancelReason, setCancelReason] = useState("Muốn thay đổi địa chỉ hoặc danh sách món");
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // PayOS QR modal state for re-payment
  const [showPayosModal, setShowPayosModal] = useState(false);
  const [payosData, setPayosData] = useState<PaymentLinkResponse | null>(null);
  const [isProcessingPayos, setIsProcessingPayos] = useState(false);
  const [repayHoldSeconds, setRepayHoldSeconds] = useState(1800);

  useEffect(() => {
    if (!showPayosModal) return;
    const t = setInterval(() => {
      setRepayHoldSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [showPayosModal]);

  // Real-time automatic payment polling
  useEffect(() => {
    if (!showPayosModal || !payosData?.orderCode) return;
    const targetCode = payosData.orderCode;
    const interval = setInterval(async () => {
      try {
        const res = await paymentService.checkPaymentStatus(targetCode);
        if (res && res.status === "PAID") {
          clearInterval(interval);
          addNotification({
            id: `notif-paid-${targetCode}`,
            title: `✅ Thanh toán VietQR thành công đơn #${targetCode}`,
            message: `Đơn hàng #${targetCode} đã thanh toán thành công và chuyển sang Chờ đóng gói kho lạnh!`,
            type: "order",
            link: `/dashboard/customer?tab=orders&order=${targetCode}`,
          });
          toast.success(`Ting ting! Đơn hàng #${targetCode} đã nhận được chuyển khoản VietQR thành công!`);
          setShowPayosModal(false);
          setOrders((prev) =>
            prev.map((o) => {
              if (o.id !== targetCode) return o;
              const d = getOrderStatusDetails("PAID", o.paymentMethod, o.createdAtRaw, new Date().toISOString());
              const updated: Order = {
                ...o,
                status: "PAID",
                statusText: d.text,
                statusColor: d.color,
                paymentStatusText: d.paymentStatusText,
                paymentStatusColor: d.paymentStatusColor,
                holdMinutesLeft: 0,
              };
              setSelectedOrder(updated);
              return updated;
            })
          );
        }
      } catch {
        // ignore polling errors
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [showPayosModal, payosData?.orderCode, addNotification]);

  async function handleOpenPayOS(orderCode: string) {
    const targetOrder = orders.find((o) => o.id === orderCode);
    setRepayHoldSeconds((targetOrder?.holdMinutesLeft || 30) * 60);
    try {
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
      const payLink = await paymentService.createPayOSPaymentLink(
        orderCode,
        `${origin}/checkout/success?orderCode=${orderCode}`,
        `${origin}/checkout/cancel?orderCode=${orderCode}`
      );
      setPayosData(payLink);
      setShowPayosModal(true);
    } catch {
      const amount = targetOrder?.total || 180000;
      setPayosData({
        orderCode,
        amount,
        checkoutUrl: "",
        qrCode: `https://img.vietqr.io/image/MB-0389926888-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=AGRITRACE%20VIETNAM`,
        paymentLinkId: orderCode,
        status: "PENDING",
        accountNumber: "0389926888",
        accountName: "AGRITRACE VIETNAM CORP",
        bankName: "MB Bank (Napas 24/7)",
        bin: "970422",
        description: orderCode,
      });
      setShowPayosModal(true);
    }
  }

  async function handleConfirmPayOS() {
    if (!payosData) return;
    setIsProcessingPayos(true);
    try {
      await paymentService.simulatePaymentSuccess(payosData.orderCode);
      const targetOrd = orders.find((o) => o.id === payosData.orderCode);
      const pts = targetOrd?.pointsAwarded || 20;
      addNotification({
        id: `notif-paid-${payosData.orderCode}`,
        title: `✅ Đã thanh toán VietQR đơn #${payosData.orderCode}`,
        message: `Hệ thống đã nhận ${payosData.amount.toLocaleString("vi-VN")}đ cho đơn #${payosData.orderCode}. Đơn hàng đã chuyển sang Chờ đóng gói kho lạnh!`,
        type: "order",
        link: `/dashboard/customer?tab=orders&order=${payosData.orderCode}`,
      });
      addNotification({
        id: `notif-points-${payosData.orderCode}`,
        title: `🎁 Tích điểm thành công: +${pts} điểm AgriClub!`,
        message: `Chúc mừng! Bạn vừa được cộng +${pts} điểm thưởng từ đơn #${payosData.orderCode} vào Ví Hội Viên AgriClub!`,
        type: "voucher",
        link: `/dashboard/customer?tab=points`,
      });
      toast.success(`Thanh toán VietQR thành công & cộng +${pts} điểm AgriClub!`);
      setShowPayosModal(false);
      loyaltyService.getLoyaltyMe(user?.email || "customer@gmail.com").then((lp) => {
        if (lp) setLoyaltyProfile(lp);
      }).catch(() => {});
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== payosData.orderCode) return o;
          const nowIso = new Date().toISOString();
          const d = getOrderStatusDetails("PAID", o.paymentMethod, o.createdAtRaw, nowIso, o.paymentRef);
          const updated: Order = {
            ...o,
            status: "PAID",
            paidAt: nowIso,
            statusText: d.text,
            statusColor: d.color,
            paymentStatusText: d.paymentStatusText,
            paymentStatusColor: d.paymentStatusColor,
            holdMinutesLeft: 0,
            timeline: o.timeline.map((step, i) => (i <= 1 ? { ...step, completed: true } : step)),
          };
          setSelectedOrder(updated);
          return updated;
        })
      );
    } catch {
      toast.error("Không thể xác nhận thanh toán.");
    } finally {
      setIsProcessingPayos(false);
    }
  }

  async function handleQuickConfirmPaid(orderCode: string) {
    setIsProcessingPayos(true);
    try {
      await catalogService.reportTransfer(orderCode);
      const targetOrd = orders.find((o) => o.id === orderCode);
      const nowIso = new Date().toISOString();
      addNotification({
        id: `notif-claimed-paid-${orderCode}`,
        title: `⏳ Đã gửi thông báo chuyển khoản đơn #${orderCode}`,
        message: `Hệ thống đã tiếp nhận thông tin chuyển khoản cho đơn #${orderCode}. Quản trị viên/Kế toán đang đối soát sao kê ngân hàng 24/7 để phê duyệt!`,
        type: "order",
        link: `/dashboard/customer?tab=orders&order=${orderCode}`,
      });
      toast.info(`Đã báo chuyển khoản đơn #${orderCode}! Admin/Kế toán đang kiểm tra sao kê để phê duyệt.`);
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderCode) return o;
          const d = getOrderStatusDetails("PENDING_PAYMENT", o.paymentMethod, o.createdAtRaw, o.paidAt, "PENDING_ADMIN_APPROVAL");
          const updated: Order = {
            ...o,
            paymentRef: "PENDING_ADMIN_APPROVAL",
            paymentStatusText: d.paymentStatusText,
            paymentStatusColor: d.paymentStatusColor,
          };
          if (selectedOrder?.id === orderCode) {
            setSelectedOrder(updated);
          }
          return updated;
        })
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể gửi thông báo chuyển khoản.";
      toast.error(msg);
    } finally {
      setIsProcessingPayos(false);
    }
  }

  // Automatically check live PayOS status for any PENDING_PAYMENT orders when viewing customer orders
  useEffect(() => {
    const pendingQrOrders = orders.filter((o) => o.status === "PENDING_PAYMENT");
    if (pendingQrOrders.length === 0) return;

    let cancelled = false;
    async function verifyPendingPayments() {
      for (const ord of pendingQrOrders) {
        if (cancelled) return;
        try {
          const res = await paymentService.checkPaymentStatus(ord.id);
          if (res && res.status === "PAID" && !cancelled) {
            const nowIso = new Date().toISOString();
            setOrders((prev) =>
              prev.map((o) => {
                if (o.id !== ord.id) return o;
                const d = getOrderStatusDetails("PAID", o.paymentMethod, o.createdAtRaw, nowIso);
                return {
                  ...o,
                  status: "PAID",
                  paidAt: nowIso,
                  statusText: d.text,
                  statusColor: d.color,
                  paymentStatusText: d.paymentStatusText,
                  paymentStatusColor: d.paymentStatusColor,
                  holdMinutesLeft: 0,
                  timeline: o.timeline.map((step, i) => (i <= 1 ? { ...step, completed: true } : step)),
                };
              })
            );
          }
        } catch {
          // ignore
        }
      }
    }

    verifyPendingPayments();
    const interval = setInterval(verifyPendingPayments, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [orders.length]);

  async function handleAdvanceOrderStep(orderCode: string, nextStatus: "SHIPPING" | "DELIVERED") {
    setIsUpdatingOrderStatus(true);
    try {
      await catalogService.updateOrderStatus(orderCode, nextStatus);
      const nowIso = new Date().toISOString();
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== orderCode) return o;
          const d = getOrderStatusDetails(
            nextStatus,
            o.paymentMethod,
            o.createdAtRaw,
            nextStatus === "DELIVERED" ? nowIso : o.paidAt
          );
          const updated: Order = {
            ...o,
            status: nextStatus,
            statusText: d.text,
            statusColor: d.color,
            paymentStatusText: d.paymentStatusText,
            paymentStatusColor: d.paymentStatusColor,
            paidAt: nextStatus === "DELIVERED" ? nowIso : o.paidAt,
            timeline: o.timeline.map((step, idx) => ({
              ...step,
              completed: nextStatus === "DELIVERED" ? true : idx <= 2,
            })),
          };
          if (selectedOrder?.id === orderCode) {
            setSelectedOrder(updated);
          }
          return updated;
        })
      );

      if (nextStatus === "SHIPPING") {
        addNotification({
          id: `notif-ship-${orderCode}`,
          title: `🚚 Đơn hàng #${orderCode} đang giao bằng xe lạnh (4.2°C)`,
          message: `Tài xế Nguyễn Văn Thắng (0912.888.777) đã xuất kho lạnh và đang trên đường giao đơn #${orderCode} đến bạn.`,
          type: "order",
          link: `/dashboard/customer?tab=orders&order=${orderCode}`,
        });
        toast.success(`Đơn #${orderCode} đã chuyển sang trạng thái Đang giao hàng xe lạnh!`);
      } else {
        const targetOrd = orders.find((o) => o.id === orderCode);
        const pts = targetOrd?.pointsAwarded || 20;
        addNotification({
          id: `notif-delivered-${orderCode}`,
          title: `🎉 Giao thành công & Hoàn tất thanh toán đơn #${orderCode}`,
          message: `Đơn hàng #${orderCode} đã được giao thành công và xác nhận Đã thanh toán. Hãy đánh giá 5 sao để nhận thêm ưu đãi!`,
          type: "order",
          link: `/dashboard/customer?tab=orders&order=${orderCode}`,
        });
        addNotification({
          id: `notif-points-${orderCode}`,
          title: `🎁 Tích điểm thành công: +${pts} điểm AgriClub!`,
          message: `Đơn hàng #${orderCode} đã hoàn tất! Bạn vừa được cộng +${pts} điểm thưởng vào Ví Hội Viên AgriClub.`,
          type: "voucher",
          link: `/dashboard/customer?tab=points`,
        });
        loyaltyService.getLoyaltyMe(user?.email || "customer@gmail.com").then((lp) => {
          if (lp) setLoyaltyProfile(lp);
        }).catch(() => {});
        toast.success(`Đã nhận hàng thành công đơn #${orderCode} & cộng +${pts} điểm AgriClub!`);

        // FEATURE 4: Tự động mở modal Đồng Kiểm Độ Tươi & Đánh Giá Nhận Điểm
        setReviewOrderCode(orderCode);
        setReviewProductName(targetOrd?.items?.[0]?.name || "Nông sản tươi VietGAP");
        setReviewProductImage(targetOrd?.items?.[0]?.image || "/images/products/rau-cu-combo.png");
        setReviewLotCode(targetOrd?.lotCode || "SP-KL-05");
        setReviewFarmName(targetOrd?.items?.[0]?.origin || "Nông Trại Xanh Thủy Canh Đà Lạt");
        setReviewRating(5);
        setReviewFreshCheck(true);
        setReviewColdCheck(true);
        setReviewDriverCheck(true);
        setReviewPhotoUrl(targetOrd?.items?.[0]?.image || "/images/products/cai-kale.png");
        setReviewComment("Rau củ rất tươi giòn, cuống mới hái, thùng lạnh bảo quản đạt chuẩn 4.2°C!");
        setShowReviewModal(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể cập nhật trạng thái đơn hàng.";
      toast.error(msg);
    } finally {
      setIsUpdatingOrderStatus(false);
    }
  }

  async function handleCancelOrder() {
    if (!cancelTargetCode) return;
    setIsSubmittingCancel(true);
    try {
      const targetOrd = orders.find((o) => o.id === cancelTargetCode);
      const wasPaid =
        targetOrd?.status === "PAID" ||
        !!targetOrd?.paidAt ||
        ((targetOrd?.paymentMethod || "").toUpperCase() === "PAYOS" && targetOrd?.status !== "PENDING_PAYMENT");

      await catalogService.cancelOrder(cancelTargetCode, cancelReason);

      // Unlock any voucher used on this cancelled order
      if (targetOrd?.voucherUsed) {
        const targetEmail = user?.email || "customer@gmail.com";
        catalogService.unmarkVoucherUsedLocal(targetEmail, targetOrd.voucherUsed);
        catalogService.getUsedVouchers(targetEmail).then((codes) => setUsedVoucherCodes(codes || [])).catch(() => {});
      }

      // Refresh loyalty points if a paid order was cancelled
      loyaltyService.getLoyaltyMe(user?.email || "customer@gmail.com").then((lp) => {
        if (lp) setLoyaltyProfile(lp);
      }).catch(() => {});

      addNotification({
        id: `notif-cancel-${cancelTargetCode}-${Date.now()}`,
        title: wasPaid
          ? `↩️ Đã hủy đơn #${cancelTargetCode} & Khởi tạo hoàn tiền VietQR 100%`
          : `❌ Đã hủy đơn hàng #${cancelTargetCode}`,
        message: wasPaid
          ? `Đơn #${cancelTargetCode} đã hủy (${cancelReason}). Hệ thống đang hoàn trả ${(targetOrd?.total || 0).toLocaleString("vi-VN")}đ về TK ngân hàng, hoàn kho lạnh và mở khóa lại mã Voucher!`
          : `Đơn #${cancelTargetCode} đã hủy (${cancelReason}). Số lượng nông sản giữ tạm đã hoàn về kho lạnh và mã Voucher (nếu có) đã được mở khóa lại.`,
        type: "order",
        link: `/dashboard/customer?tab=orders`,
      });
      toast.success(
        wasPaid
          ? `Đã hủy đơn #${cancelTargetCode}! Hệ thống đã tạo lệnh hoàn tiền 100% & mở khóa lại Voucher.`
          : `Đã hủy đơn hàng #${cancelTargetCode} thành công! Tồn kho & Voucher đã được hoàn lại.`
      );
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== cancelTargetCode) return o;
          const refundRef = wasPaid ? `REFUND-VIETQR-${cancelTargetCode}` : o.paymentRef;
          const d = getOrderStatusDetails("CANCELLED", o.paymentMethod, o.createdAtRaw, o.paidAt, refundRef);
          const updated: Order = {
            ...o,
            status: "CANCELLED",
            paymentRef: refundRef,
            statusText: d.text,
            statusColor: d.color,
            paymentStatusText: d.paymentStatusText,
            paymentStatusColor: d.paymentStatusColor,
            cancelReason,
          };
          if (selectedOrder?.id === cancelTargetCode) {
            setSelectedOrder(updated);
          }
          return updated;
        })
      );
      setShowCancelModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể hủy đơn hàng.";
      toast.error(msg);
    } finally {
      setIsSubmittingCancel(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewOrderCode || !reviewProductName) return;
    setIsSubmittingReview(true);
    try {
      const criteria: string[] = [];
      if (reviewFreshCheck) criteria.push("Rau giòn tươi nguyên vẹn");
      if (reviewColdCheck) criteria.push("Thùng lạnh 4.2°C đạt chuẩn");
      if (reviewDriverCheck) criteria.push("Tài xế thân thiện & đúng hẹn");

      const compositeComment = `[Đồng kiểm: ${criteria.join(" · ")}] ${reviewComment.trim()}${
        reviewPhotoUrl ? ` [Ảnh thực tế: ${reviewPhotoUrl}]` : ""
      }`;

      // 1. Submit review to backend
      try {
        await reviewService.createReview({
          orderCode: reviewOrderCode,
          productName: reviewProductName,
          rating: reviewRating,
          comment: compositeComment,
        });
      } catch (err) {
        console.warn("Backend review submission warning:", err);
      }

      // 2. Award +20 points via loyaltyService
      try {
        const updated = await loyaltyService.awardReviewReward(reviewOrderCode, user?.email || "customer@gmail.com");
        if (updated) {
          setLoyaltyProfile(updated);
        } else {
          setLoyaltyProfile((prev) =>
            prev
              ? {
                  ...prev,
                  currentPoints: prev.currentPoints + 20,
                  lifetimePoints: prev.lifetimePoints + 20,
                }
              : null
          );
        }
      } catch {
        setLoyaltyProfile((prev) =>
          prev
            ? {
                ...prev,
                currentPoints: prev.currentPoints + 20,
                lifetimePoints: prev.lifetimePoints + 20,
              }
            : null
        );
      }

      // 3. Mark order as reviewed in state & localStorage
      setReviewedOrders((prev) => {
        const next = { ...prev, [reviewOrderCode]: true };
        try {
          localStorage.setItem("agri_reviewed_orders", JSON.stringify(next));
        } catch {}
        return next;
      });

      addNotification({
        id: `notif-review-${reviewOrderCode}-${Date.now()}`,
        title: `🎁 +20 Điểm AgriClub từ Đồng Kiểm Đơn #${reviewOrderCode}`,
        message: `Chúc mừng bạn đã nhận +20 điểm AgriClub vào Thẻ VIP từ việc đánh giá & đồng kiểm độ tươi. Dùng điểm này để đổi voucher giảm giá tại trang /loyalty ngay!`,
        type: "voucher",
        link: `/loyalty`,
      });

      toast.success(
        `🎉 Đánh giá thành công! Bạn vừa nhận ngay +20 Điểm AgriClub vào thẻ VIP (Dùng đổi voucher ở /loyalty).`
      );
      setShowReviewModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể gửi đánh giá.";
      toast.error(msg);
    } finally {
      setIsSubmittingReview(false);
    }
  }

  // Voucher filter
  const [voucherFilter, setVoucherFilter] = useState<"ALL" | "ACTIVE" | "SHIPPING" | "DISCOUNT">("ALL");

  // Profile form state
  const [fullName, setFullName] = useState(user?.name || "Lê Quang Minh");
  const [phone, setPhone] = useState("0988 776 655");
  const [address, setAddress] = useState("Số 123 Cầu Giấy, Hà Nội");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Change Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [isSubmittingPw, setIsSubmittingPw] = useState(false);

  // Notifications filter
  const [notifFilter, setNotifFilter] = useState<"ALL" | "UNREAD" | "ORDER" | "VOUCHER" | "SEASON">("ALL");

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingProfile(true);
    setTimeout(() => {
      setIsSavingProfile(false);
      toast.success("Đã cập nhật thông tin hồ sơ thành công!");
    }, 600);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);

    if (!currentPassword) {
      setPwError("Vui lòng nhập mật khẩu hiện tại.");
      return;
    }
    if (!newPassword) {
      setPwError("Vui lòng nhập mật khẩu mới.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword === currentPassword) {
      setPwError("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmittingPw(true);
    try {
      await authService.changePassword({
        email: user?.email || "customer@example.com",
        currentPassword,
        newPassword,
      });
      toast.success("Đổi mật khẩu thành công! Tài khoản của bạn đã được cập nhật.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = getApiErrorMessage(err) || "Đổi mật khẩu thất bại. Mật khẩu hiện tại không chính xác.";
      setPwError(msg);
      toast.error(msg);
    } finally {
      setIsSubmittingPw(false);
    }
  }

  function handleCopyVoucher(code: string) {
    navigator.clipboard?.writeText(code);
    toast.success(`Đã sao chép mã ${code} vào bộ nhớ tạm!`);
  }

  const filteredOrders = orders.filter((ord) => {
    if (orderSearchText.trim()) {
      const q = orderSearchText.trim().toLowerCase();
      const matchCode = ord.id?.toLowerCase().includes(q);
      const matchLot = ord.lotCode?.toLowerCase().includes(q);
      const matchItem = ord.items?.some((it) => it.name.toLowerCase().includes(q));
      if (!matchCode && !matchLot && !matchItem) return false;
    }
    if (orderFilter === "ALL") return true;
    if (orderFilter === "SHIPPING") return ord.status === "SHIPPING";
    if (orderFilter === "DELIVERED") return ord.status === "DELIVERED" || ord.status === "COMPLETED";
    if (orderFilter === "PENDING_PAYMENT") return ord.status === "PENDING_PAYMENT";
    if (orderFilter === "PAID_QR") {
      const isQr = (ord.paymentMethod || "").toUpperCase() === "PAYOS" || (ord.paymentMethod || "").toUpperCase() === "BANK";
      return ord.status === "PAID" || (isQr && !["PENDING_PAYMENT", "CANCELLED", "REFUNDED"].includes(ord.status));
    }
    if (orderFilter === "PREPARING") return ["CONFIRMED", "PREPARING", "PAID"].includes(ord.status);
    if (orderFilter === "CANCELLED") return ord.status === "CANCELLED" || ord.status === "REFUNDED";
    return ord.status === orderFilter;
  });

  const filteredVouchers = savedVouchers.filter((v) => {
    if (voucherFilter === "ACTIVE") return v.status === "active";
    if (voucherFilter === "SHIPPING") return v.type === "shipping";
    if (voucherFilter === "DISCOUNT") return v.type === "discount";
    return true;
  });

  const filteredNotifs = notifications.filter((n) => {
    if (notifFilter === "UNREAD") return !n.read;
    if (notifFilter === "ORDER") return n.type === "order";
    if (notifFilter === "VOUCHER") return n.type === "voucher";
    if (notifFilter === "SEASON") return n.type === "season" || n.type === "promo";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Hidden file input for avatar upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-xs text-stone-500">
        <Link href="/" className="hover:text-[#166534] transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#16261E]">Tài khoản khách hàng</span>
      </div>

      {/* ── Customer Summary Card ── */}
      <div className="bento-card p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            {avatarPreview || user?.avatarUrl ? (
              <img
                src={avatarPreview || user?.avatarUrl}
                alt={user?.name || "Avatar"}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-[#166534] shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#16261E] text-amber-300 flex items-center justify-center font-serif font-bold text-xl sm:text-2xl shadow-sm">
                {user?.name?.charAt(0)?.toUpperCase() || "K"}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              title="Đổi ảnh đại diện (Tự động nén WebP)"
              className="absolute inset-0 rounded-2xl bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              <Camera size={18} />
            </button>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg sm:text-xl font-bold text-[#16261E]">
                {user?.name || "Khách Hàng"}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-100/80 text-amber-900 border border-amber-300">
                <Star size={11} className="fill-amber-600 text-amber-600" /> Hội Viên Vàng
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              {user?.email} · Khách hàng thân thiết AgriTrace
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-[#F0ECE1]">
          <button
            onClick={() => setActiveTab("orders")}
            className="text-center group transition-transform hover:-translate-y-0.5"
          >
            <div className="text-lg sm:text-xl font-mono font-extrabold text-[#166534] group-hover:text-emerald-600">
              {orders.length}
            </div>
            <div className="text-xs text-stone-500">Đơn hàng</div>
          </button>
          <div className="w-px h-8 bg-[#E4DFD5]" />
          <button
            onClick={() => setActiveTab("messages")}
            className="text-center group transition-transform hover:-translate-y-0.5 relative"
          >
            <div className="text-lg sm:text-xl font-extrabold text-[#16261E] group-hover:text-[#166534]">
              {unreadMessagesCount > 0 ? (
                <span className="text-red-600 font-black animate-pulse">{unreadMessagesCount} mới</span>
              ) : (
                <span className="inline-flex items-center justify-center gap-1"><MessageSquare size={16} /> Chat</span>
              )}
            </div>
            <div className="text-xs text-stone-500">Hộp thư Shop</div>
          </button>
          <div className="w-px h-8 bg-[#E4DFD5]" />
          <button
            onClick={() => setActiveTab("vouchers")}
            className="text-center group transition-transform hover:-translate-y-0.5"
          >
            <div className="text-lg sm:text-xl font-mono font-extrabold text-[#16261E] group-hover:text-[#166534]">
              {savedVouchers.filter((v) => v.status === "active").length}
            </div>
            <div className="text-xs text-stone-500">Voucher ví</div>
          </button>
          <div className="w-px h-8 bg-[#E4DFD5]" />
          <button
            onClick={() => setActiveTab("notifications")}
            className="text-center group transition-transform hover:-translate-y-0.5 relative"
          >
            <div className="text-lg sm:text-xl font-mono font-extrabold text-[#16261E] group-hover:text-[#166534]">
              {unreadCount}
            </div>
            <div className="text-xs text-stone-500">Thông báo mới</div>
          </button>
          <div className="w-px h-8 bg-[#E4DFD5]" />
          <button
            onClick={() => setActiveTab("points")}
            className="text-center group transition-transform hover:-translate-y-0.5"
          >
            <div className="text-lg sm:text-xl font-mono font-extrabold text-amber-700 group-hover:text-amber-600">
              {totalLoyaltyPoints}
            </div>
            <div className="text-xs text-stone-500">Điểm tích lũy</div>
          </button>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#E4DFD5] pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "orders"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <ShoppingBag size={16} className={activeTab === "orders" ? "text-[#166534]" : ""} />
          <span>Đơn mua của tôi</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#F6F3EC] border border-[#E4DFD5] text-[#16261E] font-bold">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("messages")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap cursor-pointer",
            activeTab === "messages"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <MessageSquare size={16} className={activeTab === "messages" ? "text-[#166534]" : ""} />
          <span>Hộp Thư & Trò Chuyện</span>
          {unreadMessagesCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-600 text-white font-bold animate-pulse">
              {unreadMessagesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("vouchers")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "vouchers"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <Gift size={16} className={activeTab === "vouchers" ? "text-[#166534]" : ""} />
          <span>Kho Voucher đã lưu</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#F6F3EC] border border-[#E4DFD5] text-[#16261E] font-bold">
            {savedVouchers.filter((v) => v.status === "active").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "notifications"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <Bell size={16} className={activeTab === "notifications" ? "text-[#166534]" : ""} />
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "profile"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <UserIcon size={16} className={activeTab === "profile" ? "text-[#166534]" : ""} />
          <span>Hồ sơ tài khoản</span>
        </button>

        <button
          onClick={() => setActiveTab("password")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "password"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <KeyRound size={16} className={activeTab === "password" ? "text-[#166534]" : ""} />
          <span>Đổi mật khẩu</span>
        </button>

        <button
          onClick={() => setActiveTab("points")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "points"
              ? "border-[#166534] text-[#16261E] bg-white"
              : "border-transparent text-stone-500 hover:text-[#16261E]"
          )}
        >
          <Award size={16} className={activeTab === "points" ? "text-[#166534]" : ""} />
          <span>Điểm & Hội viên</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ĐƠN MUA CỦA TÔI                                    */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Order Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={orderSearchText}
                onChange={(e) => setOrderSearchText(e.target.value)}
                placeholder="Tìm theo mã đơn (#AGRI...), lô hàng hoặc tên món..."
                className="w-full pl-8 pr-8 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 shadow-2xs"
              />
              {orderSearchText && (
                <button
                  type="button"
                  onClick={() => setOrderSearchText("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
            {orderSearchText && (
              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                Tìm thấy {filteredOrders.length} đơn
              </span>
            )}
          </div>

          {/* Order Filter bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none text-xs">
            <span className="text-gray-400 font-semibold text-[11px] uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
              <Tag size={12} className="text-emerald-700" /> Trạng thái:
            </span>
            {(
              [
                { key: "ALL", label: "Tất cả đơn hàng", count: orders.length },
                { key: "PENDING_PAYMENT", label: "Chờ thanh toán (VietQR)", count: orders.filter((o) => o.status === "PENDING_PAYMENT").length },
                {
                  key: "PAID_QR",
                  label: "Đã chuyển khoản (VietQR)",
                  count: orders.filter((o) => {
                    const isQr = (o.paymentMethod || "").toUpperCase() === "PAYOS" || (o.paymentMethod || "").toUpperCase() === "BANK";
                    return o.status === "PAID" || (isQr && !["PENDING_PAYMENT", "CANCELLED", "REFUNDED"].includes(o.status));
                  }).length,
                },
                { key: "PREPARING", label: "Chờ đóng gói KCS", count: orders.filter((o) => ["CONFIRMED", "PREPARING", "PAID"].includes(o.status)).length },
                { key: "SHIPPING", label: "Đang giao hàng xe lạnh", count: orders.filter((o) => o.status === "SHIPPING").length },
                { key: "DELIVERED", label: "Đã hoàn thành", count: orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED").length },
                { key: "CANCELLED", label: "Đã hủy", count: orders.filter((o) => o.status === "CANCELLED" || o.status === "REFUNDED").length },
              ] as const
            ).map((tab) => {
              const isActive = orderFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setOrderFilter(tab.key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full font-medium transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer text-xs",
                    isActive
                      ? "bg-emerald-800 text-white shadow-xs font-semibold ring-1 ring-emerald-900"
                      : "bg-white border border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                        isActive ? "bg-emerald-700 text-emerald-100" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order, orderIdx) => {
              const isHighlighted =
                !!orderParam &&
                order.id?.replace(/^#/, "").trim().toLowerCase() ===
                  orderParam.replace(/^#/, "").trim().toLowerCase();
              const isQr =
                (order.paymentMethod || "").toUpperCase() === "PAYOS" ||
                (order.paymentMethod || "").toUpperCase() === "BANK";
              const isCancelled = order.status === "CANCELLED" || order.status === "REFUNDED";

              // 4-step Cold-Chain fulfillment journey
              let currentStepIdx = 1;
              if (isCancelled) {
                currentStepIdx = 0;
              } else if (order.status === "DELIVERED" || order.status === "COMPLETED") {
                currentStepIdx = 4;
              } else if (order.status === "SHIPPING") {
                currentStepIdx = 3;
              } else if (["CONFIRMED", "PREPARING", "PAID"].includes(order.status)) {
                currentStepIdx = 2;
              } else {
                currentStepIdx = 1;
              }

              const steps = [
                {
                  step: 1,
                  role: "NÔNG DÂN",
                  title: "Trang trại thu hoạch",
                  desc: order.lotCode ? `Lô ${order.lotCode} · KCS Xuất vườn` : "Thu hoạch & KCS Đạt",
                  icon: Sprout,
                },
                {
                  step: 2,
                  role: "THỦ KHO",
                  title: "Kho lạnh & Đóng gói",
                  desc: currentStepIdx > 2 ? "Bảo quản 2-5°C · Đã đóng thùng" : currentStepIdx === 2 ? "Đang đóng thùng lạnh FEFO" : "Chờ nhập kho mát",
                  icon: Warehouse,
                },
                {
                  step: 3,
                  role: "XE LẠNH IOT",
                  title: "Vận chuyển xe lạnh",
                  desc: currentStepIdx > 3 ? "Đã tới điểm giao" : currentStepIdx === 3 ? `Xe 49C · 4.2°C (${order.driverName})` : "Chờ xếp lên xe lạnh",
                  icon: Truck,
                },
                {
                  step: 4,
                  role: "KHÁCH HÀNG",
                  title: "Giao tận tay",
                  desc: currentStepIdx >= 4 ? "Đồng kiểm & Đã nhận" : "Dự kiến trong ngày",
                  icon: CheckCircle2,
                },
              ];

              return (
                <div
                  key={order.id}
                  className={cn(
                    "bg-white rounded-2xl border shadow-xs overflow-hidden transition-all duration-200 hover:shadow-md",
                    isHighlighted
                      ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-gradient-to-b from-emerald-50/15 to-white"
                      : "border-gray-200/90 hover:border-emerald-300"
                  )}
                >
                  {/* Header: Order ID + Date + Lot + Two Badges */}
                  <div className="p-4 sm:p-5 pb-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 shadow-2xs">
                        <Package size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-gray-900 text-sm tracking-tight">#{order.id}</span>
                          {(isHighlighted || orderIdx === 0) && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide shadow-2xs">
                              Mới nhất
                            </span>
                          )}
                          <Link
                            href={order.lotCode ? `/traceability?lot=${order.lotCode}` : "/traceability"}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-colors"
                            title="Bấm để xem hồ sơ truy xuất nguồn gốc lô hàng"
                          >
                            <QrCode size={12} className="text-emerald-700" />
                            <span>Lô {order.lotCode}</span>
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={11} className="text-gray-400" /> {order.date}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Badge 1: Trạng thái Thanh toán */}
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-2xs",
                          order.paymentStatusColor
                        )}
                        title="Trạng thái thanh toán đơn hàng"
                      >
                        <CreditCard size={12} />
                        <span>{order.paymentStatusText}</span>
                      </span>

                      {/* Badge 2: Trạng thái Vận chuyển / Đơn hàng */}
                      <span
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 shadow-2xs",
                          order.statusColor
                        )}
                        title="Trạng thái vận chuyển & xử lý kho lạnh"
                      >
                        <Truck size={12} />
                        <span>{order.statusText}</span>
                      </span>
                    </div>
                  </div>

                  {/* FEATURE 2: ❄️ CAM KẾT CHUỖI LẠNH & HẠN DÙNG TƯƠI (Đậm nét, Rõ ràng, Tương phản cao) */}
                  {!isCancelled && (() => {
                    const fresh = getFreshnessDetails(order);
                    return (
                      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-[#0A261D] text-white border-b border-[#051711] shadow-inner transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold bg-emerald-900/90 text-emerald-300 px-2 py-0.5 rounded border border-emerald-600/50 flex items-center gap-1 shadow-2xs">
                                <ShieldCheck size={11} className="text-emerald-400" /> {fresh.tag}
                              </span>
                              <span className="font-bold text-white text-xs sm:text-sm">
                                {fresh.headline}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-200 mt-0.5 hidden sm:block font-normal">
                              {fresh.subline}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-auto shrink-0">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5 shadow-2xs">
                            <Sparkles size={12} className="text-amber-300" />
                            <span>{fresh.hoursBadge}</span>
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Cold-Chain Stepper (nếu không hủy) */}
                  {!isCancelled && (
                    <div className="bg-[#FBF9F5] border-b border-gray-100 px-4 sm:px-6 py-3.5">
                      <div className="flex items-center justify-between relative">
                        {/* Connecting line */}
                        <div className="absolute left-6 right-6 top-4 -translate-y-1/2 h-0.5 bg-gray-200 -z-0 hidden sm:block" />
                        <div
                          className="absolute left-6 top-4 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-500 -z-0 hidden sm:block"
                          style={{
                            width:
                              currentStepIdx === 1
                                ? "0%"
                                : currentStepIdx === 2
                                ? "33%"
                                : currentStepIdx === 3
                                ? "66%"
                                : "calc(100% - 3rem)",
                          }}
                        />

                        {steps.map((st) => {
                          const StepIcon = st.icon;
                          const isDone = st.step < currentStepIdx;
                          const isCurrent = st.step === currentStepIdx;
                          return (
                            <div
                              key={st.step}
                              className="flex flex-col sm:items-center relative z-10 sm:text-center flex-1 first:items-start last:items-end sm:first:items-center sm:last:items-center"
                            >
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs",
                                  isDone
                                    ? "bg-emerald-700 text-white"
                                    : isCurrent
                                    ? "bg-emerald-800 text-white ring-4 ring-emerald-100 shadow-xs"
                                    : "bg-white text-gray-400 border border-gray-300"
                                )}
                              >
                                {isDone ? <Check size={14} className="stroke-[3]" /> : <StepIcon size={14} />}
                              </div>
                              <div className="mt-1.5 space-y-0.5">
                                <span
                                  className={cn(
                                    "text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded font-extrabold inline-block mb-0.5 shadow-2xs",
                                    isDone || isCurrent
                                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300/70"
                                      : "bg-gray-100 text-gray-500 border border-gray-200"
                                  )}
                                >
                                  {st.role}
                                </span>
                                <p
                                  className={cn(
                                    "text-xs font-bold leading-tight",
                                    isDone || isCurrent ? "text-gray-900" : "text-gray-400"
                                  )}
                                >
                                  {st.title}
                                </p>
                                <p
                                  className={cn(
                                    "text-[10px] leading-tight hidden sm:block",
                                    isCurrent
                                      ? "text-emerald-800 font-semibold flex items-center justify-center gap-1"
                                      : "text-gray-500"
                                  )}
                                >
                                  {isCurrent && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping inline-block" />
                                  )}
                                  {st.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 30-Minute Inventory Hold Banner if PENDING_PAYMENT */}
                  {order.status === "PENDING_PAYMENT" && (
                    <div className="mx-4 sm:mx-5 my-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start sm:items-center gap-2.5 text-amber-950">
                        <Clock size={16} className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                        <div>
                          {order.paymentRef === "PENDING_ADMIN_APPROVAL" ? (
                            <>
                              <strong className="text-amber-900 font-extrabold">⏳ Đã tiếp nhận báo chuyển khoản:</strong> Kế toán AgriTrace đang đối soát sao kê ngân hàng 24/7 để xác nhận đơn cho bạn (thường mất 1–3 phút). Vui lòng giữ biên lai đối chiếu nếu cần!
                            </>
                          ) : order.paymentRef === "REJECTED_TRANSFER" ? (
                            <>
                              <strong className="text-rose-900 font-extrabold">⚠️ Kế toán chưa nhận được tiền:</strong> Chưa tìm thấy giao dịch sao kê cho đơn #{order.id}. Vui lòng kiểm tra lại tài khoản hoặc quét lại VietQR đúng nội dung!
                            </>
                          ) : (
                            <>
                              <strong>Kho lạnh đang tạm giữ nông sản 30 phút</strong> (Còn{" "}
                              <strong className="text-amber-900 font-extrabold">{order.holdMinutesLeft || 30} phút</strong>).
                              Vui lòng quét mã VietQR bên dưới hoặc ấn xác nhận nếu bạn vừa chuyển khoản!
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {order.paymentRef === "PENDING_ADMIN_APPROVAL" ? (
                          <span className="px-3.5 py-1.5 rounded-lg bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300 flex items-center gap-1.5 shadow-2xs cursor-default">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                            Đang chờ Admin duyệt
                          </span>
                        ) : (
                          <button
                            onClick={() => handleQuickConfirmPaid(order.id)}
                            disabled={isProcessingPayos}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
                          >
                            ✓ Tôi đã chuyển khoản
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenPayOS(order.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <QrCode size={13} />
                          <span>Mở mã VietQR →</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="px-4 sm:px-5 py-3 divide-y divide-gray-100 space-y-3">
                    {(order.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-4 pt-3 first:pt-0"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/80 shrink-0 shadow-2xs">
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900 hover:text-emerald-800 transition-colors">{item.name}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
                              <span>{item.origin}</span>
                              <span className="text-gray-300">·</span>
                              <span className="px-2 py-0.2 rounded-md bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 text-[11px]">{item.cert}</span>
                              <span className="text-gray-300">·</span>
                              <span className="font-semibold text-gray-700">SL: {item.qty}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-extrabold text-gray-900">
                            {(item.price || 0).toLocaleString("vi-VN")} đ
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Consolidated Clean Supply Chain & Delivery Section */}
                  <div className="px-4 sm:px-5 pb-3">
                    <div className="rounded-2xl border border-gray-200/90 bg-[#FBF9F5] p-3.5 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-200/80 text-xs">
                      {/* Left: Receiver & Delivery Destination */}
                      <div className="space-y-2 md:pr-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900">
                            <MapPin size={14} className="text-emerald-700 shrink-0" />
                            <span>Địa chỉ nhận hàng (Khách Hàng)</span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Giao tận nơi 24H
                          </span>
                        </div>
                        <div className="space-y-1 pl-4">
                          <div className="flex items-center gap-2 font-bold text-gray-900">
                            <span>{order.receiverName}</span>
                            <span className="text-gray-300">|</span>
                            <a
                              href={`tel:${order.receiverPhone}`}
                              className="text-emerald-800 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <Phone size={11} className="text-emerald-700" />
                              <span>{order.receiverPhone}</span>
                            </a>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-[11px]" title={order.receiverAddress}>
                            {order.receiverAddress}
                          </p>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 pl-4 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-gray-400" />
                            <span>Khung giờ: <strong className="text-gray-700">{order.deliverySlot || "Hỏa tốc xe lạnh trong ngày"}</strong></span>
                          </span>
                          {order.deliveryNote && (
                            <span className="text-gray-500 italic">· Dặn: &ldquo;{order.deliveryNote}&rdquo;</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Multi-role Supply Chain Coordination */}
                      <div className="space-y-2.5 md:pl-4 pt-3 md:pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900">
                            <Truck size={14} className="text-emerald-700 shrink-0" />
                            <span>Điều phối chuỗi lạnh liên vai trò</span>
                          </div>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                            <ThermometerSnowflake size={11} className="text-blue-700" /> 4.2°C VietGAP
                          </span>
                        </div>

                        <div className="space-y-2 text-[11px] pl-4">
                          {/* Role: Nông Dân */}
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-900 font-extrabold border border-emerald-300/70 shrink-0 mt-0.5">
                              NÔNG DÂN
                            </span>
                            <span className="text-gray-600">
                              <strong>{order.items?.[0]?.origin || "Nông Trại Xanh Thủy Canh Đà Lạt"}</strong> · Cấp Lô{" "}
                              <Link
                                href={`/traceability?lot=${order.lotCode || "SP-KL-05"}`}
                                className="font-mono font-bold text-emerald-900 underline hover:text-emerald-700 decoration-emerald-400"
                                title="Xem hồ sơ nông trại & nhật ký canh tác của Nông Dân"
                              >
                                #{order.lotCode || "SP-KL-05"}
                              </Link>{" "}
                              ({order.items?.[0]?.cert || "VietGAP"})
                            </span>
                          </div>

                          {/* Role: Xe Lạnh IoT */}
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-extrabold border border-blue-300/70 shrink-0 mt-0.5">
                              ĐỘI XE LẠNH
                            </span>
                            <span className="text-gray-600">
                              {order.status === "DELIVERED" || order.status === "COMPLETED" ? (
                                <strong className="text-emerald-800">Đã giao tận nơi an toàn · Thùng xe 4.2°C chuẩn VietGAP</strong>
                              ) : order.status === "SHIPPING" ? (
                                <span className="text-blue-800 font-semibold">
                                  Đang vận chuyển 4.2°C · Tài xế <strong>{order.driverName}</strong> (<a href={`tel:${order.driverPhone}`} className="underline font-bold">{order.driverPhone}</a>)
                                </span>
                              ) : (
                                <span className="text-amber-800 font-medium">Bảo quản kho mát 2-5°C (FEFO) · Đang chờ bàn giao đội xe</span>
                              )}
                            </span>
                          </div>

                          {/* Payment status */}
                          <div className="flex items-center gap-2 pt-1 border-t border-gray-200/60 text-gray-600">
                            <CreditCard size={12} className="text-gray-400 shrink-0" />
                            <span>
                              {isQr ? (
                                order.status === "PENDING_PAYMENT" ? (
                                  order.paymentRef === "PENDING_ADMIN_APPROVAL" ? (
                                    <span className="text-amber-800 font-bold">⏳ Đang chờ Kế toán đối soát sao kê</span>
                                  ) : (
                                    <span className="text-amber-800 font-semibold">Chờ quét VietQR để kho xuất hàng</span>
                                  )
                                ) : (
                                  <span className="text-emerald-800 font-semibold">
                                    Đã thanh toán VietQR 24/7 {order.paymentRef ? `· Mã GD: ${order.paymentRef}` : ""}
                                  </span>
                                )
                              ) : (
                                <span>Thu tiền mặt COD khi nhận: <strong>{(order.total || 0).toLocaleString("vi-VN")} đ</strong></span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean Live Status Alert if SHIPPING (NO duplicate button) */}
                  {order.status === "SHIPPING" && (
                    <div className="mx-4 sm:mx-5 mb-3 p-3 rounded-xl bg-blue-50/90 border border-blue-200 flex items-center justify-between text-xs text-blue-950">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping shrink-0" />
                        <span>
                          <strong>Đơn hàng đang trên xe lạnh 4.2°C:</strong> Tài xế <strong>{order.driverName}</strong> ({order.driverPhone}) đang di chuyển tới bạn. Quý khách vui lòng để ý điện thoại và bấm nút <strong>[Đã nhận được hàng]</strong> bên dưới khi nhận nông sản.
                        </span>
                      </div>
                    </div>
                  )}

                  {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
                    <div className="mx-4 sm:mx-5 mb-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-700 shrink-0" />
                        <span>
                          <strong>Giao hàng thành công & đối soát chuỗi lạnh hoàn tất:</strong> Nông sản tươi ngon, giữ trọn dưỡng chất VietGAP từ nông trại.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="p-4 sm:p-5 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <Truck size={13} className="text-emerald-700" />
                        <span>
                          Giao xe lạnh chuyên dụng (+{order.pointsAwarded} điểm) ·{" "}
                          <strong className="text-gray-800">
                            {isQr ? "Chuyển khoản VietQR 24/7" : "Tiền mặt khi nhận hàng (COD)"}
                          </strong>
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 flex items-baseline gap-2">
                        <span>Tổng thanh toán:</span>
                        <span className="text-lg font-extrabold text-emerald-800">
                          {(order.total || 0).toLocaleString("vi-VN")} đ
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* VietQR Payment Button if PENDING_PAYMENT */}
                      {order.status === "PENDING_PAYMENT" && (
                        <button
                          onClick={() => handleOpenPayOS(order.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <QrCode size={13} />
                          <span>Quét mã VietQR</span>
                        </button>
                      )}

                      {/* Confirm Received & Paid Button when SHIPPING */}
                      {order.status === "SHIPPING" && (
                        <button
                          onClick={() => handleAdvanceOrderStep(order.id, "DELIVERED")}
                          disabled={isUpdatingOrderStatus}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          <span>Đã nhận được hàng</span>
                        </button>
                      )}

                      {/* Cancel Button if eligible */}
                      {["PENDING_PAYMENT", "CONFIRMED", "PREPARING", "PAID"].includes(order.status) && (
                        <button
                          onClick={() => {
                            setCancelTargetCode(order.id);
                            setShowCancelModal(true);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Hủy đơn
                        </button>
                      )}

                      {/* FEATURE 4: Review Button if DELIVERED or COMPLETED */}
                      {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
                        reviewedOrders[order.id] ? (
                          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-default">
                            <CheckCircle2 size={13} className="text-emerald-700" />
                            <span>✓ Đã đồng kiểm 5★ (+20 Điểm)</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setReviewOrderCode(order.id);
                              setReviewProductName(order.items[0]?.name || "Nông sản tươi");
                              setReviewProductImage(order.items[0]?.image || "/images/products/rau-cu-combo.png");
                              setReviewLotCode(order.lotCode || "SP-KL-05");
                              setReviewFarmName(order.items[0]?.origin || "Nông Trại Xanh Thủy Canh Đà Lạt");
                              setReviewRating(5);
                              setReviewFreshCheck(true);
                              setReviewColdCheck(true);
                              setReviewDriverCheck(true);
                              setReviewPhotoUrl(order.items[0]?.image || "/images/products/cai-kale.png");
                              setReviewComment("Rau củ rất tươi giòn, cuống mới hái, thùng lạnh bảo quản đạt chuẩn 4.2°C!");
                              setShowReviewModal(true);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs"
                          >
                            <Star size={13} className="fill-amber-400 text-amber-500" />
                            <span>Đồng kiểm & Đánh giá (+20đ)</span>
                          </button>
                        )
                      )}

                      {/* FEATURE: Chat với Shop (Shopee-style) */}
                      <button
                        onClick={() => {
                          setActiveTab("messages");
                          router.push(`/dashboard/customer?tab=messages&order=${order.id}`);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer hover:border-emerald-400 active:scale-95"
                        title="Mở hộp thư chat trực tiếp với chủ nông trại về đơn hàng này"
                      >
                        <MessageSquare size={13} className="text-emerald-700" />
                        <span>Chat với Shop</span>
                      </button>

                      {/* FEATURE: Khiếu nại / Trả hàng (Shopee-style) */}
                      {order.refundStatus === "PENDING" ? (
                        <button
                          onClick={() => setChatOrder({ ...order, orderCode: order.id, total: order.total } as unknown as ApiOrder)}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-100 text-amber-950 border border-amber-400 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer animate-pulse"
                          title="Đang có yêu cầu hoàn tiền, bấm để xem chi tiết trao đổi"
                        >
                          <AlertTriangle size={13} className="text-amber-700" />
                          <span>Đang chờ hoàn tiền</span>
                        </button>
                      ) : order.refundStatus === "APPROVED" || order.status === "REFUNDED" ? (
                        <span className="px-3.5 py-1.5 rounded-xl bg-red-100 text-red-950 border border-red-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-default">
                          <CheckCircle2 size={13} className="text-red-700" />
                          <span>Đã hoàn tiền</span>
                        </span>
                      ) : (order.status === "DELIVERED" || order.status === "COMPLETED" || order.status === "SHIPPING") ? (
                        <button
                          onClick={() => setDisputeOrder({ ...order, orderCode: order.id, total: order.total } as unknown as ApiOrder)}
                          className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-red-50 text-red-800 border border-red-200 hover:border-red-300 text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                          title="Gửi yêu cầu đổi trả hoặc hoàn tiền nếu nông sản bị hư hại"
                        >
                          <AlertTriangle size={13} className="text-red-600" />
                          <span>Trả hàng / Hoàn tiền</span>
                        </button>
                      ) : null}

                      <Link
                        href={order.lotCode ? `/traceability?lot=${order.lotCode}` : "/traceability"}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 hover:border-emerald-400"
                        title="Bấm để truy xuất nguồn gốc lô hàng này"
                      >
                        <QrCode size={13} className="text-emerald-700" />
                        <span>Truy xuất QR</span>
                      </Link>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Eye size={13} />
                        <span>Xem chi tiết</span>
                      </button>

                      {/* FEATURE 3: Mua Lại Nhanh */}
                      <button
                        onClick={() => handleReorder(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                        title="Gom toàn bộ combo nông sản tươi của đơn này vào giỏ hàng để mua lại"
                      >
                        <RefreshCw size={13} />
                        <span>Mua lại đơn này</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredOrders.length === 0 && (
              <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center space-y-4 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                  <ShoppingBag size={28} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-gray-900">Chưa có đơn hàng nào</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Đơn hàng sẽ hiển thị tại đây sau khi bạn đặt mua thành công. Hãy khám phá ngay các loại nông sản đạt chuẩn VietGAP!
                  </p>
                </div>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span>Khám phá nông sản sạch</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: HỘP THƯ & TRÒ CHUYỆN VỚI CÁC NHÀ VƯỜN               */}
      {/* ========================================================= */}
      {activeTab === "messages" && (
        <div className="space-y-4 animate-fade-in-up">
          <CustomerMessagesPanel
            customerEmail={user?.email}
            fallbackOrders={orders}
            initialOrderCode={orderParam || undefined}
            onViewOrderDetail={(code) => {
              const cleanParam = code.replace(/^#/, "").trim().toLowerCase();
              const match = orders.find((o) => o.id?.replace(/^#/, "").trim().toLowerCase() === cleanParam);
              if (match) setSelectedOrder(match);
            }}
          />
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: KHO VOUCHER ĐÃ LƯU                                 */}
      {/* ========================================================= */}
      {activeTab === "vouchers" && (
        <div className="space-y-5 animate-fade-in-up">
          {/* Top Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Gift size={18} /> Kho Voucher & Mã Ưu Đãi Đã Lưu
              </h2>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Các mã giảm giá đã lưu sẵn trong ví của bạn. Chọn mã và áp dụng ngay khi thanh toán đơn hàng.
              </p>
            </div>
            <Link
              href="/vouchers"
              className="px-4 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-bold transition-colors shrink-0 text-center shadow-xs"
            >
              Săn thêm mã mới →
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1">
            {(
              [
                { key: "ALL", label: "Tất cả" },
                { key: "ACTIVE", label: "Còn hiệu lực" },
                { key: "SHIPPING", label: "Freeship xe lạnh" },
                { key: "DISCOUNT", label: "Mã giảm giá" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setVoucherFilter(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold transition-colors whitespace-nowrap",
                  voucherFilter === tab.key
                    ? "bg-emerald-700 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Vouchers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVouchers.map((v) => {
              const isUsed = v.status === "used" || usedVoucherCodes.includes(v.code.toUpperCase());
              const isActive = v.status === "active" && !isUsed;
              return (
                <div
                  key={v.code}
                  className={cn(
                    "bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all relative overflow-hidden",
                    isActive
                      ? "border-gray-200/90 hover:border-emerald-300"
                      : "border-gray-200 bg-gray-50/60 opacity-65"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className={cn("px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200 flex items-center gap-1", isUsed && "line-through bg-gray-100 text-gray-500 border-gray-200")}>
                          <Tag size={12} />
                          {v.code}
                        </span>
                        {!isUsed && (
                          <button
                            onClick={() => handleCopyVoucher(v.code)}
                            title="Sao chép mã"
                            className="p-1 rounded-md text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          >
                            <Copy size={13} />
                          </button>
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : isUsed
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}
                      >
                        {isActive ? "Khả dụng (1 lượt/TK)" : isUsed ? "Đã dùng (1/1 lượt)" : "Hết hạn"}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{v.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{v.desc}</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 text-[11px] space-y-1 text-gray-500">
                      <div className="flex items-center justify-between">
                        <span>Điều kiện:</span>
                        <span className="font-semibold text-gray-800">{v.min}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Quy định:</span>
                        <span className="font-medium text-emerald-700">Tối đa 1 lần / 1 tài khoản</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyVoucher(v.code)}
                      disabled={isUsed}
                      className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Copy size={13} />
                      <span>Sao chép mã</span>
                    </button>
                    {isActive ? (
                      <Link
                        href="/products"
                        className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold text-center transition-colors shadow-xs"
                      >
                        Dùng ngay
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-500 text-xs font-semibold cursor-not-allowed"
                      >
                        {isUsed ? "Đã sử dụng" : "Hết hạn"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: THÔNG BÁO                                          */}
      {/* ========================================================= */}
      {activeTab === "notifications" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-xs space-y-5 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Bell size={18} className="text-emerald-700" />
                Hộp Thư Thông Báo Của Bạn
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Cập nhật hành trình đơn hàng, mã giảm giá mới và nhật ký an toàn thực phẩm.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <CheckCheck size={14} />
                <span>Đánh dấu đã đọc tất cả ({unreadCount})</span>
              </button>
            )}
          </div>

          {/* Notification Filter */}
          <div className="flex items-center gap-2 text-xs flex-wrap">
            {(
              [
                { key: "ALL", label: "Tất cả" },
                { key: "UNREAD", label: `Chưa đọc (${unreadCount})` },
                { key: "ORDER", label: "Đơn hàng" },
                { key: "VOUCHER", label: "Voucher & Điểm" },
                { key: "SEASON", label: "Mùa vụ & Khuyến mãi" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setNotifFilter(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold transition-colors",
                  notifFilter === tab.key
                    ? "bg-emerald-700 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          <div className="divide-y divide-gray-100">
            {filteredNotifs.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">
                Không có thông báo nào trong mục này.
              </div>
            ) : (
              filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => {
                    if (!n.read) markAsRead(n.id);
                  }}
                  className={cn(
                    "py-4 px-3 sm:px-4 rounded-xl transition-colors flex items-start justify-between gap-4 group cursor-pointer",
                    !n.read ? "bg-emerald-50/40 hover:bg-emerald-50/70" : "hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                        n.type === "order"
                          ? "bg-blue-100 text-blue-700"
                          : n.type === "voucher"
                          ? "bg-amber-100 text-amber-700"
                          : n.type === "promo"
                          ? "bg-rose-100 text-rose-700"
                          : n.type === "season"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {n.type === "order" ? (
                        <Truck size={17} />
                      ) : n.type === "voucher" ? (
                        <Gift size={17} />
                      ) : n.type === "promo" ? (
                        <Sparkles size={17} />
                      ) : n.type === "season" ? (
                        <Sprout size={17} />
                      ) : (
                        <ShieldCheck size={17} />
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-gray-900">{n.title}</h4>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-400">
                        <span>{n.createdAt}</span>
                        {n.link && (
                          <Link
                            href={n.link}
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(n.id);
                            }}
                            className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                          >
                            <span>Xem chi tiết</span>
                            <ExternalLink size={11} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {!n.read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        title="Đánh dấu đã đọc"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-white transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      title="Xóa thông báo"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: HỒ SƠ TÀI KHOẢN                                    */}
      {/* ========================================================= */}
      {activeTab === "profile" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs animate-fade-in-up space-y-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Thông tin hồ sơ cá nhân</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Quản lý ảnh đại diện, thông tin tài khoản và địa chỉ giao hàng nhận nông sản.
            </p>
          </div>

          {/* Avatar Upload & Optimization Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group shrink-0">
              {avatarPreview || user?.avatarUrl ? (
                <img
                  src={avatarPreview || user?.avatarUrl}
                  alt={user?.name || "Avatar"}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-bold text-2xl shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "K"}
                </div>
              )}
              {isCompressing && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center text-white text-xs font-semibold">
                  <RefreshCw size={20} className="animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-2.5 flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isCompressing}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Upload size={14} />
                  <span>{isCompressing ? "Đang nén ảnh..." : "Tải ảnh đại diện mới"}</span>
                </button>

                {(avatarPreview || user?.avatarUrl) && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 size={13} className="text-red-500" />
                    <span>Gỡ ảnh</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Định dạng hỗ trợ: JPG, PNG, WebP. Hệ thống tự động nén bằng HTML5 Canvas xuống WebP 360×360, giảm hơn 90% dung lượng giúp tải trang siêu tốc.
              </p>

              {compressionInfo && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-800">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>
                    Đã nén tối ưu: {compressionInfo.original} ➔ {compressionInfo.compressed} (Tiết kiệm {compressionInfo.saved}%)
                  </span>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="max-w-2xl space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Họ và tên</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <UserIcon size={16} />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Tên tài khoản (Username)</label>
                <input
                  type="text"
                  disabled
                  value={user?.email?.split("@")[0] || "customer"}
                  className="w-full h-10 px-3 text-sm rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Địa chỉ Email</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || "customer@gmail.com"}
                    className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700">Số điện thoại</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Địa chỉ nhận hàng mặc định</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <MapPin size={16} />
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-10 pl-10 pr-3 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                {isSavingProfile ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Lưu thay đổi thông tin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("password")}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <KeyRound size={14} />
                <span>Đổi mật khẩu tài khoản</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: ĐỔI MẬT KHẨU                                        */}
      {/* ========================================================= */}
      {activeTab === "password" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs animate-fade-in-up max-w-xl">
          <div className="mb-6">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Lock size={18} className="text-emerald-700" />
              Đổi Mật Khẩu Tài Khoản
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Để bảo vệ tài khoản, bạn nên sử dụng mật khẩu mạnh dài ít nhất 6 ký tự kết hợp chữ và số.
            </p>
          </div>

          {pwError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
              {pwError}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Mật khẩu hiện tại</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock size={16} />
                </div>
                <input
                  type={showCurrentPw ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Nhập mật khẩu đang dùng"
                  className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPw(!showCurrentPw)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Mật khẩu mới</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type={showNewPw ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                  className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px]">
                  <span className="text-gray-400">Độ dài:</span>
                  <span
                    className={cn(
                      "font-semibold",
                      newPassword.length >= 6 ? "text-emerald-600" : "text-amber-600"
                    )}
                  >
                    {newPassword.length >= 6 ? "Hợp lệ" : "Quá ngắn (cần ít nhất 6 ký tự)"}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">Xác nhận mật khẩu mới</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <CheckCircle2 size={16} />
                </div>
                <input
                  type={showConfirmPw ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full h-10 pl-10 pr-10 text-sm rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] text-red-500 pt-0.5">Mật khẩu xác nhận chưa khớp.</p>
              )}
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmittingPw}
                className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmittingPw ? (
                  <span>Đang xử lý...</span>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Cập nhật mật khẩu mới</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: ĐIỂM & HỘI VIÊN                                     */}
      {/* ========================================================= */}
      {activeTab === "points" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-xs space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md">
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-100 font-bold">
                Hạng hội viên AgriClub của bạn
              </span>
              <h2 className="text-2xl font-extrabold mt-0.5 flex items-center gap-2">
                Hội Viên {loyaltyProfile?.tier || "Vàng"} ({loyaltyProfile?.pointsMultiplier ? `${loyaltyProfile.pointsMultiplier}x` : "1.5x"} Điểm)
              </h2>
              <p className="text-xs text-amber-100 mt-1">
                Tổng chi tiêu tích lũy: <strong>{(loyaltyProfile?.totalSpent ?? 0).toLocaleString("vi-VN")} đ</strong>
                {loyaltyProfile?.nextTier && loyaltyProfile.nextTier !== "MAX" && (
                  <span> · Mục tiêu hạng {loyaltyProfile.nextTier}: {loyaltyProfile.nextTierThreshold.toLocaleString("vi-VN")} đ</span>
                )}
              </p>
            </div>
            <div className="text-right sm:text-right">
              <div className="text-3xl font-black">{totalLoyaltyPoints}</div>
              <div className="text-xs text-amber-100 font-medium">Điểm khả dụng</div>
            </div>
          </div>

          {/* Action button to redeem voucher */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <div>
              <span className="font-bold text-emerald-950 block">Bạn có {totalLoyaltyPoints} điểm tích lũy chưa sử dụng</span>
              <span className="text-emerald-700">Đổi điểm lấy mã giảm giá 10k, 30k hoặc Freeship xe lạnh cho đơn hàng tiếp theo.</span>
            </div>
            <Link
              href="/loyalty#redeem-section"
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-colors shrink-0 shadow-xs"
            >
              Đến Quầy Đổi Voucher →
            </Link>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Đặc quyền hội viên hiện tại:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" /> Tặng voucher hàng tháng
                </p>
                <p className="text-gray-500 text-[11px]">Nhận mã giảm giá độc quyền theo cấp bậc vào đầu mỗi tháng.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-blue-600" /> Ưu tiên giao hàng xe lạnh
                </p>
                <p className="text-gray-500 text-[11px]">Đơn hàng được ưu tiên xuất kho trong vòng 2 giờ.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-600" /> Đổi điểm nhận quà
                </p>
                <p className="text-gray-500 text-[11px]">Dùng điểm để đổi mã giảm giá mua rau củ quả và freeship.</p>
              </div>
            </div>
          </div>

          {/* Transaction History in Customer Dashboard */}
          <div className="space-y-3 pt-2">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Lịch sử biến động điểm gần nhất:
            </h3>
            {(!loyaltyProfile?.recentTransactions || loyaltyProfile.recentTransactions.length === 0) ? (
              <div className="text-center py-6 text-xs text-gray-400 bg-gray-50 rounded-xl">
                Chưa có lịch sử biến động điểm nào.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {loyaltyProfile.recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">{tx.description}</div>
                      <div className="text-[11px] text-gray-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleString("vi-VN") : "Hôm nay"}</div>
                    </div>
                    <div className={cn("font-bold text-sm font-mono", tx.points > 0 ? "text-emerald-600" : "text-purple-600")}>
                      {tx.points > 0 ? `+${tx.points}` : `${tx.points}`} điểm
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XEM CHI TIẾT ĐƠN HÀNG                              */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div onClick={() => setSelectedOrder(null)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-5 animate-scale-up cursor-default">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 gap-3">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Chi tiết đơn hàng & Hành trình chuỗi lạnh
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex flex-wrap items-center gap-2 mt-1">
                  <span>#{selectedOrder.id}</span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                      selectedOrder.paymentStatusColor
                    )}
                  >
                    {selectedOrder.paymentStatusText}
                  </span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold border",
                      selectedOrder.statusColor
                    )}
                  >
                    {selectedOrder.statusText}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* 30-Min Hold Alert if PENDING_PAYMENT */}
            {selectedOrder.status === "PENDING_PAYMENT" && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 text-amber-950">
                  <div className="font-extrabold flex items-center gap-1.5 text-sm">
                    <Clock size={16} className="text-amber-600" />
                    <span>Đang giữ hàng tồn kho tối đa 30 phút (Còn {selectedOrder.holdMinutesLeft || 30} phút)</span>
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    Kho lạnh đang tạm khóa số lượng nông sản cho đơn của bạn để tránh hết hàng. Vui lòng hoàn tất quét mã VietQR để xuất kho ngay!
                  </p>
                </div>
                <button
                  onClick={() => {
                    const code = selectedOrder.id;
                    setSelectedOrder(null);
                    handleOpenPayOS(code);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 shadow-sm cursor-pointer"
                >
                  Quét VietQR Thanh Toán →
                </button>
              </div>
            )}

            {/* COD & Delivery Verification Workflow Box with Strict Role Separation */}
            {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "REFUNDED" && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 to-teal-50/70 border border-emerald-200 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-extrabold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                      <ShieldCheck size={15} className="text-emerald-700" />
                      <span>Đối Soát Giao Nhận & Trạng Thái Thanh Toán</span>
                    </h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      {(selectedOrder.paymentMethod || "").toUpperCase() === "PAYOS" ||
                      (selectedOrder.paymentMethod || "").toUpperCase() === "BANK"
                        ? "Đơn chuyển khoản VietQR: Hệ thống tự động xác nhận Đã thanh toán ngay sau khi quét QR, sau đó xuất kho xe lạnh giao đến bạn."
                        : "Đơn Tiền mặt (COD): Hiển thị [Chưa thanh toán (Thu hộ COD)] khi đang đóng gói & vận chuyển. Ngay khi giao hàng thành công tận tay quý khách, hệ thống tự động đối soát và chuyển sang [✅ Đã thanh toán (Đã thu tiền mặt COD)]."}
                    </p>
                  </div>
                </div>

                {/* Customer-Appropriate Action Zone: Role Boundaries Respected */}
                <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-emerald-900">
                    {selectedOrder.status === "SHIPPING"
                      ? "Tài xế xe lạnh đã giao nông sản tới địa chỉ của bạn? Quý khách vui lòng kiểm tra và xác nhận:"
                      : selectedOrder.status === "PENDING_PAYMENT"
                      ? "Đơn hàng đang chờ thanh toán VietQR (Hàng tạm giữ trong 30 phút):"
                      : ["CONFIRMED", "PAID", "PREPARING"].includes(selectedOrder.status)
                      ? "Kho lạnh trung tâm đang xử lý đóng gói và điều phối xe tải chuyên dụng:"
                      : "Đơn hàng đã hoàn tất đối soát và lưu trữ dữ liệu chuỗi lạnh VietGAP:"}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedOrder.status === "SHIPPING" && (
                      <button
                        onClick={() => handleAdvanceOrderStep(selectedOrder.id, "DELIVERED")}
                        disabled={isUpdatingOrderStatus}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        <span>
                          ✅ Đã Nhận Được Hàng
                          {(selectedOrder.paymentMethod || "").toUpperCase() === "COD"
                            ? " & Xác Nhận Đã Thanh Toán COD"
                            : ""}
                        </span>
                      </button>
                    )}

                    {selectedOrder.status === "PENDING_PAYMENT" && (
                      <button
                        onClick={() => {
                          const code = selectedOrder.id;
                          setSelectedOrder(null);
                          handleOpenPayOS(code);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <QrCode size={13} />
                        <span>Quét mã VietQR</span>
                      </button>
                    )}

                    {["PENDING_PAYMENT", "CONFIRMED", "PREPARING", "PAID"].includes(selectedOrder.status) && (
                      <button
                        onClick={() => {
                          const code = selectedOrder.id;
                          setSelectedOrder(null);
                          setCancelTargetCode(code);
                          setShowCancelModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Yêu cầu hủy đơn
                      </button>
                    )}

                    {(selectedOrder.status === "DELIVERED" || selectedOrder.status === "COMPLETED") && (
                      <button
                        onClick={() => {
                          const ord = selectedOrder;
                          setSelectedOrder(null);
                          setReviewOrderCode(ord.id);
                          setReviewProductName(ord.items[0]?.name || "Nông sản tươi");
                          setShowReviewModal(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Star size={13} className="fill-amber-300 text-amber-300" />
                        <span>Đánh giá sản phẩm</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4-Actor Responsibility Breakdown in AgriTrace Supply Chain */}
            <div className="p-4 rounded-2xl bg-gray-50/90 border border-gray-200/80 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sprout size={15} className="text-emerald-700" />
                  <span>Quy Trình & Phân Định Trách Nhiệm 4 Bên (Supply Chain Roles)</span>
                </h4>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Minh bạch 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
                {/* 1. Nông dân / HTX */}
                <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <Sprout size={13} className="text-emerald-600 shrink-0" />
                    <span>1. Nông dân / HTX</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Thu hoạch nông sản sáng sớm, kiểm định dư lượng và cấp mã lô <strong>#{selectedOrder.lotCode}</strong>.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Chuẩn VietGAP/GlobalGAP
                  </span>
                </div>

                {/* 2. Kho lạnh trung tâm */}
                <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                    <Warehouse size={13} className="text-indigo-600 shrink-0" />
                    <span>2. Kho lạnh trung tâm</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Sơ chế, đóng gói túi màng khí thở ở 2°C - 5°C, niêm phong tem QR và xuất kho.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                    Bảo quản lạnh 2-5°C
                  </span>
                </div>

                {/* 3. Vận chuyển / Phân phối */}
                <div className="p-3 rounded-xl bg-white border border-gray-100 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-900">
                    <Truck size={13} className="text-blue-600 shrink-0" />
                    <span>3. Xe lạnh vận chuyển</span>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-tight">
                    Tài xế <strong>{selectedOrder.driverName || "Nguyễn Văn Thắng"}</strong> ({selectedOrder.driverPhone || "0912.888.777"}) giao tận tay và đối soát thu tiền COD.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                    Thùng xe lạnh 4.2°C
                  </span>
                </div>

                {/* 4. Khách hàng (Bạn) */}
                <div className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-300 shadow-2xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <UserIcon size={13} className="text-emerald-700 shrink-0" />
                    <span>4. Khách hàng (Bạn)</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-tight">
                    Kiểm tra tem nhãn, bấm <strong>Đã nhận được hàng</strong>, thanh toán và đánh giá chất lượng nông sản.
                  </p>
                  <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    Vai trò của bạn
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Hành Trình Giao Hàng & Bảo Quản Lạnh (2°C - 5°C)
              </h4>
              <div className="space-y-3 pt-1">
                {selectedOrder.timeline.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold",
                        step.completed
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 text-gray-500"
                      )}
                    >
                      {step.completed ? <Check size={11} /> : idx + 1}
                    </div>
                    <div className="flex-1 text-xs">
                      <p
                        className={cn(
                          "font-semibold",
                          step.completed ? "text-gray-900" : "text-gray-400"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-[11px] text-gray-400">{step.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping, Delivery Slot & Driver Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <MapPin size={13} className="text-emerald-700" />
                    <span>Địa chỉ nhận hàng tận nơi</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                    {selectedOrder.deliverySlot || "Giờ hành chính"}
                  </span>
                </div>
                <div className="space-y-0.5 pt-1">
                  <p className="font-bold text-gray-900">{selectedOrder.receiverName}</p>
                  <p className="text-gray-600 font-medium">{selectedOrder.receiverPhone}</p>
                  <p className="text-gray-600 leading-relaxed">{selectedOrder.receiverAddress}</p>
                </div>
                {selectedOrder.deliveryNote && (
                  <div className="pt-2 border-t border-gray-200/80 text-[11px] text-gray-500 italic">
                    💬 Dặn dò tài xế: &ldquo;{selectedOrder.deliveryNote}&rdquo;
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                    <Truck size={13} className="text-blue-600" />
                    <span>Tài xế xe lạnh phụ trách</span>
                  </span>
                  <span className="text-[11px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded">
                    AgriCold Fleet
                  </span>
                </div>
                <div className="space-y-0.5 pt-1">
                  <p className="font-bold text-gray-900">{selectedOrder.driverName || "Nguyễn Văn Thắng"}</p>
                  <p className="text-gray-500">Đội xe: AgriCold Hà Nội (Thùng bảo quản 2°C - 5°C)</p>
                  <p className="text-gray-500">Cảm biến IoT thùng xe: <strong>4.2°C (Đạt chuẩn VietGAP)</strong></p>
                </div>
                {selectedOrder.driverPhone && (
                  <div className="pt-1">
                    <a
                      href={`tel:${selectedOrder.driverPhone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold transition-colors text-xs"
                    >
                      <Phone size={12} />
                      <span>Gọi tài xế: {selectedOrder.driverPhone}</span>
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Items in order */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Sản Phẩm Trong Đơn ({(selectedOrder.items || []).length})
              </h4>
              <div className="divide-y divide-gray-100 border-t border-b border-gray-100 py-1">
                {(selectedOrder.items || []).map((it, i) => (
                  <div key={i} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                        <Image
                          src={it.image}
                          alt={it.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-gray-900">{it.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                          <span>{it.origin}</span>
                          <span>·</span>
                          <span className="text-emerald-700 font-bold">{it.cert}</span>
                          <span>·</span>
                          <span>SL: {it.qty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-xs font-bold text-gray-900">
                      {(it.price || 0).toLocaleString("vi-VN")} đ
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Traceability Link button */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                  <QrCode size={16} />
                </div>
                <div>
                  <p className="font-bold text-emerald-950">Mã Lô Nông Sản: {selectedOrder.lotCode}</p>
                  <p className="text-[11px] text-emerald-800">
                    Tra cứu đầy đủ nhật ký thu hái, xét nghiệm và hành trình xe lạnh.
                  </p>
                </div>
              </div>
              <Link
                href={`/traceability?lot=${selectedOrder.lotCode}`}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1.5 shadow-xs"
              >
                <span>Truy xuất lô hàng</span>
                <ExternalLink size={12} />
              </Link>
            </div>

            {/* Payment Summary */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>Phương thức thanh toán:</span>
                <span className="font-bold text-gray-900">
                  {(selectedOrder.paymentMethod || "").toUpperCase() === "PAYOS" ||
                  (selectedOrder.paymentMethod || "").toUpperCase() === "BANK"
                    ? "Chuyển khoản VietQR Napas 24/7"
                    : "Tiền mặt khi nhận hàng (COD)"}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Trạng thái thanh toán:</span>
                <span className="font-bold text-emerald-800">{selectedOrder.paymentStatusText}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-200/70">
                <span>Mã đối soát giao dịch:</span>
                <span className="font-mono font-semibold text-gray-800">
                  {selectedOrder.paymentRef ||
                    ((selectedOrder.paymentMethod || "").toUpperCase() === "PAYOS" ||
                    (selectedOrder.paymentMethod || "").toUpperCase() === "BANK"
                      ? "VIETQR-AUTO-VERIFIED"
                      : "COD-CASH-ON-DELIVERY")}
                </span>
              </div>
              {selectedOrder.paidAt && (
                <div className="flex items-center justify-between text-gray-600">
                  <span>Thời gian ghi nhận thanh toán:</span>
                  <span className="font-semibold text-emerald-800">
                    {new Date(selectedOrder.paidAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-gray-600 pt-1 border-t border-gray-200/70">
                <span>Tạm tính tiền hàng:</span>
                <span className="font-medium text-gray-900">
                  {(
                    selectedOrder.total +
                    (selectedOrder.discount || 0) -
                    selectedOrder.shippingFee
                  ).toLocaleString("vi-VN")}{" "}
                  đ
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>Phí giao hàng xe lạnh:</span>
                <span className="font-medium text-gray-900">
                  {selectedOrder.shippingFee === 0
                    ? "Miễn phí"
                    : `${selectedOrder.shippingFee.toLocaleString("vi-VN")} đ`}
                </span>
              </div>
              {selectedOrder.voucherUsed && (
                <div className="flex items-center justify-between text-emerald-700">
                  <span>Voucher giảm giá ({selectedOrder.voucherUsed}):</span>
                  <span className="font-bold">
                    -{(selectedOrder.discount || 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>
              )}
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-sm">
                <span className="font-bold text-gray-900">Tổng thanh toán:</span>
                <span className="text-base font-extrabold text-emerald-800">
                  {(selectedOrder.total || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {selectedOrder.status === "SHIPPING" && (
                <button
                  onClick={() => handleAdvanceOrderStep(selectedOrder.id, "DELIVERED")}
                  disabled={isUpdatingOrderStatus}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 size={13} />
                  <span>Xác nhận đã nhận hàng</span>
                </button>
              )}

              {selectedOrder.status === "PENDING_PAYMENT" && (
                <button
                  onClick={() => {
                    const code = selectedOrder.id;
                    setSelectedOrder(null);
                    handleOpenPayOS(code);
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <QrCode size={13} />
                  <span>Quét mã VietQR</span>
                </button>
              )}

              {(selectedOrder.status === "DELIVERED" || selectedOrder.status === "COMPLETED") && (
                reviewedOrders[selectedOrder.id] ? (
                  <span className="px-4 py-2 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-default">
                    <CheckCircle2 size={13} className="text-emerald-700" />
                    <span>✓ Đã đồng kiểm 5★ (+20 Điểm)</span>
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      const ord = selectedOrder;
                      setSelectedOrder(null);
                      setReviewOrderCode(ord.id);
                      setReviewProductName(ord.items[0]?.name || "Nông sản tươi");
                      setReviewProductImage(ord.items[0]?.image || "/images/products/rau-cu-combo.png");
                      setReviewLotCode(ord.lotCode || "SP-KL-05");
                      setReviewFarmName(ord.items[0]?.origin || "Nông Trại Xanh Thủy Canh Đà Lạt");
                      setReviewRating(5);
                      setReviewFreshCheck(true);
                      setReviewColdCheck(true);
                      setReviewDriverCheck(true);
                      setReviewPhotoUrl(ord.items[0]?.image || "/images/products/cai-kale.png");
                      setReviewComment("Rau củ rất tươi giòn, cuống mới hái, thùng lạnh bảo quản đạt chuẩn 4.2°C!");
                      setShowReviewModal(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Star size={13} className="fill-amber-400 text-amber-500" />
                    <span>Đồng kiểm & Đánh giá (+20đ)</span>
                  </button>
                )
              )}

              {/* FEATURE 3: Mua Lại Nhanh */}
              <button
                onClick={() => {
                  const ord = selectedOrder;
                  setSelectedOrder(null);
                  if (ord) handleReorder(ord);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                title="Gom toàn bộ combo nông sản của đơn này vào giỏ hàng để mua lại"
              >
                <RefreshCw size={13} />
                <span>Mua lại đơn này</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: HỦY ĐƠN HÀNG                                       */}
      {/* ========================================================= */}
      {showCancelModal && (
        <div onClick={() => setShowCancelModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 cursor-default">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  ✕
                </span>
                Xác Nhận Hủy Đơn Hàng #{cancelTargetCode}
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {(() => {
              const targetOrd = orders.find((o) => o.id === cancelTargetCode);
              const wasPaid =
                targetOrd?.status === "PAID" ||
                !!targetOrd?.paidAt ||
                ((targetOrd?.paymentMethod || "").toUpperCase() === "PAYOS" && targetOrd?.status !== "PENDING_PAYMENT");
              return (
                <div className="space-y-2.5">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Theo quy định, bạn có thể hủy đơn khi hàng chưa chuyển sang trạng thái <strong>Đang giao xe lạnh</strong>.
                  </p>
                  {wasPaid ? (
                    <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5 text-purple-900">
                        <span>↩️ Đơn đã thanh toán VietQR ({(targetOrd?.total || 0).toLocaleString("vi-VN")} đ)</span>
                      </div>
                      <p className="text-[11px] text-purple-800 leading-snug">
                        Sau khi xác nhận hủy, hệ thống sẽ <strong>hoàn tiền 100% về tài khoản ngân hàng của bạn</strong>, hoàn lại nông sản vào kho lạnh, mở khóa lại mã Voucher và thu hồi số điểm thưởng của đơn này.
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                      <div className="font-extrabold text-amber-900">
                        ⚪ Đơn hàng chưa thu tiền ({targetOrd?.status === "PENDING_PAYMENT" ? "Đang giữ hàng 30 phút" : "Thanh toán khi nhận hàng COD"})
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        Sau khi hủy, số lượng nông sản giữ tạm sẽ hoàn về kho lạnh và <strong>mã Voucher đã áp dụng (nếu có) sẽ được mở khóa lại</strong> để bạn dùng cho đơn tiếp theo.
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 block">Lý do hủy đơn:</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none"
              >
                <option value="Muốn thay đổi địa chỉ hoặc danh sách món">Muốn thay đổi địa chỉ hoặc danh sách món</option>
                <option value="Đổi ý không muốn mua nữa">Đổi ý không muốn mua nữa</option>
                <option value="Tìm thấy ưu đãi hoặc giá tốt hơn">Tìm thấy ưu đãi hoặc giá tốt hơn</option>
                <option value="Thời gian giao không thuận tiện">Thời gian giao không thuận tiện</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Giữ đơn hàng
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={isSubmittingCancel}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isSubmittingCancel ? "Đang hủy đơn..." : "Xác nhận hủy đơn"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* FEATURE 4: ⭐ MODAL ĐỒNG KIỂM ĐỘ TƯƠI & ĐÁNH GIÁ (LAYOUT NGANG) */}
      {/* ========================================================= */}
      {showReviewModal && (
        <div onClick={() => setShowReviewModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fade-in cursor-pointer">
          <form onSubmit={handleSubmitReview} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 cursor-default max-h-[90vh] flex flex-col my-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200 shadow-2xs">
                  <Star size={16} className="fill-amber-400 text-amber-500" />
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Đồng Kiểm Độ Tươi & Đánh Giá Nông Sản</h3>
                  <p className="text-[11px] text-gray-500">Đơn hàng #{reviewOrderCode} · Đã nhận hàng thành công</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Horizontal 2-Column Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 overflow-y-auto flex-1">
              {/* CỘT 1: Sản phẩm & Ảnh độ tươi thực tế */}
              <div className="space-y-4 md:pr-4 md:border-r border-gray-100">
                {/* Product Card */}
                <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                  {reviewProductImage ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-emerald-200 shrink-0 shadow-2xs">
                      <Image src={reviewProductImage} alt={reviewProductName} width={48} height={48} className="w-full h-full object-cover" />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 font-medium block">Nông sản đồng kiểm:</span>
                    <p className="text-sm font-bold text-gray-900 truncate">{reviewProductName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-800 mt-0.5">
                      <span className="truncate">{reviewFarmName || "Nông Trại Xanh Thủy Canh Đà Lạt"}</span>
                      {reviewLotCode && (
                        <span className="font-mono text-[10px] bg-emerald-100 px-1.5 py-0.2 rounded font-bold border border-emerald-200 shrink-0">
                          Lô #{reviewLotCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5-Star Rating Picker */}
                <div className="space-y-1 bg-gray-50/70 p-3 rounded-2xl border border-gray-100 text-center">
                  <span className="text-xs font-semibold text-gray-700 block">Độ tươi ngon khi nhận:</span>
                  <div className="flex justify-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1 transition-transform hover:scale-125 cursor-pointer"
                      >
                        <Star
                          size={24}
                          className={cn(
                            star <= reviewRating
                              ? "fill-amber-400 text-amber-400 drop-shadow-xs"
                              : "fill-gray-200 text-gray-200"
                          )}
                        />
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] font-medium text-amber-800 block">
                    {reviewRating === 5 && "Cực kỳ tươi giòn, chuẩn 100% VietGAP (5 sao)"}
                    {reviewRating === 4 && "Nông sản tươi ngon, đóng thùng lạnh tốt (4 sao)"}
                    {reviewRating === 3 && "Chất lượng tạm ổn (3 sao)"}
                    {reviewRating === 2 && "Chưa tươi lắm, cần cải thiện (2 sao)"}
                    {reviewRating === 1 && "Không hài lòng (1 sao)"}
                  </span>
                </div>

                {/* Photo Upload Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-gray-800 flex items-center gap-1.5">
                      <Camera size={13} className="text-emerald-700" />
                      <span>Ảnh thực tế khi mở thùng:</span>
                    </label>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                      +20 Điểm VIP
                    </span>
                  </div>

                  <label className="w-full border border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/50 p-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-emerald-800 cursor-pointer transition-colors">
                    <Upload size={13} />
                    <span>{reviewPhotoUrl ? "Đổi ảnh khác..." : "Tải ảnh từ máy / điện thoại"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            if (typeof reader.result === "string") {
                              setReviewPhotoUrl(reader.result);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  {/* Sample chips */}
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                    <span className="text-gray-400">Hoặc ảnh mẫu:</span>
                    <button
                      type="button"
                      onClick={() => setReviewPhotoUrl("/images/products/cai-kale.png")}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 border border-gray-200 transition-colors cursor-pointer"
                    >
                      Cải Kale
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewPhotoUrl("/images/products/dau-tay-moc-chau.png")}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 border border-gray-200 transition-colors cursor-pointer"
                    >
                      Dâu Mộc Châu
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewPhotoUrl("/images/products/rau-cu-combo.png")}
                      className="px-2 py-0.5 rounded-lg bg-gray-100 hover:bg-emerald-100 text-gray-700 hover:text-emerald-900 border border-gray-200 transition-colors cursor-pointer"
                    >
                      Mở thùng tươi
                    </button>
                  </div>

                  {/* Preview */}
                  {reviewPhotoUrl && (
                    <div className="relative w-full h-24 rounded-xl overflow-hidden border border-emerald-200 bg-gray-100 flex items-center justify-center group">
                      <Image
                        src={reviewPhotoUrl}
                        alt="Ảnh đồng kiểm độ tươi"
                        width={300}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                        <span>✓ Đã chọn ảnh</span>
                        <button
                          type="button"
                          onClick={() => setReviewPhotoUrl("")}
                          className="p-1 px-2 rounded bg-rose-600 hover:bg-rose-700 text-white text-[10px] cursor-pointer"
                        >
                          Gỡ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT 2: Tiêu chí đồng kiểm, nhận xét & nút hành động */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3.5">
                  {/* Reward banner */}
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-emerald-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-2xs">
                        🎁
                      </span>
                      <div>
                        <p className="font-bold text-amber-950 text-xs">Thưởng ngay +20 Điểm AgriClub</p>
                        <p className="text-[11px] text-amber-900 leading-tight">
                          Cộng trực tiếp vào Thẻ VIP, dùng đổi voucher giảm giá tại trang{" "}
                          <Link href="/loyalty" className="font-semibold underline hover:text-emerald-900" target="_blank">
                            /loyalty
                          </Link>!
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold text-[10px] shrink-0">
                      +20 Điểm
                    </span>
                  </div>

                  {/* 3 Co-inspection Checkboxes */}
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-gray-800 block">3 Tiêu chí đồng kiểm chất lượng:</span>
                    <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-emerald-50/40 border border-gray-200 transition-colors cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={reviewFreshCheck}
                        onChange={(e) => setReviewFreshCheck(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="text-gray-800 leading-tight text-[11px]">
                        <strong>Rau giòn tươi nguyên vẹn</strong>, cuống lá xanh mới, không úa dập (VietGAP).
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-emerald-50/40 border border-gray-200 transition-colors cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={reviewColdCheck}
                        onChange={(e) => setReviewColdCheck(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="text-gray-800 leading-tight text-[11px]">
                        <strong>Thùng giữ nhiệt lạnh đạt chuẩn 2°C – 5°C</strong>, tem niêm phong nguyên vẹn.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-xl bg-gray-50 hover:bg-emerald-50/40 border border-gray-200 transition-colors cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={reviewDriverCheck}
                        onChange={(e) => setReviewDriverCheck(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="text-gray-800 leading-tight text-[11px]">
                        <strong>Tài xế thân thiện, giao đúng hẹn</strong> và hỗ trợ đồng kiểm mở hộp nhiệt tình.
                      </span>
                    </label>
                  </div>

                  {/* Comment */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-800 block">Nhận xét chi tiết:</label>
                    <textarea
                      rows={2}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Rau củ rất tươi giòn, cuống mới hái, thùng lạnh bảo quản đạt chuẩn 4.2°C..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none leading-relaxed resize-none"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold cursor-pointer"
                  >
                    Để sau
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingReview}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Star size={13} className="fill-amber-300 text-amber-300" />
                    <span>{isSubmittingReview ? "Đang gửi..." : "Gửi Đánh Giá & Nhận +20 Điểm"}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: THANH TOÁN LẠI PAYOS CHO ĐƠN CHỜ                   */}
      {/* ========================================================= */}
      {showPayosModal && payosData && (
        <div onClick={() => setShowPayosModal(false)} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 space-y-4 cursor-default">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  QR
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">Quét Mã VietQR Đơn #{payosData.orderCode}</h3>
                  <p className="text-[11px] text-gray-400">Chuyển khoản Napas 24/7 tự động</p>
                </div>
              </div>
              <button
                onClick={() => setShowPayosModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            {/* 30-Minute Hold Countdown */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-amber-950 block">Đang giữ hàng tồn kho (Tối đa 30 phút)</span>
                  <span className="text-[11px] text-amber-800">Hoàn tất thanh toán để xuất kho lạnh ngay</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-amber-900 text-amber-100 font-mono font-black text-xs shrink-0">
                {`${String(Math.floor(repayHoldSeconds / 60)).padStart(2, "0")}:${String(repayHoldSeconds % 60).padStart(2, "0")}`}
              </span>
            </div>

            <div className="bg-emerald-50/50 rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 border border-emerald-100">
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-emerald-200/60">
                {payosData.qrCode ? (
                  <img src={payosData.qrCode} alt="payOS QR" className="w-48 h-48 object-contain rounded-xl" />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">Đang tải QR...</div>
                )}
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500">Số tiền:</span>
                <div className="text-xl font-black text-emerald-700">{payosData.amount.toLocaleString("vi-VN")}đ</div>
              </div>
            </div>

            <div className="space-y-1.5 text-xs bg-gray-50 rounded-2xl p-3 border border-gray-100 text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Ngân hàng:</span>
                <span className="font-semibold text-gray-900">{payosData.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số tài khoản:</span>
                <span className="font-mono font-bold text-gray-900">{payosData.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nội dung:</span>
                <span className="font-mono font-bold text-emerald-800">{payosData.description}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={handleConfirmPayOS}
                disabled={isProcessingPayos}
                className="w-full py-3 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles size={15} />
                {isProcessingPayos ? "Đang xác thực giao dịch..." : "Đã Quét Mã & Thanh Toán Thành Công"}
              </button>
              <button
                onClick={() => setShowPayosModal(false)}
                className="w-full py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold"
              >
                Đóng (Tiếp tục giữ đơn 30 phút)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOPEE-STYLE: Drawer Chat với Shop */}
      <OrderChatDrawer
        order={chatOrder}
        isOpen={Boolean(chatOrder)}
        onClose={() => setChatOrder(null)}
        onOpenDispute={(ord) => {
          setDisputeOrder(ord);
        }}
        currentUserRole="CUSTOMER"
        currentUserName={user?.name || "Lê Quang Minh"}
      />

      {/* SHOPEE-STYLE: Modal Yêu Cầu Trả Hàng / Hoàn Tiền */}
      <OrderDisputeModal
        order={disputeOrder}
        isOpen={Boolean(disputeOrder)}
        onClose={() => setDisputeOrder(null)}
        onSuccess={(updatedOrder) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updatedOrder.orderCode
                ? {
                    ...o,
                    refundStatus: "PENDING",
                    refundReason: updatedOrder.refundReason || undefined,
                  }
                : o
            )
          );
          if (chatOrder && chatOrder.orderCode === updatedOrder.orderCode) {
            setChatOrder((prev) => (prev ? { ...prev, ...updatedOrder } : null));
          }
        }}
      />
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-xs text-gray-400">
          Đang tải trang tài khoản...
        </div>
      }
    >
      <CustomerDashboardContent />
    </Suspense>
  );
}
