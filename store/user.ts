import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface User {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  avatarUrl?: string;
  role: 'user' | 'admin' | 'tester' | 'premium';
  currency: number;
  createdAt: string;
  lastLoginAt: string;
  record: number; // Classic mode record
  zenRecord: number; // Zen mode record
  hasZenSubscription: boolean;
  zenSubscriptionEndDate?: string;
}

export interface AdminUser {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  role: 'admin';
  expiresAt: string;
}

interface UserState {
  // User data
  user: User | null;
  admin: AdminUser | null;
  
  // Auth state
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  
  // Session data
  sessionToken: string | null;
  adminToken: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setAdmin: (admin: AdminUser | null) => void;
  setSessionToken: (token: string | null) => void;
  setAdminToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setAdminStatus: (isAdmin: boolean) => void;
  
  // Utility methods
  getCurrentUser: () => User | AdminUser | null;
  isUserAuthenticated: () => boolean;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const initialState = {
  user: null,
  admin: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  sessionToken: null,
  adminToken: null,
};

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Basic setters
      setUser: (user) => set({ user }),
      setAdmin: (admin) => set({ admin }),
      setSessionToken: (token) => set({ sessionToken: token }),
      setAdminToken: (token) => set({ adminToken: token }),
      setLoading: (loading) => set({ isLoading: loading }),
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      setAdminStatus: (isAdmin) => set({ isAdmin }),

      // Utility methods
      getCurrentUser: () => {
        const { user, admin } = get();
        return admin || user;
      },

      isUserAuthenticated: () => {
        const { isAuthenticated, isAdmin } = get();
        return isAuthenticated || isAdmin;
      },

      clearAuth: () => {
        set({
          user: null,
          admin: null,
          isAuthenticated: false,
          isAdmin: false,
          sessionToken: null,
          adminToken: null,
          isLoading: false,
        });
      },

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: "user-store",
    }
  )
);
