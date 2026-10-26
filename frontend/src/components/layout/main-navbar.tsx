"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuthStore } from "@/stores/auth-store";

const navLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Truy xuất QR", href: "/traceability" },
  { label: "Mã ưu đãi", href: "/vouchers" },
  { label: "Hội viên", href: "/loyalty" },
  { label: "Về chúng tôi", href: "/about" },
];

const roleLabelMap: Record<string, string> = { ADMIN: "Quản trị viên", FARMER: "Nông dân", WAREHOUSE_STAFF: "Nhân viên kho", WAREHOUSE: "Nhân viên kho", DISTRIBUTOR: "Nhà phân phối", CUSTOMER: "Khách hàng" };

export function MainNavbar() {
  const pathname = usePathname();
  const { user, clearSession } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); setUserOpen(false); }, [pathname]);

  const primaryRole = user?.roles[0] || "CUSTOMER";
  const portal = user?.roles.includes("ADMIN") ? ["/dashboard/admin", "Quản trị"] : user?.roles.includes("FARMER") ? ["/dashboard/farmer", "Nông trại"] : user?.roles.includes("WAREHOUSE") || user?.roles.includes("WAREHOUSE_STAFF") ? ["/dashboard/warehouse", "Kho hàng"] : user?.roles.includes("DISTRIBUTOR") ? ["/dashboard/distributor", "Vận chuyển"] : ["/dashboard/customer", "Đơn mua"];

  return <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-xs">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
      <Link href="/" className="shrink-0 leading-none"><span className="text-xl font-extrabold text-gray-900">Agri<span className="text-emerald-700">Trace</span></span><span className="mt-1 block text-[9px] font-semibold uppercase tracking-wider text-gray-400">Nông sản sạch từ trang trại</span></Link>
      <nav className="hidden items-center gap-1 md:flex">{navLinks.map((item) => { const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${active ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:bg-gray-50 hover:text-emerald-700"}`}>{item.label}</Link>; })}</nav>
      <div className="flex items-center gap-2">
        <Link href="/cart" className="rounded-lg px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-emerald-700">🛒 Giỏ hàng <span className="ml-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold text-white">2</span></Link>
        {user ? <><Link href={portal[0]} className="hidden rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800 sm:block">{portal[1]}</Link><div className="relative"><button aria-expanded={userOpen} onClick={() => setUserOpen(!userOpen)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:border-emerald-400"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">{user.name?.charAt(0)?.toUpperCase() || "U"}</span><span className="hidden max-w-[90px] truncate md:inline">{user.name || user.email}</span></button>{userOpen && <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-gray-100 bg-white py-1.5 text-xs shadow-xl"><div className="border-b border-gray-100 px-3 py-2"><p className="truncate font-bold text-gray-800">{user.name}</p><p className="truncate text-[11px] text-gray-400">{user.email}</p><span className="mt-1 inline-block rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">{roleLabelMap[primaryRole] || "Khách hàng"}</span></div><Link href={portal[0]} className="block px-3 py-2 font-medium text-gray-700 hover:bg-emerald-50">Mở khu vực làm việc</Link><button onClick={() => clearSession()} className="w-full border-t border-gray-100 px-3 py-2 text-left font-medium text-red-600 hover:bg-red-50">Đăng xuất</button></div>}</div></> : <Link href="/login" className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-800">Đăng nhập</Link>}
        <button aria-label={mobileOpen ? "Đóng menu" : "Mở menu"} onClick={() => setMobileOpen(!mobileOpen)} className="rounded-lg px-2 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 md:hidden">{mobileOpen ? "× Đóng" : "☰ Menu"}</button>
      </div>
    </div>
    {mobileOpen && <div className="space-y-1 border-t border-gray-100 bg-white px-4 py-3 md:hidden">{navLinks.map((item) => <Link key={item.href} href={item.href} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700">{item.label}</Link>)}{user && <Link href={portal[0]} className="mt-2 block border-t border-gray-100 px-3 py-3 text-sm font-bold text-emerald-700">{portal[1]}</Link>}</div>}
  </header>;
}
