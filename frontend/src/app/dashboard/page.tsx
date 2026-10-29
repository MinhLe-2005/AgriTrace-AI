"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { LoadingSkeleton } from "@/components/ui/states";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { user, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;
    if (!user) {
      router.replace("/login");
      return;
    }

    const roles = user.roles || [];
    if (roles.includes("ADMIN")) {
      router.replace("/dashboard/admin");
    } else if (roles.includes("FARMER")) {
      router.replace("/dashboard/farmer");
    } else if (roles.includes("WAREHOUSE") || roles.includes("WAREHOUSE_STAFF")) {
      router.replace("/dashboard/warehouse");
    } else if (roles.includes("DISTRIBUTOR")) {
      router.replace("/dashboard/distributor");
    } else {
      // Customer / User bình thường -> về Trang chủ
      router.replace("/");
    }
  }, [hasHydrated, user, router]);

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <LoadingSkeleton rows={4} />
      <p className="text-xs text-gray-400 mt-4">Đang chuyển đến khu vực quản lý phù hợp với vai trò của bạn...</p>
    </div>
  );
}
