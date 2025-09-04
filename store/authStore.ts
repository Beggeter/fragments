import { TelegramAuthData } from "@/types/user";
import { create } from "zustand";

interface AuthStore {
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  user: TelegramAuthData | null;
  setUser: (user: TelegramAuthData | null) => void;
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  user: null,
  setUser: (user) => set({ user }),
  isAdmin: false,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
}));
