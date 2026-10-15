"use client";

import {
  FolderOpen,
  LayoutDashboard,
  Leaf,
  LogOut,
  Menu,
  Shield,
  Truck,
  User,
  Users,
  Warehouse,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { LoadingSkeleton } from "@/components/ui/states";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";


const navigation = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/dashboard/admin", label: "1. Quản trị (Admin)", icon: Shield },
  { href: "/dashboard/farmer", label: "2. Nông dân (Farmer)", icon: Leaf },
  { href: "/dashboard/warehouse", label: "3. Thủ kho (Warehouse)", icon: Warehouse },
  { href: "/dashboard/distributor", label: "4. Vận chuyển (Distributor)", icon: Truck },
  { href: "/dashboard/customer", label: "5. Khách hàng (Customer)", icon: User },
  { href: "/dashboard/users", label: "Quản lý Tài khoản", icon: Users, adminOnly: true },
  { href: "/dashboard/projects", label: "Dự án Nông sản", icon: FolderOpen },
];

const roleLabelMap: Record<string, string> = {
  ADMIN: "Quản trị viên",
  FARMER: "Nông dân",
  WAREHOUSE_STAFF: "Nhân viên kho",
  DISTRIBUTOR: "Nhà phân phối",
  CUSTOMER: "Khách hàng",
};

const roleColorMap: Record<string, string> = {
  ADMIN: "#dc3545",
  FARMER: "#1a7a3a",
  WAREHOUSE_STAFF: "#0d6efd",
  DISTRIBUTOR: "#f59e0b",
  CUSTOMER: "#8b5cf6",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, hasHydrated, clearSession, refreshToken } = useAuthStore();
  const isAdmin = user?.roles.includes("ADMIN");

  useEffect(() => {
    if (hasHydrated && !user) router.replace("/login");
  }, [hasHydrated, router, user]);

  if (!hasHydrated || !user)
    return (
      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
        <LoadingSkeleton rows={6} />
      </main>
    );

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
  const roleColor = roleColorMap[primaryRole] ?? "#1a7a3a";
  const roleLabel = roleLabelMap[primaryRole] ?? primaryRole;

  return (
    <div style={{ minHeight: "100vh", display: "flex", background: "#f8f9fa", fontFamily: "'Be Vietnam Pro', sans-serif" }}>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <button
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 30,
            background: "rgba(0,0,0,0.3)", border: "none", cursor: "pointer",
          }}
          className="lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          position: "fixed",
          top: 0, left: 0, bottom: 0,
          width: 256,
          background: "#fff",
          borderRight: "1px solid #eee",
          display: "flex",
          flexDirection: "column",
          zIndex: 40,
          transition: "transform 0.25s",
          transform: sidebarOpen ? "translateX(0)" : undefined,
        }}
        className={sidebarOpen ? "" : "hidden lg:flex"}
      >
        {/* Logo */}
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #f0f0f0" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: "#1a7a3a", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Leaf size={15} color="#fff" />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#1a1a1a" }}>
              AgriTrace <span style={{ color: "#1a7a3a" }}>AI</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ padding: "16px 12px", flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#bbb", textTransform: "uppercase", letterSpacing: 1, padding: "0 8px", marginBottom: 8 }}>
            Menu chính
          </p>
          {navigation
            .filter((item) => !item.adminOnly || isAdmin)
            .map((item) => {
              const active = pathname === item.href;
              const IconComp = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? "#1a7a3a" : "#555",
                    background: active ? "#e8f5e9" : "transparent",
                    marginBottom: 2,
                    transition: "all 0.15s",
                  }}
                >
                  <IconComp size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* User section */}
        <div style={{ padding: "16px", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: roleColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}
            >
              {initials(user.name)}
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user.name}
              </p>
              <p style={{ fontSize: 11, color: roleColor, fontWeight: 500 }}>{roleLabel}</p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: "100%", padding: "8px 12px", borderRadius: 8,
              border: "1px solid #eee", background: "#fff",
              fontSize: 13, color: "#555", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#fff5f5"; e.currentTarget.style.color = "#dc3545"; e.currentTarget.style.borderColor = "#fecaca"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#555"; e.currentTarget.style.borderColor = "#eee"; }}
          >
            <LogOut size={14} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }} className="lg:pl-64">
        {/* Top header */}
        <header
          style={{
            position: "sticky", top: 0, zIndex: 20,
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #eee",
            height: 60,
            display: "flex", alignItems: "center",
            padding: "0 24px", gap: 12,
          }}
        >
          {/* Mobile menu button */}
          <button
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", padding: 4 }}
          >
            ☰
          </button>

          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#f0f7f0", color: "#1a7a3a",
                padding: "4px 12px", borderRadius: 20,
                fontSize: 12, fontWeight: 600,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6, height: 6, borderRadius: "50%",
                  background: roleColor,
                }}
              />
              {roleLabel}
            </span>
          </div>

          <Link
            href="/"
            style={{
              fontSize: 12, color: "#888",
              display: "flex", alignItems: "center", gap: 4,
            }}
          >
            ← Về trang chủ
          </Link>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: "24px" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
