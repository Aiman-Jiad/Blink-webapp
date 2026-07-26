import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_SETTINGS, type AppSettings, type ThemeMode } from '@/types';

interface SettingsStore extends AppSettings {
  set: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  reset: () => void;
  setTheme: (theme: ThemeMode) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,
      set: (key, value) => set({ [key]: value } as Partial<SettingsStore>),
      reset: () => set({ ...DEFAULT_SETTINGS }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'blink:settings',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
