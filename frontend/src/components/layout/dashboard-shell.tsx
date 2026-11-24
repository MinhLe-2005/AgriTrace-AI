"use client";

import {
  Award,
  BookOpen,
  CalendarRange,
  ClipboardList,
  Crown,
  ChevronRight,
  Gift,
  History,
  Home,
  Leaf,
  LogOut,
  Menu,
  PackageCheck,
  PackageSearch,
  QrCode,
  Settings,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Ticket,
  Truck,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Fragment, Suspense, useEffect, useState, type ReactNode } from "react";

import { LoadingSkeleton } from "@/components/ui/states";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import { cn } from "@/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  matchPrefixes?: string[];
  group?: string;
};

const customerNavigation: NavItem[] = [
  { href: "/dashboard/customer", label: "Đơn Mua Của Tôi", icon: ShoppingBag },
  { href: "/dashboard", label: "Hồ Sơ Vị Trí & Phê Duyệt", icon: Shield },
  { href: "/vouchers", label: "Kho Voucher & Ưu Đãi", icon: Gift },
  { href: "/loyalty", label: "Điểm & Hạng Hội Viên", icon: Award },
  { href: "/traceability", label: "Truy Xuất Mã QR", icon: QrCode },
  { href: "/products", label: "Cửa Hàng Nông Sản", icon: Store },
  { href: "/cart", label: "Giỏ Hàng Của Tôi", icon: ShoppingCart },
];

const farmerNavigation: NavItem[] = [
  { href: "/dashboard/farmer", label: "Quản Lý Nông Trại", icon: Leaf },
  { href: "/traceability", label: "Cấp Mã QR Lô Hàng", icon: QrCode },
  { href: "/products", label: "Xem Gian Hàng", icon: Store },
];

const warehouseNavigation: NavItem[] = [
  { href: "/dashboard/warehouse", label: "Quản Lý Kho Lạnh & FEFO", icon: Warehouse },
  { href: "/traceability", label: "Quét Mã Nhập Kho", icon: QrCode },
];

const distributorNavigation: NavItem[] = [
  { href: "/dashboard/distributor", label: "Tổng Quan Vận Chuyển", icon: Truck },
  { href: "/dashboard/distributor/orders", label: "Quản Lý Đơn Hàng", icon: ClipboardList, matchPrefixes: ["/dashboard/distributor/orders/"] },
  { href: "/dashboard/distributor/shipments", label: "Quản Lý Vận Chuyển", icon: Truck, matchPrefixes: ["/dashboard/distributor/shipments/"] },
  { href: "/dashboard/distributor/history", label: "Lịch Sử Vận Chuyển", icon: History },
  { href: "/dashboard/distributor/receive", label: "Tiếp Nhận Hàng & QR", icon: PackageCheck },
  { href: "/dashboard/distributor/products", label: "Sản Phẩm & Truy Xuất", icon: PackageSearch },
  { href: "/dashboard/distributor/settings", label: "Cài Đặt Tài Khoản", icon: Settings },
  { href: "/traceability", label: "Truy Xuất Mã QR Chung", icon: QrCode },
];

const adminNavigation: NavItem[] = [
  { href: "/dashboard/admin?tab=verifications", label: "Tổng Quan & Duyệt Hồ Sơ", icon: Shield, group: "Tổng quan" },
  { href: "/dashboard/admin?tab=batches", label: "Duyệt Lô Xuất Kho", icon: PackageCheck, group: "Tổng quan" },
  { href: "/dashboard/admin?tab=certs", label: "Duyệt Chứng Nhận Nông Trại", icon: Award, group: "Tổng quan" },
  { href: "/dashboard/admin?tab=orders", label: "Quản Lý Đơn Hàng Hệ Thống", icon: ClipboardList, group: "Vận hành" },
  { href: "/dashboard/farmer", label: "Giám Sát Nông Trại", icon: Leaf, group: "Vận hành" },
  { href: "/dashboard/warehouse", label: "Giám Sát Kho Hàng", icon: Warehouse, group: "Vận hành" },
  { href: "/dashboard/distributor", label: "Giám Sát Vận Chuyển", icon: Truck, group: "Vận hành" },
  { href: "/dashboard/admin?tab=loyalty", label: "Quản Lý Hội Viên AgriClub", icon: Crown, group: "Khách hàng" },
  { href: "/dashboard/admin?tab=events", label: "Quản Lý Sự Kiện & Mùa Vụ", icon: CalendarRange, group: "Marketing & nội dung" },
  { href: "/dashboard/admin?tab=vouchers", label: "Quản Lý Voucher & Ưu Đãi", icon: Ticket, group: "Marketing & nội dung" },
  { href: "/dashboard/admin?tab=blog", label: "Quản Trị Blog & Cẩm Nang", icon: BookOpen, group: "Marketing & nội dung" },
  { href: "/dashboard/users", label: "Quản Lý Người Dùng", icon: Users, group: "Hệ thống" },
];

