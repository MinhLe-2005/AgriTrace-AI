import { api } from "@/lib/api";
import type { ApiOrder } from "./catalog.service";

export type OrderMessage = {
  id: number;
  orderCode: string;
  farmName?: string;
  senderRole: "CUSTOMER" | "FARMER" | "ADMIN";
  senderName: string;
  senderEmail?: string;
  message: string;
  imageUrl?: string;
  messageType: "CHAT" | "DISPUTE_SUBMITTED" | "DISPUTE_APPROVED" | "DISPUTE_REJECTED" | "VOUCHER_OFFERED";
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
};

export type SendMessagePayload = {
  senderRole?: "CUSTOMER" | "FARMER" | "ADMIN";
  senderName?: string;
  senderEmail?: string;
  message: string;
  imageUrl?: string;
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
  async getMessages(orderCode: string): Promise<OrderMessage[]> {
    try {
      const res = await api.get(`/orders/${encodeURIComponent(orderCode)}/messages`);
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },

  async sendMessage(orderCode: string, payload: SendMessagePayload): Promise<OrderMessage> {
    const res = await api.post(`/orders/${encodeURIComponent(orderCode)}/messages`, payload);
    return res.data?.data || res.data;
  },

  async createDispute(orderCode: string, payload: CreateDisputePayload): Promise<ApiOrder> {
    const res = await api.post(`/orders/${encodeURIComponent(orderCode)}/dispute`, payload);
    return res.data?.data || res.data;
  },

  async resolveDispute(orderCode: string, payload: ResolveDisputePayload): Promise<ApiOrder> {
    const res = await api.patch(`/orders/${encodeURIComponent(orderCode)}/dispute/resolve`, payload);
    return res.data?.data || res.data;
  },

  async getInbox(params?: { farmName?: string; status?: string }): Promise<ConversationSummary[]> {
    try {
      const res = await api.get("/orders/messages/inbox", { params });
      return res.data?.data || res.data || [];
    } catch {
      return [];
    }
  },
};
