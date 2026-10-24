"use client";

import {
  Award,
  ChevronRight,
  Gift,
  Home,
  Leaf,
  LogOut,
  Menu,
  QrCode,
  Shield,
  ShoppingBag,
  ShoppingCart,
  Store,
  Truck,
  User,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { LoadingSkeleton } from "@/components/ui/states";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

type NavItem = {
  href: string;
  label: string;
  icon: any;
  badge?: string;
};

const customerNavigation: NavItem[] = [
  { href: "/dashboard/customer", label: "Đơn Mua Của Tôi", icon: ShoppingBag },
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
  { href: "/dashboard/distributor", label: "Đơn Hàng Vận Chuyển", icon: Truck },
  { href: "/traceability", label: "Quét Mã Bàn Giao", icon: QrCode },
];

const adminNavigation: NavItem[] = [
  { href: "/dashboard/admin", label: "Tổng Quan Hệ Thống", icon: Shield },
  { href: "/dashboard/users", label: "Quản Lý Người Dùng", icon: Users },
  { href: "/dashboard/farmer", label: "Giám Sát Nông Trại", icon: Leaf },
  { href: "/dashboard/warehouse", label: "Giám Sát Kho Hàng", icon: Warehouse },
  { href: "/dashboard/distributor", label: "Giám Sát Vận Chuyển", icon: Truck },
  { href: "/dashboard/customer", label: "Giám Sát Khách Hàng", icon: User },
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

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasHydrated, clearSession, refreshToken } = useAuthStore();

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, router, user]);

  if (!hasHydrated || !user) {
    return (
      <main className="max-w-4xl mx-auto py-12 px-4">
        <LoadingSkeleton rows={6} />
      </main>
    );
  }

  async function logout() {
    try {
      await authService.logout(refreshToken);
    } catch {
      /* ignore */
    }
    clearSession();
    toast.info("Đã đăng xuất.");
    router.replace("/login");
  }

  const primaryRole = user.roles[0] ?? "CUSTOMER";
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
    <div className="min-h-screen flex bg-gray-50/70 font-sans text-gray-900">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col z-50 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand */}
        <div className="h-16 px-5 border-b border-gray-100 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
              <Leaf size={18} strokeWidth={2.4} />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-gray-900">
                Agri<span className="text-emerald-700">Trace</span>
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold">
                Nông sản sạch
              </span>
            </div>
          </Link>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 flex-1 overflow-y-auto space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {primaryRole === "CUSTOMER" ? "Khu Vực Cá Nhân" : "Bảng Chức Năng"}
          </div>

          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? "bg-emerald-50 text-emerald-800 font-bold shadow-xs border border-emerald-100"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    size={17}
                    className={active ? "text-emerald-700" : "text-gray-400"}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {active && <ChevronRight size={14} className="text-emerald-700" />}
              </Link>
            );
          })}

          <div className="pt-4 mt-3 border-t border-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
            Lối Tắt Nhanh
          </div>

          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Home size={16} className="text-gray-400" />
            <span>Trang Chủ</span>
          </Link>

          <Link
            href="/products"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
          >
            <Store size={16} className="text-gray-400" />
            <span>Xem Cửa Hàng</span>
          </Link>
        </nav>

        {/* Footer Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <LogOut size={15} /> Đăng Xuất
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-sm sm:text-base font-bold text-gray-800 truncate">
              {primaryRole === "CUSTOMER" ? "Tài Khoản & Đơn Mua" : "Khu Vực Quản Lý"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${badgeStyle.bg}`}>
              <span className={`w-2 h-2 rounded-full ${badgeStyle.dot}`} />
              Vai trò: {roleLabel}
            </span>

            <Link
              href="/"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              ← Về Trang Chủ
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
