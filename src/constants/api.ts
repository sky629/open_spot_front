// API 관련 상수

export const API_ENDPOINTS = {
  // 기존 위치 관련 엔드포인트 (현재는 mock 데이터로 사용)
  LOCATIONS: '/api/v1/locations',
  LOCATION_BY_ID: (id: string) => `/api/v1/locations/${id}`,

  // 백엔드 인증 관련 엔드포인트
  AUTH: {
    GOOGLE_LOGIN: '/api/v1/auth/google/login',
    GOOGLE_LOGIN_CODE: '/api/v1/auth/google/login/code',
    LOGOUT: '/api/v1/auth/logout',
    USER_PROFILE: '/api/v1/users/self',
    TOKEN_REFRESH: '/api/v1/auth/token/refresh',
  },

  // 백엔드 분석 서비스 엔드포인트
  STORES: '/api/v1/stores',
  REPORTS: '/api/v1/reports',
  REPORT_BY_ID: (id: string) => `/api/v1/reports/${id}`,
} as const;

export const API_CONFIG = {
  BASE_URL: __API_BASE_URL__ || 'http://localhost:8080',
  TIMEOUT: 10000,
} as const;