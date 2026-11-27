import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { AuthTokens } from "@/types/auth";

function resolveBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host && host !== "localhost" && host !== "127.0.0.1") {
      // Nếu truy cập qua Public HTTPS Tunnel (4G/Wi-Fi ngoài) như *.lhr.life hoặc *.trycloudflare.com,
      // gọi qua Next.js rewrite proxy (/api/v1) cùng domain để không cần mở tunnel thứ 2 cho port 8080.
      if (!host.startsWith("192.168.") && !host.startsWith("10.") && !host.startsWith("172.")) {
        return "/api/v1";
      }
      return `${window.location.protocol}//${host}:8080/api/v1`;
    }
  }
  return "http://localhost:8080/api/v1";
}

const baseURL = resolveBaseUrl();

export const api = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
const refreshApi = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
let refreshRequest: Promise<AuthTokens> | null = null;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function messageFromError(error: AxiosError<ApiErrorResponse>) {
  if (error.response?.data?.details && error.response.data.details.length > 0) {
    return error.response.data.details[0];
  }
  return error.response?.data?.message ?? "Có lỗi xảy ra. Vui lòng thử lại.";
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
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
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

    if (typeof window !== "undefined") {
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
