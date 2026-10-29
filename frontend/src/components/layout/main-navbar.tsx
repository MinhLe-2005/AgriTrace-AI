"use client";

import {
  Award,
  Bell,
  CheckCheck,
  Gift,
  KeyRound,
  Leaf,
  LogOut,
  Menu,
  QrCode,
  Shield,
  ShoppingBag,
  Sprout,
  Truck,
  User,
  Users,
  Warehouse,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth-store";
import { useCartStore } from "@/stores/cart-store";
import { useNotificationStore } from "@/stores/notification-store";

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
  const [notifOpen, setNotifOpen] = useState(false);

  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const unreadNotifs = notifications.filter((n) => !n.read);
  const cartCount = useCartStore((s) => s.getItemCount());

  useEffect(() => {
    setMobileOpen(false);
    setUserOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  const primaryRole = user?.roles[0] || "CUSTOMER";

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
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

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? "text-emerald-700 bg-emerald-50 font-bold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-2.5">
          {/* Notifications Bell */}
          {user && (
          <div className="relative">
            <button
              onClick={() => {
                setNotifOpen(!notifOpen);
                setUserOpen(false);
              }}
              className="relative p-2 rounded-lg text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
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
              <div className="absolute right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-2 z-50 text-xs animate-fade-in-up">
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
                      className="text-[11px] font-medium text-emerald-700 hover:underline flex items-center gap-1"
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
                    notifications.slice(0, 5).map((n) => (
                      <Link
                        key={n.id}
                        href={n.link || "/dashboard/customer?tab=notifications"}
                        onClick={() => {
                          markAsRead(n.id);
                          setNotifOpen(false);
                        }}
                        className={`p-3.5 block transition-colors hover:bg-gray-50/80 ${
                          !n.read ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                              n.type === "order"
                                ? "bg-blue-100 text-blue-700"
                                : n.type === "voucher"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {n.type === "order" ? (
                              <Truck size={14} />
                            ) : n.type === "voucher" ? (
                              <Gift size={14} />
                            ) : (
                              <Leaf size={14} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <p className="font-semibold text-gray-900 text-xs truncate">{n.title}</p>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              )}
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

                <div className="p-2 border-t border-gray-100 bg-gray-50/50 text-center">
                  <Link
                    href="/dashboard/customer?tab=notifications"
                    onClick={() => setNotifOpen(false)}
                    className="text-xs font-semibold text-emerald-800 hover:underline block py-1"
                  >
                    Xem tất cả trong tài khoản →
                  </Link>
                </div>
              </div>
            )}
          </div>
          )}

          <Link
            href="/cart"
            className="relative p-2 rounded-lg text-gray-600 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
            title="Giỏ hàng"
          >
            <ShoppingBag size={18} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-emerald-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <>
              {/* Role-based Quick Link button */}
              {user.roles.includes("ADMIN") ? (
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
                  title="Vào trang quản trị"
                >
                  <Shield size={14} strokeWidth={1.75} />
                  <span>Quản Trị</span>
                </Link>
              ) : user.roles.includes("FARMER") ? (
                <Link
                  href="/dashboard/farmer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-xs transition-colors"
                  title="Vào cổng nông trại"
                >
                  <Sprout size={14} strokeWidth={1.75} />
                  <span>Nông Trại</span>
                </Link>
              ) : user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF") ? (
                <Link
                  href="/dashboard/warehouse"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
                  title="Vào cổng kho hàng"
                >
                  <Warehouse size={14} strokeWidth={1.75} />
                  <span>Kho Hàng</span>
                </Link>
              ) : user.roles.includes("DISTRIBUTOR") ? (
                <Link
                  href="/dashboard/distributor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-xs transition-colors"
                  title="Vào cổng vận chuyển"
                >
                  <Truck size={14} strokeWidth={1.75} />
                  <span>Vận Chuyển</span>
                </Link>
              ) : (
                <Link
                  href="/dashboard/customer?tab=orders"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
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
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-emerald-400 bg-white text-xs font-semibold text-gray-700 transition-colors"
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
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 text-xs animate-fade-in-up">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2.5">
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
                        <p className="font-bold text-gray-800 truncate">{user.name}</p>
                        <p className="text-gray-400 text-[11px] truncate">{user.email}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {roleLabelMap[primaryRole] || "Khách hàng"}
                        </span>
                      </div>
                    </div>

                    {user.roles.includes("ADMIN") ? (
                      <>
                        <Link
                          href="/dashboard/admin"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          <Shield size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Quản trị hệ thống</span>
                        </Link>
                        <Link
                          href="/dashboard/users"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          <Users size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Quản lý tài khoản</span>
                        </Link>
                        <Link
                          href="/dashboard/customer"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium"
                        >
                          <ShoppingBag size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Xem trang Khách hàng</span>
                        </Link>
                      </>
                    ) : user.roles.includes("FARMER") ? (
                      <>
                        <Link
                          href="/dashboard/farmer"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
                        >
                          <Sprout size={14} strokeWidth={1.75} className="text-emerald-700" />
                          <span>Quản lý nông trại</span>
                        </Link>
                        <Link
                          href="/traceability"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium"
                        >
                          <QrCode size={14} strokeWidth={1.75} className="text-emerald-700" />
                          <span>Cấp tem QR lô hàng</span>
                        </Link>
                      </>
                    ) : user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF") ? (
                      <>
                        <Link
                          href="/dashboard/warehouse"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 font-medium"
                        >
                          <Warehouse size={14} strokeWidth={1.75} className="text-blue-700" />
                          <span>Quản lý kho lạnh & FEFO</span>
                        </Link>
                        <Link
                          href="/traceability"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-800 font-medium"
                        >
                          <QrCode size={14} strokeWidth={1.75} className="text-blue-700" />
                          <span>Quét mã nhập kho</span>
                        </Link>
                      </>
                    ) : user.roles.includes("DISTRIBUTOR") ? (
                      <>
                        <Link
                          href="/dashboard/distributor"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-800 font-medium"
                        >
                          <Truck size={14} strokeWidth={1.75} className="text-amber-700" />
                          <span>Đơn vận chuyển xe lạnh</span>
                        </Link>
                        <Link
                          href="/traceability"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-amber-50 hover:text-amber-800 font-medium"
                        >
                          <QrCode size={14} strokeWidth={1.75} className="text-amber-700" />
                          <span>Quét bàn giao hàng</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/dashboard/customer?tab=profile"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <User size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Hồ sơ của tôi</span>
                        </Link>
                        <Link
                          href="/dashboard/customer?tab=orders"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <ShoppingBag size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Đơn mua của tôi</span>
                        </Link>
                        <Link
                          href="/dashboard/customer?tab=vouchers"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <Gift size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Kho Voucher & Ưu đãi</span>
                        </Link>
                        <Link
                          href="/dashboard/customer?tab=points"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <Award size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Điểm & Hạng hội viên</span>
                        </Link>
                        <Link
                          href="/dashboard/customer?tab=notifications"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <Bell size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Thông báo của tôi</span>
                        </Link>
                        <Link
                          href="/dashboard/customer?tab=password"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 font-medium transition-colors"
                        >
                          <KeyRound size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Đổi mật khẩu</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-1 pt-1">
                      {user.roles.some((r) => r !== "CUSTOMER") && (
                        <Link
                          href="/dashboard/customer?tab=password"
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                          <KeyRound size={14} strokeWidth={1.75} className="text-gray-500" />
                          <span>Đổi mật khẩu</span>
                        </Link>
                      )}
                      <button
                        onClick={() => clearSession()}
                        className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 font-medium flex items-center gap-2"
                      >
                        <LogOut size={13} strokeWidth={1.75} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
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
                  Vào Trang Quản Trị Hệ Thống
                </Link>
              )}
              {user.roles.includes("FARMER") && (
                <Link href="/dashboard/farmer" className="block px-3 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg">
                  Vào Cổng Quản Lý Nông Trại
                </Link>
              )}
              {(user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF")) && (
                <Link href="/dashboard/warehouse" className="block px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50 rounded-lg">
                  Vào Cổng Quản Lý Kho Hàng
                </Link>
              )}
              {user.roles.includes("DISTRIBUTOR") && (
                <Link href="/dashboard/distributor" className="block px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-50 rounded-lg">
                  Vào Cổng Đơn Vận Chuyển
                </Link>
              )}
              {user.roles.includes("CUSTOMER") && (
                <Link href="/dashboard/customer" className="block px-3 py-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50 rounded-lg">
                  Xem Đơn Mua Của Bạn
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
