"use client";

import {
  Award,
  Bell,
  BookOpen,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  FileText,
  Gift,
  HelpCircle,
  KeyRound,
  Leaf,
  LogOut,
  Menu,
  PhoneCall,
  QrCode,
  RotateCcw,
  Scale,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sprout,
  Tag,
  Truck,
  User,
  Warehouse,
  X,
  Zap,
  Megaphone,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useNotificationStore } from "@/stores/notification-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

export function MainNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearSession, refreshToken } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  // Desktop Hover Mega Dropdowns state
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mobile Accordions state
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadNotifs = notifications.filter((n) => !n.read);
  const cartCount = useCartStore((s) => s.getItemCount());

  const handleMouseEnter = (key: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setHoveredNav(key);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setHoveredNav(null);
    }, 180);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch {
      /* ignore */
    }
    clearSession();
    setUserOpen(false);
    setMobileOpen(false);
    toast.info("Đã đăng xuất thành công.");
    router.push("/");
  };

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
    setNotifOpen(false);
    setHoveredNav(null);
  }, [pathname]);

  const hasRole = (role: string) =>
    Boolean(user?.roles?.some((r) => r === role || r === `ROLE_${role}`));

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Leaf size={18} strokeWidth={2.2} />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-gray-900">
              Agri<span className="text-emerald-700">Trace</span>
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">
              Nông sản sạch từ trang trại
            </span>
          </div>
        </Link>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DESKTOP MEGA NAVIGATION WITH HOVER DROPDOWNS                     */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <nav className="hidden lg:flex items-center gap-0.5 text-xs font-semibold">
          {/* 1. Trang Chủ */}
          <Link
            href="/"
            className={cn(
              "px-3 py-2 rounded-xl transition-all duration-150",
              pathname === "/"
                ? "text-emerald-800 bg-emerald-50/80 font-bold"
                : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100/80"
            )}
          >
            Trang Chủ
          </Link>

          {/* 2. Sản Phẩm Mega Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("products")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/products"
              className={cn(
                "px-3 py-2 rounded-xl flex items-center gap-1 transition-all duration-150 cursor-pointer",
                pathname.startsWith("/products") || pathname.startsWith("/seasons") || pathname.startsWith("/farming-techniques")
                  ? "text-emerald-800 bg-emerald-50/80 font-bold"
                  : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100/80"
              )}
            >
              <span>Sản Phẩm</span>
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200 text-gray-400",
                  hoveredNav === "products" && "rotate-180 text-emerald-700"
                )}
              />
            </Link>

            {hoveredNav === "products" && (
              <div className="absolute top-full left-0 pt-2 w-[520px] z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:inset-x-0 before:-top-2 before:h-3">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 overflow-hidden">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Sprout size={14} className="text-emerald-700" />
                      <span>Danh Mục Nông Sản Thu Hoạch</span>
                    </span>
                    <Link
                      href="/products"
                      className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                    >
                      <span>Xem tất cả →</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link
                      href="/products"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <Leaf size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Tất Cả Nông Sản
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">100% rau củ quả thu hoạch sáng nay</span>
                      </div>
                    </Link>

                    <Link
                      href="/products?cat=rau_la"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <Leaf size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Rau Ăn Lá Thủy Canh
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Cải xoăn kale, xà lách lô lô, xà lách mỡ</span>
                      </div>
                    </Link>

                    <Link
                      href="/products?cat=cu_qua"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <Tag size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Củ Quả Tươi Sạch
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Bơ sáp 034, cà chua bi cherry</span>
                      </div>
                    </Link>

                    <Link
                      href="/products?cat=trai_cay"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <Sparkles size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Trái Cây Đặc Sản
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Dâu tây Mộc Châu, cam sành Hàm Yên</span>
                      </div>
                    </Link>

                    <Link
                      href="/products?cat=nam_chebien"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <Sprout size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Nấm & Nông Sản Chế Biến
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Nấm đùi gà, mộc nhĩ hữu cơ Organic</span>
                      </div>
                    </Link>

                    <Link
                      href="/seasons"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                        <Sprout size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Nông Sản Theo Mùa Vụ
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Lịch vụ mùa thu hoạch Tây Bắc & Đà Lạt</span>
                      </div>
                    </Link>

                    <Link
                      href="/farming-techniques"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                        <ShieldCheck size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Kỹ Thuật Canh Tác Sạch
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Tiêu chuẩn VietGAP & GlobalGAP</span>
                      </div>
                    </Link>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 bg-emerald-50/60 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-emerald-900">
                    <div className="flex items-center gap-1.5 font-bold">
                      <Truck size={14} className="text-emerald-700 shrink-0" />
                      <span>Chuỗi lạnh 2°C - 5°C khép kín, giao nhanh 24H</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded-md">
                      Freeship đơn 150k
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Sự Kiện & Giảm Giá (Top-level Navigation) */}
          <Link
            href="/events"
            className={cn(
              "px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all duration-150 cursor-pointer",
              pathname.startsWith("/events")
                ? "text-rose-700 bg-rose-50/80 font-bold"
                : "text-gray-700 hover:text-rose-700 hover:bg-gray-100/80"
            )}
          >
            <Flame size={14} className="text-rose-500 fill-rose-500 animate-pulse" />
            <span>Sự Kiện & Giảm Giá</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-500 text-white shadow-2xs">
              HOT
            </span>
          </Link>

          {/* 4. Truy Xuất QR Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("traceability")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/traceability"
              className={cn(
                "px-3 py-2 rounded-xl flex items-center gap-1 transition-all duration-150 cursor-pointer",
                pathname.startsWith("/traceability")
                  ? "text-emerald-800 bg-emerald-50/80 font-bold"
                  : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100/80"
              )}
            >
              <span>Truy Xuất QR</span>
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200 text-gray-400",
                  hoveredNav === "traceability" && "rotate-180 text-emerald-700"
                )}
              />
            </Link>

            {hoveredNav === "traceability" && (
              <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:inset-x-0 before:-top-2 before:h-3">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 space-y-1 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 border-b border-gray-100">
                    Minh Bạch Chuỗi Cung Ứng
                  </div>

                  <Link
                    href="/traceability"
                    className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                      <QrCode size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                        Quét Mã QR Lô Hàng
                      </span>
                      <span className="text-[10px] text-gray-500">Tra cứu nguồn gốc xuất xứ chuẩn GS1 điện tử</span>
                    </div>
                  </Link>

                  <Link
                    href="/traceability?tab=log"
                    className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                      <FileText size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                        Nhật Ký Canh Tác Số
                      </span>
                      <span className="text-[10px] text-gray-500">Chi tiết bón phân, tưới tiêu từ nông trại</span>
                    </div>
                  </Link>

                  <Link
                    href="/traceability?tab=cert"
                    className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                      <ShieldCheck size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                        Kiểm Định & Chứng Nhận
                      </span>
                      <span className="text-[10px] text-gray-500">Xem giấy kiểm định VietGAP / GlobalGAP</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 4. Mã Ưu Đãi & Hội Viên Dropdown */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("loyalty")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/vouchers"
              className={cn(
                "px-3 py-2 rounded-xl flex items-center gap-1 transition-all duration-150 cursor-pointer",
                pathname.startsWith("/vouchers") || pathname.startsWith("/loyalty")
                  ? "text-emerald-800 bg-emerald-50/80 font-bold"
                  : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100/80"
              )}
            >
              <span>Ưu Đãi & Hội Viên</span>
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200 text-gray-400",
                  hoveredNav === "loyalty" && "rotate-180 text-emerald-700"
                )}
              />
            </Link>

            {hoveredNav === "loyalty" && (
              <div className="absolute top-full left-0 pt-2 w-80 z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:inset-x-0 before:-top-2 before:h-3">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 space-y-1 text-xs">
                  <div className="px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 border-b border-gray-100">
                    Quyền Lợi & Ưu Đãi
                  </div>

                  <Link
                    href="/events"
                    className="p-2.5 rounded-xl hover:bg-rose-50/70 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                      <Sparkles size={15} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-gray-900 group-hover:text-rose-800 block">
                          Sự Kiện & Mùa Vụ Khuyến Mãi
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-rose-500 text-white">
                          HOT
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500">Trợ giá vụ mùa tại vườn, đếm ngược thời gian sale</span>
                    </div>
                  </Link>

                  <Link
                    href="/vouchers"
                    className="p-2.5 rounded-xl hover:bg-amber-50/70 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <Gift size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-amber-800 block">
                        Kho Mã Giảm Giá (Voucher)
                      </span>
                      <span className="text-[10px] text-gray-500">Mã FREESHIP, giảm 30% AGRI30 cho mọi đơn</span>
                    </div>
                  </Link>

                  <Link
                    href="/loyalty"
                    className="p-2.5 rounded-xl hover:bg-amber-50/70 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                      <Award size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                        Thành Viên AgriClub
                      </span>
                      <span className="text-[10px] text-gray-500">Tích lũy 1x - 1.5x điểm thưởng mỗi đơn mua</span>
                    </div>
                  </Link>

                  <Link
                    href="/loyalty#redeem-section"
                    className="p-2.5 rounded-xl hover:bg-amber-50/70 transition-all flex items-start gap-2.5 group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                      <Sparkles size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-gray-900 group-hover:text-teal-800 block">
                        Đổi Điểm Lấy Quà
                      </span>
                      <span className="text-[10px] text-gray-500">Đổi điểm tích lũy lấy voucher giảm tiền mặt</span>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 5. Hỗ Trợ & Chính Sách Mega Dropdown (THE CORE USER REQUEST!) */}
          <div
            className="relative"
            onMouseEnter={() => handleMouseEnter("support")}
            onMouseLeave={handleMouseLeave}
          >
            <Link
              href="/terms"
              className={cn(
                "px-3 py-2 rounded-xl flex items-center gap-1 transition-all duration-150 cursor-pointer",
                pathname.startsWith("/terms") || pathname.startsWith("/faq") || pathname.startsWith("/about") || pathname.startsWith("/contact") || pathname.startsWith("/blog")
                  ? "text-emerald-800 bg-emerald-50/80 font-bold"
                  : "text-gray-700 hover:text-emerald-700 hover:bg-gray-100/80"
              )}
            >
              <span>Hỗ Trợ & Chính Sách</span>
              <ChevronDown
                size={13}
                className={cn(
                  "transition-transform duration-200 text-gray-400",
                  hoveredNav === "support" && "rotate-180 text-emerald-700"
                )}
              />
            </Link>

            {hoveredNav === "support" && (
              <div className="absolute top-full right-0 lg:left-0 pt-2 w-[480px] z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:inset-x-0 before:-top-2 before:h-3">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 overflow-hidden">
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Scale size={14} className="text-emerald-700" />
                      <span>Chính Sách & Hỗ Trợ Người Mua</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Bảo vệ 100%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {/* Item 1: Terms */}
                    <Link
                      href="/terms"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group relative"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                        <FileText size={15} />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 group-hover:text-emerald-800">
                            Điều Khoản Dịch Vụ
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Mới
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Quy chế mua bán & chính sách chuỗi lạnh</span>
                      </div>
                    </Link>

                    {/* Item 2: FAQ */}
                    <Link
                      href="/faq"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-700 group-hover:text-white transition-colors">
                        <HelpCircle size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Câu Hỏi Thường Gặp (FAQ)
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Giải đáp cách đặt hàng, nhận hàng xe lạnh</span>
                      </div>
                    </Link>

                    {/* Item 3: Cold Chain Policy */}
                    <Link
                      href="/about#coldchain"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                        <Truck size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Chính Sách Chuỗi Lạnh
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Bảo quản nhiệt độ 2°C - 5°C khép kín</span>
                      </div>
                    </Link>

                    {/* Item 4: About Us */}
                    <Link
                      href="/about"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                        <ShieldCheck size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Về Chúng Tôi (AgriTrace)
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Sứ mệnh số hóa chuỗi nông sản sạch</span>
                      </div>
                    </Link>

                    {/* Item 5: Contact & Hotline */}
                    <Link
                      href="/contact"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                        <PhoneCall size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Liên Hệ & CSKH 24/7
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Hotline 1900 888 666 khiếu nại đổi trả</span>
                      </div>
                    </Link>

                    {/* Item 6: Blog & Knowledge */}
                    <Link
                      href="/blog"
                      className="p-2.5 rounded-xl hover:bg-emerald-50/80 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                        <BookOpen size={15} />
                      </div>
                      <div>
                        <span className="font-bold text-gray-900 group-hover:text-emerald-800 block">
                          Cẩm Nang & Blog Nông Sản
                        </span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Mẹo bảo quản rau quả tươi giòn lâu</span>
                      </div>
                    </Link>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Đổi trả 1-đổi-1 trong vòng 24H</span>
                    <Link href="/terms" className="font-bold text-emerald-800 hover:underline">
                      Xem toàn văn quy chế →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* RIGHT SECTION: NOTIFICATIONS, CART, ROLE DASHBOARD & USER       */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2">
          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  setUserOpen(false);
                }}
                className="relative p-2 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Thông báo"
              >
                <Bell size={18} strokeWidth={1.75} />
                {unreadNotifs.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadNotifs.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Popover */}
              {notifOpen && (
                <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-sm">Thông Báo</span>
                      {unreadNotifs.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          {unreadNotifs.length} mới
                        </span>
                      )}
                    </div>
                    {unreadNotifs.length > 0 && (
                      <button
                        onClick={() => markAllAsRead()}
                        className="text-[11px] font-medium text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck size={13} />
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-400">Không có thông báo nào</div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <Link
                          key={n.id}
                          href={n.link || "/dashboard/customer?tab=notifications"}
                          onClick={() => {
                            markAsRead(n.id);
                            setNotifOpen(false);
                          }}
                          className={`p-3.5 block transition-colors hover:bg-gray-50/80 ${
                            n.id === "notif-season-pricing"
                              ? "bg-gradient-to-r from-amber-50/90 via-rose-50/60 to-white border-l-4 border-rose-500"
                              : !n.read
                              ? "bg-emerald-50/40"
                              : ""
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                n.id === "notif-season-pricing"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : n.type === "order"
                                  ? "bg-blue-100 text-blue-700"
                                  : n.type === "voucher"
                                  ? "bg-amber-100 text-amber-700"
                                  : n.type === "promo"
                                  ? "bg-rose-100 text-rose-700"
                                  : n.type === "season"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {n.id === "notif-season-pricing" ? (
                                <Megaphone size={14} />
                              ) : n.type === "order" ? (
                                <Truck size={14} />
                              ) : n.type === "voucher" ? (
                                <Gift size={14} />
                              ) : n.type === "promo" ? (
                                <Sparkles size={14} />
                              ) : n.type === "season" ? (
                                <Sprout size={14} />
                              ) : (
                                <Leaf size={14} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <p className="font-semibold text-gray-900 text-xs truncate">{n.title}</p>
                                {n.id === "notif-season-pricing" ? (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white shrink-0 animate-pulse">
                                    QĐ MỚI
                                  </span>
                                ) : !n.read ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                                ) : null}
                              </div>
                              <p className="text-gray-500 text-[11px] line-clamp-2 mt-0.5 leading-snug">
                                {n.message}
                              </p>
                              <span className="text-[10px] text-gray-400 mt-1 block">{n.createdAt}</span>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between text-xs px-3">
                    <Link
                      href="/events"
                      onClick={() => setNotifOpen(false)}
                      className="font-bold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1"
                    >
                      <Flame size={13} className="text-rose-600 fill-rose-600" />
                      <span>Xem Tất Cả Sự Kiện Mùa Vụ →</span>
                    </Link>
                    <Link
                      href="/dashboard/customer?tab=notifications"
                      onClick={() => setNotifOpen(false)}
                      className="text-gray-500 hover:text-gray-800 text-[11px]"
                    >
                      Tất cả →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart Icon */}
          <Link
            href="/cart"
            className="relative p-2 rounded-xl text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
            title="Giỏ hàng"
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Section & Role Buttons */}
          {user ? (
            <>
              {/* Role-based Quick Link button */}
              {hasRole("ADMIN") ? (
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
                  title="Vào trang quản trị"
                >
                  <Shield size={14} strokeWidth={1.75} />
                  <span>Quản Trị</span>
                </Link>
              ) : hasRole("FARMER") ? (
                <Link
                  href="/dashboard/farmer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
                  title="Vào cổng nông trại"
                >
                  <Sprout size={14} strokeWidth={1.75} />
                  <span>Nông Trại</span>
                </Link>
              ) : hasRole("WAREHOUSE") || hasRole("WAREHOUSE_STAFF") ? (
                <Link
                  href="/dashboard/warehouse"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                  title="Vào cổng kho hàng"
                >
                  <Warehouse size={14} strokeWidth={1.75} />
                  <span>Kho Hàng</span>
                </Link>
              ) : hasRole("DISTRIBUTOR") ? (
                <Link
                  href="/dashboard/distributor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors"
                  title="Vào cổng vận chuyển"
                >
                  <Truck size={14} strokeWidth={1.75} />
                  <span>Vận Chuyển</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard/customer?tab=orders"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  title="Xem đơn mua của bạn"
                >
                  <ShoppingBag size={14} strokeWidth={1.75} />
                  <span>Đơn Mua</span>
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-400 bg-white text-xs font-semibold text-gray-700 transition-colors cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || "User"}
                      className="w-6 h-6 rounded-full object-cover border border-emerald-300"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="hidden md:inline max-w-[90px] truncate">{user.name || user.email}</span>
                  <ChevronDown size={12} className="text-gray-400" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2.5 border-b border-gray-100 flex items-center gap-2.5">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name || "User"}
                          className="w-9 h-9 rounded-full object-cover border border-emerald-300 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {user.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900 truncate">{user.name || "Tài khoản"}</p>
                        <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {hasRole("ADMIN")
                            ? "Quản trị viên (ADMIN)"
                            : hasRole("FARMER")
                            ? "Nông dân (FARMER)"
                            : hasRole("WAREHOUSE") || hasRole("WAREHOUSE_STAFF")
                            ? "Thủ kho (WAREHOUSE)"
                            : hasRole("DISTRIBUTOR")
                            ? "Vận chuyển (DISTRIBUTOR)"
                            : "Khách hàng (CUSTOMER)"}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      {hasRole("ADMIN") ? (
                        <>
                          <Link
                            href="/dashboard/admin"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-red-700 hover:bg-red-50 font-bold transition-colors"
                          >
                            <Shield size={14} className="text-red-600" />
                            <span>Cổng Quản Trị Hệ Thống</span>
                          </Link>
                          <Link
                            href="/dashboard/admin?tab=orders"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <ShoppingBag size={14} className="text-gray-500" />
                            <span>Quản lý đơn hàng</span>
                          </Link>
                          <Link
                            href="/dashboard/admin?tab=vouchers"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <Gift size={14} className="text-gray-500" />
                            <span>Quản lý Voucher & Ưu đãi</span>
                          </Link>
                          <Link
                            href="/dashboard/users"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <User size={14} className="text-gray-500" />
                            <span>Quản lý người dùng</span>
                          </Link>
                        </>
                      ) : hasRole("FARMER") ? (
                        <>
                          <Link
                            href="/dashboard/farmer"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-emerald-800 hover:bg-emerald-50 font-bold transition-colors"
                          >
                            <Sprout size={14} className="text-emerald-700" />
                            <span>Quản Lý Nông Trại & Lô Hàng</span>
                          </Link>
                          <Link
                            href="/traceability"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <QrCode size={14} className="text-gray-500" />
                            <span>Cấp & Tra cứu mã QR</span>
                          </Link>
                        </>
                      ) : hasRole("WAREHOUSE") || hasRole("WAREHOUSE_STAFF") ? (
                        <>
                          <Link
                            href="/dashboard/warehouse"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-blue-800 hover:bg-blue-50 font-bold transition-colors"
                          >
                            <Warehouse size={14} className="text-blue-700" />
                            <span>Quản Lý Kho Lạnh & FEFO</span>
                          </Link>
                          <Link
                            href="/traceability"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <QrCode size={14} className="text-gray-500" />
                            <span>Quét mã QR nghiệm thu</span>
                          </Link>
                        </>
                      ) : hasRole("DISTRIBUTOR") ? (
                        <>
                          <Link
                            href="/dashboard/distributor"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-amber-800 hover:bg-amber-50 font-bold transition-colors"
                          >
                            <Truck size={14} className="text-amber-700" />
                            <span>Cổng Điều Phối Vận Chuyển</span>
                          </Link>
                          <Link
                            href="/dashboard/distributor/receive"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <QrCode size={14} className="text-gray-500" />
                            <span>Tiếp nhận hàng & Quét QR</span>
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/dashboard/customer?tab=profile"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <User size={14} className="text-gray-500" />
                            <span>Hồ sơ của tôi</span>
                          </Link>
                          <Link
                            href="/dashboard/customer?tab=orders"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <ShoppingBag size={14} className="text-gray-500" />
                            <span>Đơn mua của tôi</span>
                          </Link>
                          <Link
                            href="/dashboard/customer?tab=vouchers"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <Gift size={14} className="text-gray-500" />
                            <span>Kho Voucher & Ưu đãi</span>
                          </Link>
                          <Link
                            href="/dashboard/customer?tab=points"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <Award size={14} className="text-gray-500" />
                            <span>Điểm & Hạng hội viên</span>
                          </Link>
                          <Link
                            href="/terms"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <FileText size={14} className="text-gray-500" />
                            <span>Điều khoản dịch vụ</span>
                          </Link>
                          <Link
                            href="/dashboard/customer?tab=password"
                            onClick={() => setUserOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                          >
                            <KeyRound size={14} className="text-gray-500" />
                            <span>Đổi mật khẩu</span>
                          </Link>
                        </>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <LogOut size={13} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/dashboard/customer?tab=orders"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                title="Xem đơn mua của bạn"
              >
                <ShoppingBag size={14} strokeWidth={1.75} />
                <span>Đơn Mua</span>
              </Link>
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 transition-all shadow-xs"
              >
                Đăng Nhập
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MOBILE EXPANDABLE DRAWER MENU                                    */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1.5 shadow-xl max-h-[80vh] overflow-y-auto text-xs">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="block px-3 py-2 rounded-xl font-bold text-gray-800 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Trang Chủ
          </Link>

          {/* Mobile Accordion: Sản phẩm */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileExpanded(mobileExpanded === "products" ? null : "products")}
              className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-gray-800 bg-gray-50/70"
            >
              <span>Sản Phẩm</span>
              <ChevronDown size={14} className={cn("transition-transform", mobileExpanded === "products" && "rotate-180")} />
            </button>
            {mobileExpanded === "products" && (
              <div className="p-2 space-y-1 bg-white border-t border-gray-100">
                <Link href="/products" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Tất cả nông sản sạch
                </Link>
                <Link href="/products?cat=rau_la" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Rau ăn lá thủy canh
                </Link>
                <Link href="/products?cat=cu_qua" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Củ quả tươi sạch
                </Link>
                <Link href="/products?cat=trai_cay" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Trái cây đặc sản
                </Link>
                <Link href="/products?cat=nam_chebien" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Nấm & nông sản chế biến
                </Link>
                <Link href="/seasons" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Nông sản theo mùa vụ
                </Link>
                <Link href="/farming-techniques" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Kỹ thuật canh tác VietGAP
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Accordion: Truy Xuất QR */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileExpanded(mobileExpanded === "traceability" ? null : "traceability")}
              className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-gray-800 bg-gray-50/70"
            >
              <span>Truy Xuất QR</span>
              <ChevronDown size={14} className={cn("transition-transform", mobileExpanded === "traceability" && "rotate-180")} />
            </button>
            {mobileExpanded === "traceability" && (
              <div className="p-2 space-y-1 bg-white border-t border-gray-100">
                <Link href="/traceability" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Quét mã QR lô hàng GS1
                </Link>
                <Link href="/traceability?tab=log" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Nhật ký canh tác số
                </Link>
                <Link href="/traceability?tab=cert" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Kiểm định VietGAP / GlobalGAP
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Accordion: Ưu Đãi & Hội Viên */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileExpanded(mobileExpanded === "loyalty" ? null : "loyalty")}
              className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-gray-800 bg-gray-50/70"
            >
              <span>Ưu Đãi & Hội Viên</span>
              <ChevronDown size={14} className={cn("transition-transform", mobileExpanded === "loyalty" && "rotate-180")} />
            </button>
            {mobileExpanded === "loyalty" && (
              <div className="p-2 space-y-1 bg-white border-t border-gray-100">
                <Link href="/events" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-rose-700 font-bold hover:text-rose-900">
                  🔥 Sự kiện & mùa vụ khuyến mãi
                </Link>
                <Link href="/vouchers" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Kho mã ưu đãi (Voucher)
                </Link>
                <Link href="/loyalty" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Thẻ hội viên AgriClub
                </Link>
                <Link href="/loyalty#redeem-section" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-600 hover:text-emerald-800">
                  • Đổi điểm tích lũy lấy quà
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Accordion: Hỗ Trợ & Chính Sách */}
          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileExpanded(mobileExpanded === "support" ? null : "support")}
              className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-gray-800 bg-gray-50/70"
            >
              <span className="flex items-center gap-1.5">
                <span>Hỗ Trợ & Chính Sách</span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                  Mới
                </span>
              </span>
              <ChevronDown size={14} className={cn("transition-transform", mobileExpanded === "support" && "rotate-180")} />
            </button>
            {mobileExpanded === "support" && (
              <div className="p-2 space-y-1 bg-white border-t border-gray-100 font-medium">
                <Link href="/terms" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-emerald-800 font-bold hover:bg-emerald-50 rounded-lg">
                  📜 Điều khoản dịch vụ & Đổi trả 24H
                </Link>
                <Link href="/faq" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                  ❓ Câu hỏi thường gặp (FAQ)
                </Link>
                <Link href="/about#coldchain" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                  ❄️ Chính sách xe lạnh 2°C - 5°C
                </Link>
                <Link href="/about" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                  🏢 Về chúng tôi (AgriTrace)
                </Link>
                <Link href="/contact" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                  📞 Liên hệ CSKH 1900 888 666
                </Link>
                <Link href="/blog" onClick={() => setMobileOpen(false)} className="block px-3 py-1.5 text-gray-700 hover:bg-gray-50 rounded-lg">
                  📖 Cẩm nang nông sản sạch
                </Link>
              </div>
            )}
          </div>

          {/* User Section on Mobile */}
          {user && (
            <div className="pt-2 border-t border-gray-100 space-y-1">
              <Link
                href={
                  hasRole("ADMIN")
                    ? "/dashboard/admin"
                    : hasRole("FARMER")
                    ? "/dashboard/farmer"
                    : hasRole("WAREHOUSE") || hasRole("WAREHOUSE_STAFF")
                    ? "/dashboard/warehouse"
                    : hasRole("DISTRIBUTOR")
                    ? "/dashboard/distributor"
                    : "/dashboard/customer?tab=orders"
                }
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg"
              >
                {hasRole("ADMIN")
                  ? "Cổng Quản Trị Hệ Thống"
                  : hasRole("FARMER")
                  ? "Cổng Quản Lý Nông Trại"
                  : hasRole("WAREHOUSE") || hasRole("WAREHOUSE_STAFF")
                  ? "Cổng Quản Lý Kho Lạnh"
                  : hasRole("DISTRIBUTOR")
                  ? "Cổng Điều Phối Vận Chuyển"
                  : "Đơn Mua Của Bạn"}
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
              >
                <LogOut size={15} strokeWidth={1.75} />
                <span>Đăng xuất ({user.name || user.email})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
