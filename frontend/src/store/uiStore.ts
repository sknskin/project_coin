import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UIState {
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  isUpbitConnectModalOpen: boolean;
  theme: Theme;

  openAuthModal: (mode: 'login' | 'register') => void;
  closeAuthModal: () => void;
  openUpbitConnectModal: () => void;
  closeUpbitConnectModal: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      isAuthModalOpen: false,
      authModalMode: 'login',
      isUpbitConnectModalOpen: false,
      theme: 'light',

      openAuthModal: (mode) =>
        set({ isAuthModalOpen: true, authModalMode: mode }),

      closeAuthModal: () => set({ isAuthModalOpen: false }),

      openUpbitConnectModal: () => set({ isUpbitConnectModalOpen: true }),

      closeUpbitConnectModal: () => set({ isUpbitConnectModalOpen: false }),

      setTheme: (theme) => {
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ theme });
      },

      toggleTheme: () => {
        const newTheme = get().theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      },
    },
  ),
);
