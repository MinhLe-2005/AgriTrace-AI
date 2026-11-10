import { api } from "@/lib/api";
import type { ApiVoucher } from "./catalog.service";

export type LoyaltyTransaction = {
  id: string;
  points: number;
  transactionType: "EARNED" | "REDEEMED" | "BONUS";
  description: string;
  createdAt: string;
};

export type LoyaltyProfile = {
  membershipId: string;
  userId: string;
  userEmail: string;
  fullName: string;
  phone: string;
  currentPoints: number;
  lifetimePoints: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND" | string;
  totalSpent: number;
  nextTier: string;
  nextTierThreshold: number;
  progressPercent: number;
  pointsMultiplier: number;
  recentTransactions: LoyaltyTransaction[];
};

export type LoyaltyMemberAdmin = {
  id: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
  };
  currentPoints: number;
  lifetimePoints: number;
  tier: string;
  totalSpent: number;
  updatedAt: string;
};

export const loyaltyService = {
  async getLoyaltyMe(email?: string): Promise<LoyaltyProfile | null> {
    try {
      const url = email ? `/api/v1/loyalty/me?email=${encodeURIComponent(email)}` : `/api/v1/loyalty/me`;
      const res = await api.get<{ success: boolean; data: LoyaltyProfile }>(url);
      return res.data?.data || null;
    } catch (err) {
      console.error("Failed to load loyalty profile:", err);
      return null;
    }
  },

  async redeemVoucher(
    pointsCost: number,
    voucherType: string,
    title: string,
    userEmail?: string
  ): Promise<ApiVoucher> {
    const res = await api.post<{ success: boolean; message: string; data: ApiVoucher }>(
      "/api/v1/loyalty/redeem",
      {
        pointsCost,
        voucherType,
        title,
        userEmail,
      }
    );
    return res.data.data;
  },

  async getAdminMembers(): Promise<LoyaltyMemberAdmin[]> {
    try {
      const res = await api.get<{ success: boolean; data: LoyaltyMemberAdmin[] }>("/api/v1/loyalty/admin/members");
      return res.data?.data || [];
    } catch (err) {
      console.error("Failed to get admin members:", err);
      return [];
    }
  },

  async adminAddBonus(userId: string, points: number, reason: string): Promise<boolean> {
    const res = await api.post<{ success: boolean }>("/api/v1/loyalty/admin/bonus", {
      userId,
      points,
      reason,
    });
    return res.data?.success || false;
  },

  async adminGetAllVouchers(): Promise<ApiVoucher[]> {
    try {
      const res = await api.get<ApiVoucher[]>("/api/v1/vouchers/all");
      return res.data || [];
    } catch (err) {
      console.error("Failed to get all vouchers:", err);
      return [];
    }
  },

  async adminCreateVoucher(voucher: Partial<ApiVoucher>): Promise<ApiVoucher> {
    const res = await api.post<ApiVoucher>("/api/v1/vouchers", voucher);
    return res.data;
  },

  async adminToggleVoucher(id: number): Promise<ApiVoucher> {
    const res = await api.patch<ApiVoucher>(`/api/v1/vouchers/${id}/toggle`, {});
    return res.data;
  },

  async adminDeleteVoucher(id: number): Promise<boolean> {
    const res = await api.delete<{ success: boolean }>(`/api/v1/vouchers/${id}`);
    return res.data?.success || false;
  },

  async adminUpdateOrderStatus(orderCode: string, status: string): Promise<boolean> {
    const res = await api.patch<{ success: boolean }>(`/api/v1/orders/${orderCode}/status`, { status });
    return res.data?.success || false;
  },
};
