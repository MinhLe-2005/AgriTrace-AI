import { api, unpack } from "@/lib/api";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, LoginInput, RegisterInput } from "@/types/auth";
import type { User } from "@/types/user";

type BackendUser = Omit<User, "name"> & { fullName?: string; name?: string };
type BackendAuthPayload = Omit<AuthPayload, "user"> & { user: BackendUser };

function normalizeAuth(payload: BackendAuthPayload): AuthPayload {
  return { ...payload, user: { ...payload.user, name: payload.user.name ?? payload.user.fullName ?? payload.user.email } };
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
  }
};
