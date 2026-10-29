import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, LoginInput, RegisterInput } from "@/types/auth";
import type { User } from "@/types/user";

type BackendUser = Omit<User, "name"> & { fullName?: string; name?: string };
type BackendAuthPayload = Omit<AuthPayload, "user"> & { user: BackendUser };

function normalizeUser(user: BackendUser): User {
  return { ...user, name: user.name ?? user.fullName ?? user.email };
}

function normalizeAuth(payload: BackendAuthPayload): AuthPayload {
  return { ...payload, user: normalizeUser(payload.user) };
}

export const authService = {
  async login(input: LoginInput) {
    const { data } = await api.post<ApiResponse<BackendAuthPayload>>("/auth/login", input);
    return normalizeAuth(unpack(data));
  },
  async register(input: RegisterInput) {
    const { confirmPassword: _confirmPassword, name, ...payload } = input;
    const { data } = await api.post<ApiResponse<BackendAuthPayload>>("/auth/register", { ...payload, fullName: name });
    return normalizeAuth(unpack(data));
  },
  async logout(refreshToken?: string) {
    const { data } = await api.post<ApiResponse<void>>("/auth/logout", { refreshToken });
    return unpack(data);
  },
  async sendOtp(email: string) {
    const { data } = await api.post<ApiResponse<string>>("/auth/send-otp", { email });
    return unpack(data);
  },
  async verifyOtp(email: string, otp: string) {
    const { data } = await api.post<ApiResponse<boolean>>("/auth/verify-otp", { email, otp });
    return unpack(data);
  },
  async forgotPassword(email: string) {
    const { data } = await api.post<ApiResponse<string>>("/auth/forgot-password", { email });
    return unpack(data);
  },
  async resetPassword(payload: { email: string; otp: string; newPassword: string }) {
    const { data } = await api.post<ApiResponse<void>>("/auth/reset-password", payload);
    return unpack(data);
  },
  async changePassword(payload: { email: string; currentPassword: string; newPassword: string }) {
    const { data } = await api.post<ApiResponse<void>>("/auth/change-password", payload);
    return unpack(data);
  },
  async updateProfile(payload: { fullName: string; phone?: string; companyName?: string; address?: string }) {
    const { data } = await api.patch<ApiResponse<BackendUser>>("/auth/profile", payload);
    return normalizeUser(unpack(data));
  }
};
