import { api } from "@/lib/api";
import type { ApiOrder } from "./catalog.service";

export type ChatChannel = "SHOP" | "ADMIN";
export type ChatViewerRole = "CUSTOMER" | "FARMER" | "ADMIN";

function normalizeOrderCode(orderCode: string): string {
  return orderCode.replace(/^#/, "").trim().toUpperCase();
}

export type OrderMessage = {
  id: number;
  orderCode: string;
  farmName?: string;
  senderRole: "CUSTOMER" | "FARMER" | "ADMIN";
  senderName: string;
  senderEmail?: string;
  message: string;
  imageUrl?: string;
  channel?: ChatChannel;
  messageType:
    | "CHAT"
    | "DISPUTE_SUBMITTED"
    | "DISPUTE_APPROVED"
    | "DISPUTE_REJECTED"
    | "VOUCHER_OFFERED"
    | "SUPPORT_ESCALATED";
  createdAt: string;
  isRead: boolean;
};

export type ConversationSummary = {
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  farmName: string;
  productSummary: string;
  total: number;
  orderStatus: string;
  refundStatus?: "PENDING" | "APPROVED" | "REJECTED" | null;
  refundReason?: string | null;
  lastMessage: string;
  lastMessageTime: string;
  messageCount: number;
  hasPendingDispute: boolean;
  adminSupportRequested?: boolean;
  adminSupportRequestedAt?: string | null;
  unreadCount?: number;
};

export type SendMessagePayload = {
  senderRole?: "CUSTOMER" | "FARMER" | "ADMIN";
  senderName?: string;
  senderEmail?: string;
  message: string;
  imageUrl?: string;
  channel?: ChatChannel;
  messageType?: string;
};

export type CreateDisputePayload = {
  reason: string;
  solution?: "REFUND_MONEY" | "REPLACE_GOODS" | "VOUCHER";
  amount?: number;
  photoUrl?: string;
  note?: string;
};

export type ResolveDisputePayload = {
  action: "APPROVE" | "REJECT";
  note?: string;
  refundAmount?: number;
};

export const orderChatService = {
  async getMessages(
    orderCode: string,
    params?: { channel?: ChatChannel; viewerRole?: ChatViewerRole }
  ): Promise<OrderMessage[]> {
    try {
      const cleanCode = normalizeOrderCode(orderCode);
      const res = await api.get(`/orders/${encodeURIComponent(cleanCode)}/messages`, { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  async sendMessage(orderCode: string, payload: SendMessagePayload): Promise<OrderMessage> {
    const cleanCode = normalizeOrderCode(orderCode);
    const res = await api.post(`/orders/${encodeURIComponent(cleanCode)}/messages`, payload);
    return res.data?.data || res.data;
  },

  async escalateToAdmin(
    orderCode: string,
    payload?: { reason?: string; customerName?: string; customerEmail?: string }
  ): Promise<{ order: ApiOrder; message: OrderMessage | null }> {
    const cleanCode = normalizeOrderCode(orderCode);
    const res = await api.post(`/orders/${encodeURIComponent(cleanCode)}/support-escalate`, payload || {});
    return res.data?.data || res.data;
  },

  async createDispute(orderCode: string, payload: CreateDisputePayload): Promise<ApiOrder> {
    const cleanCode = normalizeOrderCode(orderCode);
    const res = await api.post(`/orders/${encodeURIComponent(cleanCode)}/dispute`, payload);
    return res.data?.data || res.data;
  },

  async resolveDispute(orderCode: string, payload: ResolveDisputePayload): Promise<ApiOrder> {
    const cleanCode = normalizeOrderCode(orderCode);
    const res = await api.patch(`/orders/${encodeURIComponent(cleanCode)}/dispute/resolve`, payload);
    return res.data?.data || res.data;
  },

  async getInbox(params?: {
    farmName?: string;
    farmNames?: string;
    ownerId?: string;
    customerEmail?: string;
    status?: string;
    viewerRole?: ChatViewerRole;
    channel?: ChatChannel;
  }): Promise<ConversationSummary[]> {
    try {
      const res = await api.get("/orders/messages/inbox", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  async markAsRead(
    orderCode: string,
    options?: { channel?: ChatChannel; viewerRole?: ChatViewerRole } | ChatViewerRole
  ): Promise<void> {
    try {
      const cleanCode = normalizeOrderCode(orderCode);
      const params = typeof options === "string" ? { viewerRole: options } : options;
      await api.patch(`/orders/${encodeURIComponent(cleanCode)}/messages/read`, null, { params });
    } catch {
      // ignore
    }
  },
};
