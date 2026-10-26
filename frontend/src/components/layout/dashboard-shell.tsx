"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { LoadingSkeleton } from "@/components/ui/states";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";

type NavItem = { href: string; label: string };
const navigation: Record<string, NavItem[]> = {
  CUSTOMER: [{ href: "/dashboard/customer", label: "Đơn mua của tôi" }, { href: "/vouchers", label: "Kho voucher" }, { href: "/loyalty", label: "Điểm hội viên" }, { href: "/traceability", label: "Truy xuất QR" }, { href: "/products", label: "Cửa hàng" }, { href: "/cart", label: "🛒 Giỏ hàng" }],
  FARMER: [{ href: "/dashboard/farmer", label: "Quản lý nông trại" }, { href: "/traceability", label: "Cấp mã QR lô hàng" }, { href: "/products", label: "Xem gian hàng" }],
  WAREHOUSE: [{ href: "/dashboard/warehouse", label: "Quản lý kho lạnh" }, { href: "/traceability", label: "Nhập kho và FEFO" }],
  DISTRIBUTOR: [{ href: "/dashboard/distributor", label: "Đơn hàng vận chuyển" }, { href: "/traceability", label: "Bàn giao hàng" }],
  ADMIN: [{ href: "/dashboard/admin", label: "Tổng quan hệ thống" }, { href: "/dashboard/users", label: "Quản lý người dùng" }, { href: "/dashboard/farmer", label: "Giám sát nông trại" }, { href: "/dashboard/warehouse", label: "Giám sát kho hàng" }, { href: "/dashboard/distributor", label: "Giám sát vận chuyển" }, { href: "/dashboard/customer", label: "Giám sát khách hàng" }],
};
const roleLabels: Record<string, string> = { ADMIN: "Quản trị viên", FARMER: "Nông dân", WAREHOUSE_STAFF: "Nhân viên kho", WAREHOUSE: "Nhân viên kho", DISTRIBUTOR: "Vận chuyển", CUSTOMER: "Khách hàng" };

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(); const router = useRouter(); const [sidebarOpen, setSidebarOpen] = useState(false); const { user, hasHydrated, clearSession, refreshToken } = useAuthStore();
  useEffect(() => { if (hasHydrated && !user) router.replace("/login"); }, [hasHydrated, router, user]);
  if (!hasHydrated || !user) return <main className="mx-auto max-w-4xl px-4 py-12"><LoadingSkeleton rows={6} /></main>;
  async function logout() { try { await authService.logout(refreshToken); } catch { /* ignore */ } clearSession(); toast.info("Đã đăng xuất."); router.replace("/login"); }
  const role = user.roles.includes("ADMIN") ? "ADMIN" : user.roles.includes("FARMER") ? "FARMER" : user.roles.includes("WAREHOUSE") || user.roles.includes("WAREHOUSE_STAFF") ? "WAREHOUSE" : user.roles.includes("DISTRIBUTOR") ? "DISTRIBUTOR" : "CUSTOMER";
  const items = navigation[role]; const roleLabel = roleLabels[user.roles[0]] || "Khách hàng";
  return <div className="flex min-h-screen bg-gray-50/70 font-sans text-gray-900">
    {sidebarOpen && <button aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
    <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-16 items-center justify-between border-b border-gray-100 px-5"><Link href="/" className="leading-none"><span className="font-extrabold tracking-tight text-gray-900">Agri<span className="text-emerald-700">Trace</span></span><span className="mt-1 block text-[9px] font-bold uppercase tracking-wider text-gray-400">Nông sản sạch</span></Link><button aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} className="rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 lg:hidden">× Đóng</button></div>
      <div className="border-b border-gray-100 bg-gray-50/50 p-4"><p className="truncate text-xs font-bold text-gray-900">{user.name}</p><span className="mt-1 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{roleLabel}</span></div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3"><div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">Khu vực chức năng</div>{items.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`block rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${active ? "border border-emerald-100 bg-emerald-50 font-bold text-emerald-800" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>{item.label}</Link>; })}<div className="mt-4 border-t border-gray-100 px-3 pt-4"><Link href="/" className="block rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100">Trang chủ</Link><Link href="/products" className="block rounded-lg px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100">Xem cửa hàng</Link></div></nav>
      <div className="border-t border-gray-100 p-3"><button onClick={logout} className="w-full rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50">Đăng xuất</button></div>
    </aside>
    <div className="flex min-w-0 flex-1 flex-col lg:pl-64"><header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6"><div className="flex items-center gap-3"><button aria-label="Mở menu" onClick={() => setSidebarOpen(true)} className="rounded-lg px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 lg:hidden">Menu</button><h2 className="truncate text-sm font-bold text-gray-800 sm:text-base">{role === "CUSTOMER" ? "Tài khoản và đơn mua" : "Khu vực quản lý"}</h2></div><div className="flex items-center gap-3"><span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 sm:inline-flex">Vai trò: {roleLabel}</span><Link href="/" className="text-xs font-semibold text-emerald-700 hover:underline">Về trang chủ</Link></div></header><main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main></div>
  </div>;
}
