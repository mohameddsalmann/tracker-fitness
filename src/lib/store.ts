import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@/lib/types";

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  setSession: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setSession: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: "fitpulse-auth" },
  ),
);

interface UIState {
  sidebarCollapsed: boolean;
  commandOpen: boolean;
  waterGlasses: number;
  waterDate: string;
  toggleSidebar: () => void;
  setCommandOpen: (v: boolean) => void;
  setWaterGlasses: (count: number) => void;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      commandOpen: false,
      waterGlasses: 0,
      waterDate: todayKey(),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandOpen: (v) => set({ commandOpen: v }),
      setWaterGlasses: (count) => {
        const today = todayKey();
        const state = get();
        if (state.waterDate !== today) {
          set({ waterDate: today, waterGlasses: count });
        } else {
          set({ waterGlasses: count });
        }
      },
    }),
    {
      name: "fitpulse-ui",
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        waterGlasses: s.waterGlasses,
        waterDate: s.waterDate,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.waterDate !== todayKey()) {
          state.waterGlasses = 0;
          state.waterDate = todayKey();
        }
      },
    },
  ),
);
