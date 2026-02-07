import { create } from 'zustand';
import { getTokenExpiration } from '../utils/jwt';

interface SessionState {
  sessionExpiresAt: number | null;
  isSessionWarningOpen: boolean;
  remainingSeconds: number;
  lastWarningThreshold: number | null;

  startSession: (accessToken: string) => void;
  extendSession: (accessToken: string) => void;
  endSession: () => void;
  updateRemainingTime: () => void;
  openSessionWarning: () => void;
  closeSessionWarning: () => void;
  setLastWarningThreshold: (threshold: number | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionExpiresAt: null,
  isSessionWarningOpen: false,
  remainingSeconds: 0,
  lastWarningThreshold: null,

  startSession: (accessToken: string) => {
    const expiresAt = getTokenExpiration(accessToken);
    if (expiresAt) {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      set({
        sessionExpiresAt: expiresAt,
        remainingSeconds: remaining,
        isSessionWarningOpen: false,
        lastWarningThreshold: null,
      });
    }
  },

  extendSession: (accessToken: string) => {
    const expiresAt = getTokenExpiration(accessToken);
    if (expiresAt) {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      set({
        sessionExpiresAt: expiresAt,
        remainingSeconds: remaining,
        isSessionWarningOpen: false,
        lastWarningThreshold: null,
      });
    }
  },

  endSession: () => {
    set({
      sessionExpiresAt: null,
      isSessionWarningOpen: false,
      remainingSeconds: 0,
      lastWarningThreshold: null,
    });
  },

  updateRemainingTime: () => {
    const { sessionExpiresAt } = get();
    if (!sessionExpiresAt) return;

    const remaining = Math.max(0, Math.floor((sessionExpiresAt - Date.now()) / 1000));
    set({ remainingSeconds: remaining });
  },

  openSessionWarning: () => set({ isSessionWarningOpen: true }),
  closeSessionWarning: () => set({ isSessionWarningOpen: false }),
  setLastWarningThreshold: (threshold) => set({ lastWarningThreshold: threshold }),
}));
