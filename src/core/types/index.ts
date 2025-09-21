// Core Types

/**
 * API 응답 기본 형식
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * DI 컨테이너 관련 타입들
 */

/**
 * 서비스 팩토리 함수 타입
 */
export type ServiceFactory<T> = () => T;

/**
 * 서비스 라이프사이클 옵션
 */
export interface ServiceOptions {
  singleton?: boolean;
  lazy?: boolean;
}

/**
 * 서비스 메타데이터
 */
export interface ServiceMetadata {
  token: string | symbol;
  type: string;
  singleton: boolean;
  created: Date;
  lastAccessed?: Date;
}

/**
 * HTTP 쿠키 옵션
 */
export interface CookieOptions {
  domain?: string;
  path?: string;
  expires?: Date;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * CSRF 보호 설정
 */
export interface CSRFConfig {
  headerName: string;
  cookieName: string;
  enabled: boolean;
}

/**
 * API 클라이언트 설정
 */
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  withCredentials: boolean;
  csrf?: CSRFConfig;
}