"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { MainFooter } from "./main-footer";
import { MainNavbar } from "./main-navbar";

export function PublicLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Khách hàng xem đơn hàng (/dashboard/customer) vẫn giữ Navbar & Footer công khai như web mua sắm
  const isInternalDashboard =
    pathname.startsWith("/dashboard") && pathname !== "/dashboard/customer";
  const isStandaloneQrPage = pathname.startsWith("/qr/");
  const isAuth =
    pathname === "/login" || pathname === "/register" || pathname === "/forgot-password";

  if (isInternalDashboard || isAuth || isStandaloneQrPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FBF9F5] text-[#16261E]">
      <MainNavbar />
      <main className="flex-1">{children}</main>
      <MainFooter />
    </div>
  );
}
