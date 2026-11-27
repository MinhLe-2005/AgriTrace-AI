import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { AuthTokens } from "@/types/auth";
import type { User } from "@/types/user";

interface AuthState extends Partial<AuthTokens> {
  user: User | null;
  hasHydrated: boolean;
  setSession: (session: AuthTokens & { user?: User | null }) => void;
  clearSession: () => void;
  setHasHydrated: (value: boolean) => void;
}

const memoryStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: undefined,
      refreshToken: undefined,
      user: null,
      hasHydrated: false,
      setSession: ({ accessToken, refreshToken, user }) => set((state) => ({ accessToken, refreshToken, user: user ?? state.user })),
      clearSession: () => set({ accessToken: undefined, refreshToken: undefined, user: null }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated })
    }),
    {
      name: "my-fullstack-auth",
      storage: createJSONStorage(() => (typeof window === "undefined" ? memoryStorage : localStorage)),
      partialize: ({ accessToken, refreshToken, user }) => ({ accessToken, refreshToken, user }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true)
    }
  )
);
