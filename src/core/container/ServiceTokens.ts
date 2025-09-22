// Service Registration Tokens

/**
 * DI 컨테이너에서 서비스 식별을 위한 토큰들
 * Symbol을 사용하여 고유성을 보장합니다
 */

// Core Services
export const SERVICE_TOKENS = {
  // API 관련
  API_CLIENT: Symbol('ApiClient'),

  // 인증 관련
  AUTH_SERVICE: Symbol('AuthService'),

  // 위치 관련
  LOCATION_SERVICE: Symbol('LocationService'),

  // 쿠키 관련
  COOKIE_SERVICE: Symbol('CookieService'),

  // 로거 관련
  LOGGER: Symbol('Logger'),

  // 맵 관련
  MAP_SERVICE_FACTORY: Symbol('MapServiceFactory'),
  MAP_SERVICE: Symbol('MapService'),
  MAP_LOADER: Symbol('MapLoader'),

  // 네이버 맵 관련 (레거시)
  NAVER_MAP_SERVICE: Symbol('NaverMapService')
} as const;

/**
 * 타입 안전성을 위한 서비스 토큰 타입
 */
export type ServiceToken = typeof SERVICE_TOKENS[keyof typeof SERVICE_TOKENS];

/**
 * 서비스 토큰을 문자열로 변환하는 유틸리티 함수
 * @param token - 서비스 토큰
 * @returns 토큰의 문자열 표현
 */
export function tokenToString(token: ServiceToken): string {
  return token.toString();
}

/**
 * 디버깅을 위한 모든 토큰 목록 반환
 * @returns 모든 서비스 토큰 배열
 */
export function getAllTokens(): ServiceToken[] {
  return Object.values(SERVICE_TOKENS);
}