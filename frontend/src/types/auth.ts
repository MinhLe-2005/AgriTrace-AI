import type { User } from "@/types/user";

export interface LoginInput { email: string; password: string; }
export interface RegisterInput { name: string; email: string; password: string; confirmPassword: string; }
export interface AuthTokens { accessToken: string; refreshToken: string; }
export interface AuthPayload extends AuthTokens { user: User; }
