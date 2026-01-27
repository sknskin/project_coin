/**
 * JWT 토큰에서 payload를 디코딩합니다.
 */
export function decodeJwtPayload(token: string): { exp?: number; iat?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * JWT 토큰의 만료 시간(timestamp)을 반환합니다.
 */
export function getTokenExpiration(token: string): number | null {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000; // 초 -> 밀리초
}

/**
 * JWT 토큰의 남은 시간(밀리초)을 반환합니다.
 */
export function getTokenRemainingTime(token: string): number {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  return Math.max(0, expiration - Date.now());
}
