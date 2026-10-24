"use client";

import {
  Award,
  Gift,
  Leaf,
  LogOut,
  Menu,
  Shield,
  ShoppingBag,
  Truck,
  User,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth-store";

const navLinks = [
  { label: "Trang Chủ", href: "/" },
  { label: "Sản Phẩm", href: "/products" },
  { label: "Truy Xuất QR", href: "/traceability" },
  { label: "Mã Ưu Đãi", href: "/vouchers" },
  { label: "Hội Viên", href: "/loyalty" },
  { label: "Về Chúng Tôi", href: "/about" },
];

const roleLabelMap: Record<string, string> = {
  ADMIN: "Quản trị viên",
  FARMER: "Nông dân",
  WAREHOUSE_STAFF: "Nhân viên kho",
  WAREHOUSE: "Nhân viên kho",
  DISTRIBUTOR: "Nhà phân phối",
  CUSTOMER: "Khách hàng",
};

export function MainNavbar() {
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
  }, [pathname]);

  const primaryRole = user?.roles[0] || "CUSTOMER";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div className="leading-none">
            <span className="font-extrabold text-xl text-gray-900">
              Agri<span className="text-emerald-700">Trace</span>
            </span>
            <span className="block text-[9px] text-gray-400 font-semibold tracking-wider uppercase">
              Nông sản sạch từ trang trại
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-emerald-700 bg-emerald-50"
                    : "text-gray-600 hover:text-emerald-700 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Cart + Role Portal Action + User Button */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/cart"
            className="relative p-2 text-gray-600 hover:text-emerald-700 hover:bg-gray-50 rounded-lg transition-colors"
            title="Giỏ hàng"
          >
            <ShoppingBag size={21} />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              2
            </span>
          </Link>

          {user ? (
            <>
              {/* Nút hành động tương ứng với từng Vai trò (Admin, Nông dân, Thủ kho, Vận chuyển, Khách hàng) */}
              {user.roles.includes("ADMIN") ? (
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
                  title="Vào trang quản trị hệ thống"
                >
                  <Shield size={14} /> Quản Trị
                </Link>
              ) : user.roles.includes("FARMER") ? (
                <Link
                  href="/dashboard/farmer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
                  title="Vào cổng nông dân"
                >
                  <Leaf size={14} /> Nông Trại
                </Link>
              ) : user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF") ? (
                <Link
                  href="/dashboard/warehouse"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                  title="Vào cổng thủ kho"
                >
                  <Warehouse size={14} /> Kho Hàng
                </Link>
              ) : user.roles.includes("DISTRIBUTOR") ? (
                <Link
                  href="/dashboard/distributor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors"
                  title="Vào cổng vận chuyển"
                >
                  <Truck size={14} /> Vận Chuyển
                </Link>
              ) : (
                <Link
                  href="/dashboard/customer"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                  title="Xem đơn mua của bạn"
                >
                  <ShoppingBag size={14} /> Đơn Mua
                </Link>
              )}

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-400 bg-white text-xs font-semibold text-gray-700 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[11px] font-bold">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden md:inline max-w-[90px] truncate">{user.name || user.email}</span>
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs animate-fade-in-up">
                    <div className="px-3 py-2 border-b border-gray-100">
                      <p className="font-bold text-gray-800 truncate">{user.name}</p>
                      <p className="text-gray-400 text-[11px] truncate">{user.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {roleLabelMap[primaryRole] || "Khách hàng"}
                      </span>
                    </div>

                    {user.roles.includes("ADMIN") ? (
                      <>
                        <Link href="/dashboard/admin" className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 font-medium">🛡️ Quản trị hệ thống</Link>
                        <Link href="/dashboard/users" className="block px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 font-medium">👥 Quản lý tài khoản</Link>
                        <Link href="/dashboard/customer" className="block px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium">🛍️ Xem trang Khách hàng</Link>
                      </>
                    ) : user.roles.includes("FARMER") ? (
                      <>
                        <Link href="/dashboard/farmer" className="block px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">🌱 Quản lý nông trại</Link>
                        <Link href="/traceability" className="block px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">🏷️ Cấp tem QR lô hàng</Link>
                      </>
                    ) : user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF") ? (
                      <>
                        <Link href="/dashboard/warehouse" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium">🏢 Quản lý kho lạnh & FEFO</Link>
                        <Link href="/traceability" className="block px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-700 font-medium">📥 Quét mã nhập kho</Link>
                      </>
                    ) : user.roles.includes("DISTRIBUTOR") ? (
                      <>
                        <Link href="/dashboard/distributor" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium">🚚 Đơn vận chuyển xe lạnh</Link>
                        <Link href="/traceability" className="block px-3 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-700 font-medium">📦 Quét bàn giao hàng</Link>
                      </>
                    ) : (
                      <>
                        <Link href="/dashboard/customer" className="block px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">🛍️ Đơn mua của tôi</Link>
                        <Link href="/vouchers" className="block px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">🎟️ Kho Voucher</Link>
                        <Link href="/loyalty" className="block px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 font-medium">⭐ Điểm & Hạng hội viên</Link>
                      </>
                    )}

                    <button
                      onClick={() => clearSession()}
                      className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center gap-1.5 border-t border-gray-100 mt-1"
                    >
                      <LogOut size={13} /> Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors shadow-xs"
            >
              Đăng Nhập
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1 shadow-lg">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              {item.label}
            </Link>
          ))}

          {user && (
            <div className="pt-2 border-t border-gray-100">
              {user.roles.includes("ADMIN") && (
                <Link href="/dashboard/admin" className="block px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg">
                  🛡️ Vào Trang Quản Trị Hệ Thống
                </Link>
              )}
              {user.roles.includes("FARMER") && (
                <Link href="/dashboard/farmer" className="block px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg">
                  🌱 Vào Cổng Quản Lý Nông Trại
                </Link>
              )}
              {(user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF")) && (
                <Link href="/dashboard/warehouse" className="block px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 rounded-lg">
                  🏢 Vào Cổng Quản Lý Kho Hàng
                </Link>
              )}
              {user.roles.includes("DISTRIBUTOR") && (
                <Link href="/dashboard/distributor" className="block px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50 rounded-lg">
                  🚚 Vào Cổng Đơn Vận Chuyển
                </Link>
              )}
              {user.roles.includes("CUSTOMER") && (
                <Link href="/dashboard/customer" className="block px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg">
                  🛍️ Xem Đơn Mua Của Bạn
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