const roleLabelMap: Record<string, string> = {
  ADMIN: "Quản trị viên",
  FARMER: "Nông dân",
  WAREHOUSE_STAFF: "Nhân viên kho",
  WAREHOUSE: "Nhân viên kho",
  DISTRIBUTOR: "Vận chuyển",
  CUSTOMER: "Khách hàng",
};

const roleBadgeColor: Record<string, { bg: string; text: string; dot: string }> = {
  ADMIN: { bg: "bg-rose-50 text-rose-700 border-rose-200", dot: "bg-rose-500", text: "text-rose-700" },
  FARMER: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700" },
  WAREHOUSE_STAFF: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "text-blue-700" },
  WAREHOUSE: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", text: "text-blue-700" },
  DISTRIBUTOR: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", text: "text-amber-700" },
  CUSTOMER: { bg: "bg-emerald-50 text-emerald-800 border-emerald-200", dot: "bg-emerald-600", text: "text-emerald-700" },
};

function SidebarNavItems({
  navItems,
  pathname,
  onSelect,
}: {
  navItems: NavItem[];
  pathname: string;
  onSelect: () => void;
}) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab");

  return (
    <>
      {navItems.map((item, index) => {
        const [itemPath, itemQuery] = item.href.split("?");
        const itemTab = itemQuery ? new URLSearchParams(itemQuery).get("tab") : null;
        const active = itemTab
          ? pathname === itemPath && currentTab === itemTab
          : pathname === item.href && (!currentTab || pathname !== "/dashboard/admin");
        const Icon = item.icon;
        const showGroup = item.group && item.group !== navItems[index - 1]?.group;
        return (
          <Fragment key={item.href}>
            {showGroup && (
              <div
                className={cn(
                  "px-3.5 pb-1.5 pt-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400",
                  index === 0 && "pt-1"
                )}
              >
                {item.group}
              </div>
            )}
            <Link
              href={item.href}
              onClick={onSelect}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534] ${
                active
                  ? "bg-[#166534] text-white font-bold shadow-sm"
                  : "text-stone-600 hover:bg-stone-100/90 hover:text-stone-900"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  size={17}
                  className={
                    active
                      ? "text-amber-300"
                      : "text-stone-400 group-hover:text-[#166534] transition-colors"
                  }
                />
                <span className="truncate">{item.label}</span>
              </div>
              {active && <ChevronRight size={14} className="text-emerald-200 shrink-0" />}
            </Link>
          </Fragment>
        );
      })}
    </>
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasHydrated, clearSession, refreshToken } = useAuthStore();

  const checkRole = (role: string) =>
    Boolean(user?.roles?.some((r) => r === role || r === `ROLE_${role}`));

  const isAdmin = checkRole("ADMIN");
  const isFarmer = checkRole("FARMER");
  const isWarehouse = checkRole("WAREHOUSE") || checkRole("WAREHOUSE_STAFF");
  const isDistributor = checkRole("DISTRIBUTOR");

  const isAdminRoute = pathname.startsWith("/dashboard/admin") || pathname.startsWith("/dashboard/users");
  const isFarmerRoute = pathname.startsWith("/dashboard/farmer");
  const isWarehouseRoute = pathname.startsWith("/dashboard/warehouse");
  const isDistributorRoute = pathname.startsWith("/dashboard/distributor");

  const forbidden =
    Boolean(user) &&
    ((isAdminRoute && !isAdmin) ||
      (isFarmerRoute && !isFarmer && !isAdmin) ||
      (isWarehouseRoute && !isWarehouse && !isAdmin) ||
      (isDistributorRoute && !isDistributor && !isAdmin));

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
    else if (hasHydrated && forbidden) {
      toast.error("Tài khoản của bạn không có quyền truy cập vào cổng nghiệp vụ của vai trò này.");
      router.replace("/dashboard");
    }
  }, [hasHydrated, router, user, forbidden]);

  if (!hasHydrated || !user || forbidden) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4">
        <LoadingSkeleton rows={6} />
      </main>
    );
  }

  // Khách hàng xem đơn hàng: hiển thị thẳng trong trang web, giữ nguyên Navbar công khai, không dùng sidebar quản trị
  if (pathname === "/dashboard/customer") {
    return (
      <div className="w-full bg-[#fbfdfb] min-h-[calc(100vh-160px)] py-6 sm:py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">{children}</div>
      </div>
    );
  }

  async function logout() {
    try {
      await authService.logout(refreshToken);
    } catch {
      /* ignore */
    }
    clearSession();
    toast.info("Đã đăng xuất thành công.");
    router.replace("/");
  }

  const hasRole = (role: string) =>
    Boolean(user.roles?.some((r) => r === role || r === `ROLE_${role}`));

  const primaryRole = hasRole("ADMIN")
    ? "ADMIN"
    : hasRole("FARMER")
    ? "FARMER"
    : hasRole("WAREHOUSE") || hasRole("WAREHOUSE_STAFF")
    ? "WAREHOUSE"
    : hasRole("DISTRIBUTOR")
    ? "DISTRIBUTOR"
    : "CUSTOMER";
  const roleLabel = roleLabelMap[primaryRole] ?? "Khách hàng";
  const badgeStyle = roleBadgeColor[primaryRole] ?? roleBadgeColor.CUSTOMER;

  // Lựa chọn Menu Navigation theo đúng vai trò thực tế
  let navItems = customerNavigation;
  if (user.roles.includes("ADMIN")) {
    navItems = adminNavigation;
  } else if (user.roles.includes("FARMER")) {
    navItems = farmerNavigation;
  } else if (user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF")) {
    navItems = warehouseNavigation;
  } else if (user.roles.includes("DISTRIBUTOR")) {
    navItems = distributorNavigation;
  }

  return (
    <div className="min-h-screen flex bg-[#FBF9F5] font-sans text-[#16261E]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-xs lg:hidden cursor-pointer"
        />
      )}

      {/* Sidebar: Fixed 280px on Desktop, Flex-synced so it NEVER overlaps main content */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 bg-[#F6F3EC] border-r border-[#E4DFD5] shadow-2xl lg:shadow-none flex flex-col transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-[#E4DFD5] flex items-center justify-between bg-[#FBF9F5]">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#16261E] text-amber-300 flex items-center justify-center shadow-xs group-hover:bg-[#166534] transition-colors">
              <Leaf size={18} strokeWidth={2.3} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-base tracking-tight text-[#16261E]">
                  Agri<span className="text-[#166534]">Trace</span>
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#166534]/10 text-[#166534]">
                  v2.6
                </span>
              </div>
              <span className="block text-[9px] uppercase tracking-[0.14em] text-stone-500 font-bold">
                Botanical Supply OS
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Đóng menu điều hướng"
            className="lg:hidden rounded-lg p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Operator Dossier Card */}
        <div className="p-4 border-b border-[#E4DFD5]">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-[#E4DFD5] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#16261E] text-amber-300 flex items-center justify-center font-serif font-bold text-sm shadow-xs shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-[#16261E] truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3.5 flex-1 overflow-y-auto space-y-1">
          <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">
            {primaryRole === "CUSTOMER" ? "Khu Vực Cá Nhân" : "Điều Hành Chuỗi Cung Ứng"}
          </div>

          <Suspense fallback={<div className="p-4 text-xs text-stone-400">Đang tải menu…</div>}>
            <SidebarNavItems
              navItems={navItems}
              pathname={pathname}
              onSelect={() => setSidebarOpen(false)}
            />
          </Suspense>

          <div className="pt-4 mt-3 border-t border-[#E4DFD5] px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-stone-400">
            Lối Tắt Cổng Ngoài
          </div>

          <Link
            href="/"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 hover:text-[#16261E] transition-colors"
          >
            <Home size={16} className="text-[#166534]" />
            <span>Trang Chủ Nông Trại</span>
          </Link>

          <Link
            href="/products"
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-200/60 hover:text-[#16261E] transition-colors"
          >
            <Store size={16} className="text-[#A3630A]" />
            <span>Cửa Hàng Nông Sản</span>
          </Link>
        </nav>

        {/* Footer Logout */}
        <div className="p-3.5 border-t border-[#E4DFD5] bg-[#F2EFE8]">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-colors cursor-pointer shadow-2xs"
          >
            <LogOut size={15} /> Đăng Xuất Hệ Thống
          </button>
        </div>
      </aside>

      {/* Main Content Area: Exact lg:pl-[280px] matching w-[280px] sidebar so zero overlap occurs */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-[280px]">
        {/* Top Architectural Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#FBF9F5]/90 backdrop-blur-md border-b border-[#E4DFD5] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Mở menu điều hướng"
              className="lg:hidden rounded-xl p-2 text-stone-700 hover:bg-stone-200/60 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#166534]"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#16261E] text-amber-300 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                LIVE OPS
              </span>
              <h2 className="font-serif text-sm sm:text-lg font-bold text-[#16261E] truncate">
                {primaryRole === "FARMER"
                  ? "Trung Tâm Quản Lý Nông Trại & Nhật Ký Mùa Vụ"
                  : primaryRole === "ADMIN"
                  ? "Trung Tâm Điều Hành Chuỗi Cung Ứng AgriTrace AI"
                  : primaryRole === "WAREHOUSE"
                  ? "Trung Tâm Quản Lý Kho Lạnh & Điều Phối FEFO"
                  : primaryRole === "DISTRIBUTOR"
                  ? "Trung Tâm Điều Phối Vận Chuyển Chuỗi Lạnh"
                  : "Tài Khoản & Đơn Mua"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className={`hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${badgeStyle.bg}`}>
              <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
              <span>{roleLabel}</span>
            </span>

            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#16261E] text-[#16261E] hover:text-white border border-[#E4DFD5] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Home size={13} />
              <span>Trang Chủ</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
