import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";

export type ApiReview = {
  id: number;
  orderCode: string;
  productName: string;
  userEmail: string;
  userName: string;
  rating: number;
  comment?: string;
  likesCount?: number;
  reply?: string;
  replyAuthor?: string;
  repliedAt?: string;
  createdAt: string;
};

type ApiPayload<T> = ApiResponse<T> | T;

function payload<T>(value: ApiPayload<T>): T {
  return unpack(value);
}

export const reviewService = {
  async getProductReviews(productName: string): Promise<ApiReview[]> {
    const { data } = await api.get<ApiPayload<ApiReview[]>>(`/reviews/product/${encodeURIComponent(productName)}`);
    return payload(data);
  },

  async getAllReviews(): Promise<ApiReview[]> {
    const { data } = await api.get<ApiPayload<ApiReview[]>>("/reviews/all");
    return payload(data);
  },

  async getOrderReviews(orderCode: string): Promise<ApiReview[]> {
    const { data } = await api.get<ApiPayload<ApiReview[]>>(`/reviews/order/${encodeURIComponent(orderCode)}`);
    return payload(data);
  },

  async createReview(input: {
    orderCode: string;
    productName: string;
    rating: number;
    comment?: string;
  }): Promise<ApiReview> {
    const { data } = await api.post<ApiPayload<ApiReview>>("/reviews", input);
    return payload(data);
  },

  async likeReview(id: number): Promise<ApiReview> {
    const { data } = await api.post<ApiPayload<ApiReview>>(`/reviews/${id}/like`);
    return payload(data);
  },

  async unlikeReview(id: number): Promise<ApiReview> {
    const { data } = await api.post<ApiPayload<ApiReview>>(`/reviews/${id}/unlike`);
    return payload(data);
  },

  async replyReview(id: number, reply: string, replyAuthor?: string): Promise<ApiReview> {
    const { data } = await api.post<ApiPayload<ApiReview>>(`/reviews/${id}/reply`, { reply, replyAuthor });
    return payload(data);
  },

  async deleteReview(id: number): Promise<void> {
    await api.delete(`/reviews/${id}`);
  },
};
