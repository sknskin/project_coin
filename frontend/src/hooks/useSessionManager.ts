import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSessionStore } from '../store/sessionStore';
import { useAuth } from './useAuth';
import { authApi } from '../api/auth.api';

const WARNING_THRESHOLDS = [10 * 60, 5 * 60, 1 * 60]; // 10min, 5min, 1min (seconds)

export function useSessionManager() {
  const navigate = useNavigate();
  const { isAuthenticated, accessToken } = useAuthStore();
  const {
    sessionExpiresAt,
    remainingSeconds,
    isSessionWarningOpen,
    lastWarningThreshold,
    startSession,
    endSession,
    updateRemainingTime,
    openSessionWarning,
    closeSessionWarning,
    setLastWarningThreshold,
  } = useSessionStore();
  const { logout } = useAuth();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializedRef = useRef(false);
  const isLoggingOutRef = useRef(false);

  // Force logout and redirect to home
  const forceLogout = useCallback(() => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    closeSessionWarning();
    endSession();
    logout();
    navigate('/', { replace: true });

    // Reset flag after a short delay
    setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 1000);
  }, [closeSessionWarning, endSession, logout, navigate]);

  // Start session on login
  useEffect(() => {
    if (isAuthenticated && accessToken && !initializedRef.current) {
      startSession(accessToken);
      initializedRef.current = true;
    } else if (!isAuthenticated) {
      initializedRef.current = false;
    }
  }, [isAuthenticated, accessToken, startSession]);

  // End session on logout
  useEffect(() => {
    if (!isAuthenticated) {
      endSession();
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

  // Handle session expiry - check when remainingSeconds changes
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) return;

    // Session expired - force logout
    if (remainingSeconds <= 0) {
      forceLogout();
      return;
    }

    // Check warning thresholds
    for (const threshold of WARNING_THRESHOLDS) {
      if (
        remainingSeconds <= threshold &&
        remainingSeconds > threshold - 1 &&
        lastWarningThreshold !== threshold
      ) {
        openSessionWarning();
        setLastWarningThreshold(threshold);
        break;
      }
    }
  }, [remainingSeconds, isAuthenticated, sessionExpiresAt, lastWarningThreshold, forceLogout, openSessionWarning, setLastWarningThreshold]);

  // Also check on visibility change (when user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated && sessionExpiresAt) {
        // Immediately update remaining time when tab becomes visible
        updateRemainingTime();

        // Check if session has expired while tab was hidden
        const now = Date.now();
        if (now >= sessionExpiresAt) {
          forceLogout();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, sessionExpiresAt, updateRemainingTime, forceLogout]);

  const handleExtend = useCallback(async () => {
    // Don't allow extend if session already expired
    if (remainingSeconds <= 0) {
      forceLogout();
      return;
    }

    try {
      const response = await authApi.refresh();
      if (response.accessToken) {
        useAuthStore.getState().updateAccessToken(response.accessToken);
        startSession(response.accessToken);
      }
      closeSessionWarning();
    } catch (error) {
      console.error('Failed to extend session:', error);
      forceLogout();
    }
  }, [remainingSeconds, startSession, closeSessionWarning, forceLogout]);

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
