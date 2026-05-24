import { create } from "zustand";
import { storeTokens, clearTokens } from "@/lib/auth";

interface AuthState {
  userId: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;

  setTokens: (userId: string, accessToken: string, refreshToken: string) => Promise<void>;
  setAccessToken: (accessToken: string) => void;
  logout: () => Promise<void>;
  hydrate: (userId: string, accessToken: string) => void;
  markHydrated: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: null,
  accessToken: null,
  isAuthenticated: false,
  isHydrated: false,

  setTokens: async (userId, accessToken, refreshToken) => {
    await storeTokens(accessToken, refreshToken, userId);
    set({ userId, accessToken, isAuthenticated: true, isHydrated: true });
  },

  setAccessToken: (accessToken) => set({ accessToken }),

  logout: async () => {
    await clearTokens();
    set({ userId: null, accessToken: null, isAuthenticated: false });
  },

  hydrate: (userId, accessToken) => {
    set({ userId, accessToken, isAuthenticated: true, isHydrated: true });
  },

  markHydrated: () => set({ isHydrated: true }),
}));
