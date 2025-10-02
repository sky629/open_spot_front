// API 관련 상수
// NOTE: API 엔드포인트는 Orval이 자동 생성합니다 (src/api/generated/)
// 여기에는 설정값만 관리합니다

export const API_CONFIG = {
  BASE_URL: __VITE_API_BASE_URL__ || 'http://localhost:8080',
  TIMEOUT: 10000,
} as const;