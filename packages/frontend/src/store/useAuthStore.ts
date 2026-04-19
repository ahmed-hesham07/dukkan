import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@dukkan/shared';

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: (token, user) => set({ token, user }),

      logout: () => {
        set({ token: null, user: null });
        // IndexedDB clearing is handled by the component calling clearTenantData before logout
      },

      isAuthenticated: () => {
        const { token } = get();
        if (!token) return false;
        try {
          // Check token expiry by decoding the JWT payload (no signature verification needed client-side)
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'dukkan-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
