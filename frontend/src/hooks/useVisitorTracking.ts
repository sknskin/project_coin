import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { statisticsApi } from '../api/statistics.api';

// 오늘 날짜 문자열 가져오기 (YYYY-MM-DD)
const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// 세션 ID 생성 함수 (날짜 포함)
const generateSessionId = (): string => {
  const dateStr = getTodayDateString();
  return `${dateStr}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// 세션 ID 가져오기 또는 생성 (매일 새로운 세션)
const getOrCreateSessionId = (): string => {
  const today = getTodayDateString();
  const storedDate = sessionStorage.getItem('visitorSessionDate');
  let sessionId = sessionStorage.getItem('visitorSessionId');

  // 날짜가 바뀌었거나 세션이 없으면 새로 생성
  if (!sessionId || storedDate !== today) {
    sessionId = generateSessionId();
    sessionStorage.setItem('visitorSessionId', sessionId);
    sessionStorage.setItem('visitorSessionDate', today);
  }
  return sessionId;
};

export function useVisitorTracking() {
  const location = useLocation();
  const isTracking = useRef(false);

  useEffect(() => {
    // 중복 추적 방지
    if (isTracking.current) return;
    isTracking.current = true;

    const trackVisit = async () => {
      try {
        const sessionId = getOrCreateSessionId();
        await statisticsApi.trackVisitor(sessionId);
      } catch (error) {
        // 통계 추적 실패 로그 (디버깅용)
        console.warn('Visitor tracking failed:', error);
      }
    };

    trackVisit();

    // cleanup에서 플래그 리셋
    return () => {
      isTracking.current = false;
    };
  }, [location.pathname]); // 페이지가 변경될 때마다 추적
}
