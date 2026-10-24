"use client";

import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

import { MainFooter } from "./main-footer";
import { MainNavbar } from "./main-navbar";

export function PublicLayoutWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isAuth = pathname === "/login" || pathname === "/register";

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNavbar />
      <main className="flex-1">{children}</main>
      {!isAuth && <MainFooter />}
    </div>
  );
}
