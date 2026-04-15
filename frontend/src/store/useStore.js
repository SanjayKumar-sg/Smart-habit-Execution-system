import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: user => set({ user, isAuthenticated: !!user }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      // Theme
      theme: 'dark',
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // Language
      language: 'en',
      setLanguage: language => set({ language }),

      // Sidebar
      sidebarOpen: true,
      toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),

      // Dashboard data
      dashboardData: null,
      setDashboardData: dashboardData => set({ dashboardData }),

      // Notifications
      nudges: [],
      setNudges: nudges => set({ nudges }),
    }),
    { name: 'smart-habit-store', partialState: ['theme', 'language', 'sidebarOpen'] }
  )
);
