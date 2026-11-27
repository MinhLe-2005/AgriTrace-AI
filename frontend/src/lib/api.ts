import axios, { type AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { AuthTokens } from "@/types/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export const api = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
const refreshApi = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
let refreshRequest: Promise<AuthTokens> | null = null;

export interface ApiRequestConfig extends AxiosRequestConfig {
  skipErrorToast?: boolean;
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function messageFromError(error: AxiosError<ApiErrorResponse>) {
  const message = error.response?.data?.details?.[0] ?? error.response?.data?.message;
  if (message === "Reservation is expired or no longer active") {
    return "Lượt giữ hàng của phiếu đã hết hạn hoặc đã được giải phóng. Hãy hủy phiếu nháp cũ, giữ hàng lại cho đơn và lập phiếu xuất mới.";
  }
  if (message === "Insufficient eligible stock") {
    return "Không đủ hàng khả dụng còn hạn và đạt điều kiện để phân bổ. Hãy kiểm tra tồn kho và số lượng cần xuất.";
  }
  if (message === "Insufficient unreserved stock") {
    return "Tồn khả dụng đã thay đổi hoặc đang được giữ cho đơn khác. Hãy tải lại tồn kho và kiểm tra số lượng trước khi xuất.";
  }
  return message ?? "Có lỗi xảy ra. Vui lòng thử lại.";
}

function signOut() {
  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined") {
    const isProtectedRoute = window.location.pathname.startsWith("/dashboard");
    if (isProtectedRoute && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean; skipErrorToast?: boolean }) | undefined;
    const status = error.response?.status;
    const isRefresh = request?.url?.includes("/auth/refresh-token");

    if (status === 401 && request && !request._retry && !isRefresh) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        signOut();
        return Promise.reject(error);
      }
      request._retry = true;
      try {
        refreshRequest ??= refreshApi.post<ApiResponse<AuthTokens>>("/auth/refresh-token", { refreshToken }).then((response) => {
          const payload = response.data.data ?? (response.data as unknown as AuthTokens);
          return { accessToken: payload.accessToken, refreshToken: payload.refreshToken };
        });
        const tokens = await refreshRequest;
        useAuthStore.getState().setSession(tokens);
        request.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return api(request);
      } catch (refreshError) {
        signOut();
        return Promise.reject(refreshError);
      } finally {
        refreshRequest = null;
      }
    }

    if (typeof window !== "undefined" && !request?.skipErrorToast) {
      const reqUrl = request?.url ?? "";
      const isBackgroundGet =
        request?.method?.toLowerCase() === "get" &&
        (reqUrl.includes("/loyalty/me") ||
          reqUrl.includes("/orders") ||
          reqUrl.includes("/users/me") ||
          reqUrl.includes("/verifications"));
      if (!isBackgroundGet) {
        if (status === 403) toast.error("Bạn không có quyền thực hiện thao tác này.");
        else if (status && status >= 400 && status !== 401 && status !== 404) toast.error(messageFromError(error));
      }
    }
    return Promise.reject(error);
  }
);

export function unpack<T>(response: ApiResponse<T> | T) {
  return (response as ApiResponse<T>).data ?? (response as T);
}

export function getApiErrorMessage(error: unknown) {
  return axios.isAxiosError<ApiErrorResponse>(error) ? messageFromError(error) : "Có lỗi xảy ra. Vui lòng thử lại.";
}
