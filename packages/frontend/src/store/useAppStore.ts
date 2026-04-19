import { create } from 'zustand';
import type { Product, Customer } from '@dukkan/shared';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  isOnline: boolean;
  syncPending: number;
  products: Product[];
  toast: Toast | null;

  setOnline: (v: boolean) => void;
  setSyncPending: (n: number) => void;
  setProducts: (p: Product[]) => void;
  showToast: (message: string, type?: Toast['type']) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnline: navigator.onLine,
  syncPending: 0,
  products: [],
  toast: null,

  setOnline: (v) => set({ isOnline: v }),
  setSyncPending: (n) => set({ syncPending: n }),
  setProducts: (p) => set({ products: p }),
  showToast: (message, type = 'success') =>
    set({ toast: { id: Date.now().toString(), message, type } }),
  clearToast: () => set({ toast: null }),
}));
