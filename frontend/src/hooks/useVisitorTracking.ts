import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { statisticsApi } from '../api/statistics.api';

// 세션 ID 생성 함수
const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// 세션 ID 가져오기 또는 생성
const getOrCreateSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitorSessionId');
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('visitorSessionId', sessionId);
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
        // 통계 추적 실패는 무시 (사용자 경험에 영향을 주지 않음)
        console.debug('Visitor tracking failed:', error);
      }
    };

    trackVisit();

    // cleanup에서 플래그 리셋
    return () => {
      isTracking.current = false;
    };
  }, [location.pathname]); // 페이지가 변경될 때마다 추적
}
