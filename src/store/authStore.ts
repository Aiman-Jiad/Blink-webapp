import { create } from 'zustand';
import type { UserProfile } from '@/types';

interface AuthStore {
  user: UserProfile | null;
  loading: boolean;
  hydrated: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  setHydrated: (hydrated: boolean) => void;
  updateUser: (patch: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: true,
  hydrated: false,
  setUser: (user) => set({ user, loading: false, hydrated: true }),
  setLoading: (loading) => set({ loading }),
  setHydrated: (hydrated) => set({ hydrated }),
  updateUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : state)),
}));
