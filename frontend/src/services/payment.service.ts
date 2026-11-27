import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export type PaymentLinkResponse = {
  orderCode: string;
  amount: number;
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
  status: string;
  accountNumber: string;
  accountName: string;
  bankName: string;
  bin: string;
  description: string;
};

type ApiPayload<T> = ApiResponse<T> | T;

function payload<T>(value: ApiPayload<T>): T {
  return unpack(value);
}

export const paymentService = {
  async createPayOSPaymentLink(orderCode: string, returnUrl?: string, cancelUrl?: string): Promise<PaymentLinkResponse> {
    const { data } = await api.post<ApiPayload<PaymentLinkResponse>>("/payment/payos/create-payment-link", {
      orderCode,
      returnUrl,
      cancelUrl,
    });
    return payload(data);
  },

  async simulatePaymentSuccess(orderCode: string): Promise<unknown> {
    const { data } = await api.post<ApiPayload<unknown>>(`/payment/payos/simulate-success/${encodeURIComponent(orderCode)}`);
    return payload(data);
  },

  async checkPaymentStatus(orderCode: string): Promise<{ orderCode: string; status: string }> {
    const { data } = await api.get<ApiPayload<{ orderCode: string; status: string }>>(
      `/payment/payos/check-status/${encodeURIComponent(orderCode)}`
    );
    return payload(data);
  },
};
