import { create } from 'zustand';

interface SessionState {
  sessionExpiresAt: number | null;
  isSessionWarningOpen: boolean;
  remainingSeconds: number;

  startSession: () => void;
  extendSession: () => void;
  endSession: () => void;
  updateRemainingTime: () => void;
  openSessionWarning: () => void;
  closeSessionWarning: () => void;
}

const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

export const useSessionStore = create<SessionState>((set, get) => ({
  sessionExpiresAt: null,
  isSessionWarningOpen: false,
  remainingSeconds: 0,

  startSession: () => {
    const expiresAt = Date.now() + SESSION_DURATION;
    set({ sessionExpiresAt: expiresAt, isSessionWarningOpen: false });
  },

  extendSession: () => {
    const expiresAt = Date.now() + SESSION_DURATION;
    set({ sessionExpiresAt: expiresAt, isSessionWarningOpen: false });
  },

  endSession: () => {
    set({
      sessionExpiresAt: null,
      isSessionWarningOpen: false,
      remainingSeconds: 0,
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
}));
