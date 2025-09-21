// API Client Interface
import type { ApiResponse } from '../../types';

export interface IApiClient {
  /**
   * GET 요청을 보냅니다
   * @param url - 요청 URL
   * @param params - 쿼리 파라미터
   * @returns API 응답
   */
  get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>>;

  /**
   * POST 요청을 보냅니다
   * @param url - 요청 URL
   * @param data - 요청 데이터
   * @returns API 응답
   */
  post<T>(url: string, data?: unknown): Promise<ApiResponse<T>>;

  /**
   * PUT 요청을 보냅니다
   * @param url - 요청 URL
   * @param data - 요청 데이터
   * @returns API 응답
   */
  put<T>(url: string, data?: unknown): Promise<ApiResponse<T>>;

  /**
   * DELETE 요청을 보냅니다
   * @param url - 요청 URL
   * @returns API 응답
   */
  delete<T>(url: string): Promise<ApiResponse<T>>;

  /**
   * 인증 헤더를 설정합니다
   * @param authService - 인증 서비스 인스턴스
   */
  setAuthService(authService: IAuthService): void;

  /**
   * 쿠키 인터셉터를 설정합니다
   */
  setupCookieInterceptors(): void;
}

// 순환 참조 방지를 위한 인터페이스 전방 선언
export interface IAuthService {
  getAuthHeader(): Record<string, string>;
  refreshAccessToken(): Promise<string>;
  isAuthenticated(): boolean;
}