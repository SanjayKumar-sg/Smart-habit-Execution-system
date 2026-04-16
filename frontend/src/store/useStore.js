import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: user => set({ user, isAuthenticated: !!user }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false, role: 'patient', ageGroup: 'adult', profilePhoto: null });
      },

      // Role-based access
      role: 'patient', // 'patient' | 'doctor' | 'admin'
      setRole: role => set({ role }),

      // Age group set during registration
      ageGroup: 'adult', // 'child' | 'adult' | 'senior'
      setAgeGroup: ageGroup => set({ ageGroup }),

      // Profile photo (base64 string)
      profilePhoto: null,
      setProfilePhoto: profilePhoto => set({ profilePhoto }),

      // Medical record cache for AI
      medicalRecord: null,
      setMedicalRecord: medicalRecord => set({ medicalRecord }),

      // Theme
      theme: 'dark',
      toggleTheme: () => set(s => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),

      // Language: 'en' | 'ta'
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
    {
      name: 'smart-habit-store',
      partialState: ['theme', 'language', 'sidebarOpen', 'ageGroup', 'role', 'profilePhoto'],
    }
  )
);
