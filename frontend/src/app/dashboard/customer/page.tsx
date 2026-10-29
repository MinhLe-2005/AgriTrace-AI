"use client";

import {
  Award,
  Bell,
  Camera,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Package,
  Phone,
  QrCode,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, Suspense } from "react";
import { getApiErrorMessage } from "@/lib/api";
import { authService } from "@/services/auth.service";
import { catalogService } from "@/services/catalog.service";
import { useAuthStore } from "@/stores/auth-store";
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
  date: string;
  status: "SHIPPING" | "COMPLETED";
  statusText: string;
  statusColor: string;
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
  driverName?: string;
  driverPhone?: string;
  timeline: { title: string; time: string; completed: boolean }[];
};

const mockOrders: Order[] = [
  {
    id: "AGRI-8841",
    date: "Hôm nay, 14:15",
    status: "SHIPPING",
    statusText: "Đang giao hàng xe lạnh",
    statusColor: "bg-blue-50 text-blue-700 border-blue-200",
    lotCode: "XL-2026-08",
    receiverName: "Lê Quang Minh",
    receiverPhone: "0988 776 655",
    receiverAddress: "Số 123 Cầu Giấy, Hà Nội",
    driverName: "Nguyễn Văn Thắng",
    driverPhone: "0912.888.777",
    timeline: [
      { title: "Đặt hàng thành công", time: "08:30 Hôm nay", completed: true },
      { title: "Nông trại thu hái & kiểm định VietGAP", time: "10:15 Hôm nay", completed: true },
      { title: "Đang vận chuyển xe lạnh (Nhiệt độ thùng xe 4.5°C)", time: "14:15 Hôm nay", completed: true },
      { title: "Giao hàng thành công", time: "Dự kiến 16:30", completed: false },
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
    statusText: "Đã giao thành công",
    statusColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    lotCode: "CS-BG-2026-03",
    receiverName: "Lê Quang Minh",
    receiverPhone: "0988 776 655",
    receiverAddress: "Số 123 Cầu Giấy, Hà Nội",
    driverName: "Trần Đình Trọng",
    driverPhone: "0934.555.222",
    timeline: [
      { title: "Đặt hàng thành công", time: "09:00 - 09/10/2026", completed: true },
      { title: "Đóng gói tại kho bảo quản lạnh", time: "14:30 - 09/10/2026", completed: true },
      { title: "Vận chuyển xe lạnh", time: "07:00 - 10/10/2026", completed: true },
      { title: "Đã giao thành công", time: "11:20 - 10/10/2026", completed: true },
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
  status: "active" | "expired";
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
  const searchParams = useSearchParams();
  const { user, updateUser } = useAuthStore();
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();

  const tabParam = searchParams.get("tab");
  const orderParam = searchParams.get("order");

  type TabType = "orders" | "profile" | "password" | "vouchers" | "notifications" | "points";

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (tabParam === "profile" || tabParam === "password" || tabParam === "vouchers" || tabParam === "notifications" || tabParam === "points") {
      return tabParam;
    }
    return "orders";
  });

  // Selected Order for Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [savedVouchers, setSavedVouchers] = useState<SavedVoucher[]>(mockSavedVouchers);

  useEffect(() => {
    async function loadSupabaseCustomerData() {
      try {
        const [apiOrders, apiVouchers] = await Promise.all([
          catalogService.getOrders(user?.email),
          catalogService.getVouchers(),
        ]);
        if (apiOrders && apiOrders.length > 0) {
          const mapped: Order[] = apiOrders.map((o) => ({
            id: o.orderCode,
            date: o.createdAt ? new Date(o.createdAt).toLocaleDateString("vi-VN") : "Hôm nay",
            status: o.status === "COMPLETED" ? "COMPLETED" : "SHIPPING",
            statusText: o.status === "COMPLETED" ? "Đã giao thành công" : "Đang giao hàng xe lạnh",
            statusColor:
              o.status === "COMPLETED"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-blue-50 text-blue-700 border-blue-200",
            lotCode: o.lotCode || "XL-2026-08",
            receiverName: o.receiverName,
            receiverPhone: o.receiverPhone,
            receiverAddress: o.receiverAddress,
            driverName: o.driverName || "Nguyễn Văn Thắng",
            driverPhone: o.driverPhone || "0912.888.777",
            shippingFee: o.shippingFee || 0,
            total: o.total,
            pointsAwarded: o.pointsAwarded || 20,
            voucherUsed: o.voucherUsed,
            discount: o.discount,
            items: o.items.map((it) => ({
              name: it.name,
              origin: it.origin || "Nông Trại Xanh",
              cert: it.cert || "VietGAP",
              qty: it.qty,
              price: it.price,
              image: it.image || "/images/products/xa-lach.jpg",
            })),
            timeline: [
              { title: "Đặt hàng thành công", time: "Ghi nhận hệ thống", completed: true },
              { title: "Nông trại thu hái & kiểm định VietGAP", time: "Tại kho nông trại", completed: true },
              {
                title: "Vận chuyển xe lạnh chuyên dụng (Nhiệt độ 4.5°C)",
                time: "Đang lưu thông",
                completed: o.status === "SHIPPING" || o.status === "COMPLETED",
              },
              { title: "Giao hàng thành công", time: "Tận tay người nhận", completed: o.status === "COMPLETED" },
            ],
          }));
          setOrders(mapped);
        }
        if (apiVouchers && apiVouchers.length > 0) {
          const mappedVouchers: SavedVoucher[] = apiVouchers.map((v) => ({
            code: v.code,
            title: v.title,
            desc: v.description,
            min: v.minOrder?.startsWith("Đơn") ? v.minOrder : `Đơn từ ${v.minOrder || "100.000đ"}`,
            exp: v.exp,
            status: v.active ? "active" : "expired",
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
  }, [user?.email]);

  useEffect(() => {
    if (
      tabParam === "profile" ||
      tabParam === "password" ||
      tabParam === "vouchers" ||
      tabParam === "notifications" ||
      tabParam === "points" ||
      tabParam === "orders"
    ) {
      setActiveTab(tabParam);
    }
    if (orderParam) {
      const match = orders.find((o) => o.id === orderParam);
      if (match) setSelectedOrder(match);
    }
  }, [tabParam, orderParam, orders]);

  // Order filter
  const [orderFilter, setOrderFilter] = useState<"ALL" | "SHIPPING" | "COMPLETED">("ALL");

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
  const [notifFilter, setNotifFilter] = useState<"ALL" | "UNREAD" | "ORDER" | "VOUCHER">("ALL");

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
    if (orderFilter === "ALL") return true;
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
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Link href="/" className="hover:text-emerald-700 transition-colors">
          Trang chủ
        </Link>
        <span>/</span>
        <span className="font-semibold text-gray-800">Tài khoản khách hàng</span>
      </div>

      {/* ── Customer Summary Card ── */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative group shrink-0">
            {avatarPreview || user?.avatarUrl ? (
              <img
                src={avatarPreview || user?.avatarUrl}
                alt={user?.name || "Avatar"}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-emerald-300 shadow-sm"
              />
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-sm">
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
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {user?.name || "Khách Hàng"}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <Star size={11} className="fill-amber-500 text-amber-500" /> Hội Viên Vàng
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {user?.email} · Khách hàng thân thiết AgriTrace
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 sm:gap-6 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
          <button
            onClick={() => setActiveTab("orders")}
            className="text-center group transition-transform hover:-translate-y-0.5"
          >
            <div className="text-lg sm:text-xl font-extrabold text-emerald-800 group-hover:text-emerald-600">
              {orders.length}
            </div>
            <div className="text-xs text-gray-500">Đơn hàng</div>
          </button>
          <div className="w-px h-8 bg-gray-200" />
          <button
            onClick={() => setActiveTab("vouchers")}
            className="text-center group transition-transform hover:-translate-y-0.5"
          >
            <div className="text-lg sm:text-xl font-extrabold text-blue-600 group-hover:text-blue-500">
              {savedVouchers.filter((v) => v.status === "active").length}
            </div>
            <div className="text-xs text-gray-500">Voucher ví</div>
          </button>
          <div className="w-px h-8 bg-gray-200" />
          <button
            onClick={() => setActiveTab("notifications")}
            className="text-center group transition-transform hover:-translate-y-0.5 relative"
          >
            <div className="text-lg sm:text-xl font-extrabold text-purple-600 group-hover:text-purple-500">
              {unreadCount}
            </div>
            <div className="text-xs text-gray-500">Thông báo mới</div>
          </button>
          <div className="w-px h-8 bg-gray-200" />
          <button
            onClick={() => setActiveTab("points")}
            className="text-center group transition-transform hover:-translate-y-0.5"
          >
            <div className="text-lg sm:text-xl font-extrabold text-amber-600 group-hover:text-amber-500">
              248
            </div>
            <div className="text-xs text-gray-500">Điểm tích lũy</div>
          </button>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-px overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "orders"
              ? "border-emerald-600 text-emerald-800 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <ShoppingBag size={16} />
          <span>Đơn mua của tôi</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("vouchers")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "vouchers"
              ? "border-emerald-600 text-emerald-800 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Gift size={16} />
          <span>Kho Voucher đã lưu</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-bold">
            {savedVouchers.filter((v) => v.status === "active").length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "notifications"
              ? "border-emerald-600 text-emerald-800 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Bell size={16} />
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
              ? "border-emerald-600 text-emerald-800 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <UserIcon size={16} />
          <span>Hồ sơ tài khoản</span>
        </button>

        <button
          onClick={() => setActiveTab("password")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "password"
              ? "border-emerald-600 text-emerald-800 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <KeyRound size={16} />
          <span>Đổi mật khẩu</span>
        </button>

        <button
          onClick={() => setActiveTab("points")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-t-xl transition-all border-b-2 whitespace-nowrap",
            activeTab === "points"
              ? "border-emerald-600 text-emerald-800 bg-white"
              : "border-transparent text-gray-500 hover:text-gray-900"
          )}
        >
          <Award size={16} />
          <span>Điểm & Hội viên</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: ĐƠN MUA CỦA TÔI                                    */}
      {/* ========================================================= */}
      {activeTab === "orders" && (
        <div className="space-y-4 animate-fade-in-up">
          {/* Order Filter bar */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500 font-medium mr-1">Bộ lọc trạng thái:</span>
            {(
              [
                { key: "ALL", label: "Tất cả đơn hàng" },
                { key: "SHIPPING", label: "Đang giao hàng xe lạnh" },
                { key: "COMPLETED", label: "Đã hoàn thành" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setOrderFilter(tab.key)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-semibold transition-colors",
                  orderFilter === tab.key
                    ? "bg-emerald-700 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs space-y-4 hover:border-emerald-300 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2.5 text-xs">
                    <span className="font-bold text-gray-900 text-sm">#{order.id}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-gray-500">{order.date}</span>
                    <span className="text-gray-400">·</span>
                    <span className="text-emerald-700 font-medium">Lô {order.lotCode}</span>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      order.statusColor
                    )}
                  >
                    {order.statusText}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-100 py-1 space-y-3">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-4 pt-3 first:pt-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                          <Image
                            src={item.image}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                            <span>{item.origin}</span>
                            <span>·</span>
                            <span className="font-semibold text-emerald-700">{item.cert}</span>
                            <span>·</span>
                            <span>SL: {item.qty}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-gray-900">
                          {item.price.toLocaleString("vi-VN")} đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <Truck size={14} className="text-emerald-600" />
                    <span>Vận chuyển xe lạnh chuyên dụng (+{order.pointsAwarded} điểm)</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right mr-2">
                      <span className="text-xs text-gray-400 mr-2">Tổng thanh toán:</span>
                      <span className="text-base font-extrabold text-emerald-800">
                        {order.total.toLocaleString("vi-VN")} đ
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="px-3.5 py-1.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                    >
                      <Eye size={13} />
                      <span>Xem chi tiết</span>
                    </button>

                    <Link
                      href="/products"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw size={13} />
                      <span>Mua lại</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: KHO VOUCHER ĐÃ LƯU                                 */}
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
              const isActive = v.status === "active";
              return (
                <div
                  key={v.code}
                  className={cn(
                    "bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between space-y-4 transition-all relative overflow-hidden",
                    isActive
                      ? "border-gray-200/90 hover:border-emerald-300"
                      : "border-gray-200 bg-gray-50/60 opacity-60"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-mono font-bold text-xs border border-emerald-200 flex items-center gap-1">
                          <Tag size={12} />
                          {v.code}
                        </span>
                        <button
                          onClick={() => handleCopyVoucher(v.code)}
                          title="Sao chép mã"
                          className="p-1 rounded-md text-gray-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                      <span
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}
                      >
                        {isActive ? "Khả dụng" : "Hết hạn"}
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
                        <span>Hạn sử dụng:</span>
                        <span className="font-medium text-emerald-700">{v.exp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyVoucher(v.code)}
                      className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
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
                        className="flex-1 py-2 rounded-xl bg-gray-200 text-gray-400 text-xs font-semibold cursor-not-allowed"
                      >
                        Hết hạn
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
          <div className="flex items-center gap-2 text-xs">
            {(
              [
                { key: "ALL", label: "Tất cả" },
                { key: "UNREAD", label: `Chưa đọc (${unreadCount})` },
                { key: "ORDER", label: "Đơn hàng" },
                { key: "VOUCHER", label: "Voucher & Quà tặng" },
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
                  className={cn(
                    "py-4 px-3 sm:px-4 rounded-xl transition-colors flex items-start justify-between gap-4 group",
                    !n.read ? "bg-emerald-50/40" : "hover:bg-gray-50"
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
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {n.type === "order" ? (
                        <Truck size={17} />
                      ) : n.type === "voucher" ? (
                        <Gift size={17} />
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
                            onClick={() => markAsRead(n.id)}
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
                        onClick={() => markAsRead(n.id)}
                        title="Đánh dấu đã đọc"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-700 hover:bg-white transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(n.id)}
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
                Hạng hội viên hiện tại
              </span>
              <h2 className="text-2xl font-extrabold mt-0.5 flex items-center gap-2">
                Hội Viên Vàng (Gold Member)
              </h2>
              <p className="text-xs text-amber-100 mt-1">
                Tích lũy thêm 252 điểm nữa để thăng hạng <strong>Kim Cương</strong> nhận chiết khấu 10% trọn đời.
              </p>
            </div>
            <div className="text-right sm:text-right">
              <div className="text-3xl font-black">248</div>
              <div className="text-xs text-amber-100 font-medium">Điểm khả dụng</div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800">Đặc quyền hội viên Vàng của bạn:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                <p className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-emerald-600" /> Tặng voucher hàng tháng
                </p>
                <p className="text-gray-500 text-[11px]">Nhận 3 mã giảm giá độc quyền vào đầu mỗi tháng.</p>
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
                <p className="text-gray-500 text-[11px]">Dùng 100 điểm để đổi voucher giảm 50.000đ khi mua rau củ.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: XEM CHI TIẾT ĐƠN HÀNG                              */}
      {/* ========================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-6 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-semibold">
                  Chi tiết đơn hàng
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2 mt-0.5">
                  <span>#{selectedOrder.id}</span>
                  <span
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                      selectedOrder.statusColor
                    )}
                  >
                    {selectedOrder.statusText}
                  </span>
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Timeline Progress */}
            <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Hành Trình Giao Hàng & Bảo Quản Lạnh
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

            {/* Shipping & Driver Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="font-bold text-gray-800 block">Địa chỉ nhận hàng</span>
                <p className="font-semibold text-gray-900">{selectedOrder.receiverName}</p>
                <p className="text-gray-500">{selectedOrder.receiverPhone}</p>
                <p className="text-gray-500">{selectedOrder.receiverAddress}</p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                <span className="font-bold text-gray-800 block">Tài xế xe lạnh phụ trách</span>
                <p className="font-semibold text-gray-900">{selectedOrder.driverName}</p>
                <p className="text-gray-500">Đội xe: AgriCold Hà Nội</p>
                {selectedOrder.driverPhone && (
                  <a
                    href={`tel:${selectedOrder.driverPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 font-semibold transition-colors mt-1"
                  >
                    <Phone size={12} />
                    <span>Gọi {selectedOrder.driverPhone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Items in order */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Sản Phẩm Trong Đơn ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-gray-100 border-t border-b border-gray-100 py-1">
                {selectedOrder.items.map((it, i) => (
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
                      {it.price.toLocaleString("vi-VN")} đ
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
                  {selectedOrder.total.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
              <Link
                href="/products"
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw size={13} />
                <span>Đặt mua lại</span>
              </Link>
            </div>
          </div>
        </div>
      )}
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
