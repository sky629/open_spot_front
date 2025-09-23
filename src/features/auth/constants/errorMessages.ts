// Login Error Messages and Configuration

import { LoginErrorCode } from '../types/errors';

export const ERROR_MESSAGES: Record<LoginErrorCode, string> = {
  [LoginErrorCode.AUTH_FAILED]: '인증에 실패했습니다. 다시 시도해 주세요.',
  [LoginErrorCode.INVALID_REQUEST]: '잘못된 요청입니다. 페이지를 새로고침하고 다시 시도해 주세요.',
  [LoginErrorCode.SERVER_ERROR]: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  [LoginErrorCode.OAUTH_CANCELED]: '로그인이 취소되었습니다.',
  [LoginErrorCode.OAUTH_DENIED]: '로그인 권한이 거부되었습니다. 다시 시도하거나 다른 계정을 사용해 주세요.',
  [LoginErrorCode.SESSION_EXPIRED]: '세션이 만료되었습니다. 다시 로그인해 주세요.',
  [LoginErrorCode.RATE_LIMITED]: '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해 주세요.',
  [LoginErrorCode.SERVICE_UNAVAILABLE]: '서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  [LoginErrorCode.INVALID_PROVIDER]: '지원하지 않는 로그인 방식입니다.',
  [LoginErrorCode.NETWORK_ERROR]: '네트워크 연결을 확인하고 다시 시도해 주세요.',
  [LoginErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류가 발생했습니다. 문제가 계속되면 고객센터에 문의해 주세요.'
};

export const ERROR_TITLES: Record<LoginErrorCode, string> = {
  [LoginErrorCode.AUTH_FAILED]: '로그인 실패',
  [LoginErrorCode.INVALID_REQUEST]: '잘못된 요청',
  [LoginErrorCode.SERVER_ERROR]: '서버 오류',
  [LoginErrorCode.OAUTH_CANCELED]: '로그인 취소',
  [LoginErrorCode.OAUTH_DENIED]: '권한 거부',
  [LoginErrorCode.SESSION_EXPIRED]: '세션 만료',
  [LoginErrorCode.RATE_LIMITED]: '요청 제한',
  [LoginErrorCode.SERVICE_UNAVAILABLE]: '서비스 점검',
  [LoginErrorCode.INVALID_PROVIDER]: '지원하지 않는 서비스',
  [LoginErrorCode.NETWORK_ERROR]: '네트워크 오류',
  [LoginErrorCode.UNKNOWN_ERROR]: '알 수 없는 오류'
};

export const RETRY_ALLOWED_ERRORS = new Set<LoginErrorCode>([
  LoginErrorCode.AUTH_FAILED,
  LoginErrorCode.SERVER_ERROR,
  LoginErrorCode.NETWORK_ERROR,
  LoginErrorCode.SERVICE_UNAVAILABLE,
  LoginErrorCode.OAUTH_CANCELED
]);

export const AUTO_RETRY_ERRORS = new Set<LoginErrorCode>([
  LoginErrorCode.NETWORK_ERROR,
  LoginErrorCode.SERVER_ERROR
]);

// Error code mapping for server response codes
export const SERVER_ERROR_CODE_MAPPING: Record<string, LoginErrorCode> = {
  'AUTH_FAILED': LoginErrorCode.AUTH_FAILED,
  'INVALID_REQUEST': LoginErrorCode.INVALID_REQUEST,
  'SERVER_ERROR': LoginErrorCode.SERVER_ERROR,
  'OAUTH_CANCELED': LoginErrorCode.OAUTH_CANCELED,
  'OAUTH_DENIED': LoginErrorCode.OAUTH_DENIED,
  'SESSION_EXPIRED': LoginErrorCode.SESSION_EXPIRED,
  'RATE_LIMITED': LoginErrorCode.RATE_LIMITED,
  'SERVICE_UNAVAILABLE': LoginErrorCode.SERVICE_UNAVAILABLE,
  'INVALID_PROVIDER': LoginErrorCode.INVALID_PROVIDER,
  'NETWORK_ERROR': LoginErrorCode.NETWORK_ERROR,
  // Fallback for unknown codes
  'UNKNOWN': LoginErrorCode.UNKNOWN_ERROR
};

export function mapServerErrorCode(serverCode: string): LoginErrorCode {
  return SERVER_ERROR_CODE_MAPPING[serverCode] || LoginErrorCode.UNKNOWN_ERROR;
}

export function shouldRetryError(errorCode: LoginErrorCode): boolean {
  return RETRY_ALLOWED_ERRORS.has(errorCode);
}

export function shouldAutoRetry(errorCode: LoginErrorCode): boolean {
  return AUTO_RETRY_ERRORS.has(errorCode);
}