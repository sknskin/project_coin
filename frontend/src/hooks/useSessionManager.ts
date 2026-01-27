import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useAuth } from './useAuth';

const WARNING_THRESHOLDS = [10 * 60, 5 * 60, 1 * 60]; // 10min, 5min, 1min (seconds)

export function useSessionManager() {
  const { isAuthenticated } = useAuthStore();
  const {
    sessionExpiresAt,
    remainingSeconds,
    isSessionWarningOpen,
    startSession,
    endSession,
    updateRemainingTime,
    openSessionWarning,
    closeSessionWarning,
    extendSession,
  } = useSessionStore();
  const { logout } = useAuth();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWarningThresholdRef = useRef<number | null>(null);

  // Start session on login
  useEffect(() => {
    if (isAuthenticated && !sessionExpiresAt) {
      startSession();
      lastWarningThresholdRef.current = null;
    }
  }, [isAuthenticated, sessionExpiresAt, startSession]);

  // End session on logout
  useEffect(() => {
    if (!isAuthenticated) {
      endSession();
      lastWarningThresholdRef.current = null;
    }
  }, [isAuthenticated, endSession]);

  // Timer setup
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Update remaining time every second
    timerRef.current = setInterval(() => {
      updateRemainingTime();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, sessionExpiresAt, updateRemainingTime]);

  // Show warning modal and handle session expiry
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    // Session expired
    if (remainingSeconds === 0 && sessionExpiresAt && Date.now() >= sessionExpiresAt) {
      logout();
      endSession();
      return;
    }

    // Check warning thresholds
    for (const threshold of WARNING_THRESHOLDS) {
      if (
        remainingSeconds <= threshold &&
        remainingSeconds > threshold - 1 &&
        lastWarningThresholdRef.current !== threshold
      ) {
        openSessionWarning();
        lastWarningThresholdRef.current = threshold;
        break;
      }
    }
  }, [remainingSeconds, isAuthenticated, sessionExpiresAt, logout, endSession, openSessionWarning]);

  const handleExtend = useCallback(() => {
    extendSession();
    lastWarningThresholdRef.current = null;
  }, [extendSession]);

  const handleDismiss = useCallback(() => {
    closeSessionWarning();
  }, [closeSessionWarning]);

  return {
    remainingSeconds,
    isSessionWarningOpen,
    handleExtend,
    handleDismiss,
  };
}
