"use client";

import { PageHeader } from "@/components/ui/page-header";
import { PermissionDenied } from "@/components/ui/states";
import { UserManager } from "@/features/users/user-manager";
import { useAuthStore } from "@/stores/auth-store";

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);
  if (!user?.roles.includes("ADMIN")) return <PermissionDenied />;
  return <div className="space-y-7"><PageHeader title="Users" description="Manage people and their workspace permissions." /><UserManager /></div>;
}
