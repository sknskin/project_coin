import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getTokenRemainingTime } from '../utils/jwt';

interface SessionTimer {
  remainingTime: number; // 밀리초
  formattedTime: string; // "MM:SS" 형식
  isExpiringSoon: boolean; // 5분 이하일 때 true
}

export function useSessionTimer(): SessionTimer {
  const { accessToken, isAuthenticated } = useAuthStore();
  const [remainingTime, setRemainingTime] = useState(0);

  const calculateRemainingTime = useCallback(() => {
    if (!accessToken) return 0;
    return getTokenRemainingTime(accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setRemainingTime(0);
      return;
    }

    // 초기값 설정
    setRemainingTime(calculateRemainingTime());

    // 1초마다 업데이트
    const interval = setInterval(() => {
      const time = calculateRemainingTime();
      setRemainingTime(time);
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, accessToken, calculateRemainingTime]);

  // MM:SS 형식으로 포맷팅
  const formatTime = (ms: number): string => {
    if (ms <= 0) return '00:00';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    remainingTime,
    formattedTime: formatTime(remainingTime),
    isExpiringSoon: remainingTime > 0 && remainingTime <= 5 * 60 * 1000, // 5분 이하
  };
}
