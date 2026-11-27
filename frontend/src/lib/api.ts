import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/stores/auth-store";
import { toast } from "@/stores/toast-store";
import type { ApiErrorResponse, ApiResponse } from "@/types/api";
import type { AuthTokens } from "@/types/auth";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1";

export const api = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
const refreshApi = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
let refreshRequest: Promise<AuthTokens> | null = null;

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function messageFromError(error: AxiosError<ApiErrorResponse>) {
  return error.response?.data?.message ?? "Something went wrong. Please try again.";
}

function signOut() {
  useAuthStore.getState().clearSession();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") window.location.assign("/login");
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
      if (status === 403) toast.error("You do not have permission to do that.");
      else if (status && status >= 400 && status !== 401) toast.error(messageFromError(error));
    }
    return Promise.reject(error);
  }
);

export function unpack<T>(response: ApiResponse<T> | T) {
  return (response as ApiResponse<T>).data ?? (response as T);
}

export function getApiErrorMessage(error: unknown) {
  return axios.isAxiosError<ApiErrorResponse>(error) ? messageFromError(error) : "Something went wrong. Please try again.";
}
