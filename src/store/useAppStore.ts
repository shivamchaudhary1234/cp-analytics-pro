import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, Goal, Streak } from '../types';

interface AppState {
  // Sidebar
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Profile cache
  profile: Profile | null;
  setProfile: (profile: Profile | null) => void;

  // Goal
  goal: Goal | null;
  setGoal: (goal: Goal | null) => void;

  // Streak
  streak: Streak | null;
  setStreak: (streak: Streak | null) => void;

  // CF Handle (quick access)
  cfHandle: string;
  setCfHandle: (handle: string) => void;

  // Notifications
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;

  // Theme (always dark for now)
  theme: 'dark';
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

      profile: null,
      setProfile: (profile) => set({ profile }),

      goal: null,
      setGoal: (goal) => set({ goal }),

      streak: null,
      setStreak: (streak) => set({ streak }),

      cfHandle: '',
      setCfHandle: (handle) => set({ cfHandle: handle }),

      notificationsEnabled: false,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),

      theme: 'dark',
    }),
    {
      name: 'cp-analytics-store',
      partialize: (state) => ({
        cfHandle: state.cfHandle,
        notificationsEnabled: state.notificationsEnabled,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
