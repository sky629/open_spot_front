// Secure API Client with HttpOnly Cookie Support

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import type { IApiClient, IAuthServiceFull } from '../core/interfaces';
import type { ApiClientConfig, CSRFConfig } from '../core/types';
import type { ApiResponse } from '../types';
import { SecureCookieService } from './SecureCookieService';
import { logger } from '../utils/logger';

export class SecureApiClient implements IApiClient {
  private client: AxiosInstance;
  private authService?: IAuthServiceFull;
  private cookieService: SecureCookieService;
  private csrfConfig: CSRFConfig;

  constructor(config: ApiClientConfig) {
    this.cookieService = new SecureCookieService();
    this.csrfConfig = config.csrf || {
      headerName: 'X-CSRF-Token',
      cookieName: 'open_spot_csrf_token',
      enabled: true
    };

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // HttpOnly 쿠키 전송을 위해 필수
    });

    this.setupCookieInterceptors();
  }

  setAuthService(authService: IAuthServiceFull): void {
    this.authService = authService;
  }

  setupCookieInterceptors(): void {
    // 요청 인터셉터 - CSRF 토큰 및 기타 헤더 추가
    this.client.interceptors.request.use(
      (config) => {
        // CSRF 토큰 헤더 추가
        if (this.csrfConfig.enabled) {
          const csrfToken = this.cookieService.getCSRFToken();
          if (csrfToken) {
            config.headers[this.csrfConfig.headerName] = csrfToken;
          }
        }

        // 추가 인증 헤더가 필요한 경우 (예: API 키)
        if (this.authService) {
          const authHeaders = this.authService.getAuthHeader();
          Object.assign(config.headers, authHeaders);
        }

        logger.apiRequest(
          config.method?.toUpperCase() || 'UNKNOWN',
          config.url || 'unknown',
          config.data
        );

        return config;
      },
      (error) => {
        logger.error('API Request interceptor failed', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터 - 토큰 갱신 및 CSRF 토큰 업데이트
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => {
        // 응답에서 새로운 CSRF 토큰이 있는 경우 업데이트
        const newCSRFToken = response.headers['x-csrf-token'];
        if (newCSRFToken) {
          this.cookieService.setCSRFToken(newCSRFToken);
        }

        logger.apiResponse(
          response.status,
          response.config.url || 'unknown',
          response.data
        );

        return response;
      },
      async (error) => {
        const status = error.response?.status || 0;
        const url = error.config?.url || 'unknown';
        const errorData = error.response?.data || error.message;

        logger.apiResponse(status, url, errorData);

        // 401 에러 처리 - HttpOnly 쿠키 기반에서는 자동 갱신이 어려움
        if (status === 401 && !error.config._retry) {
          error.config._retry = true;

          try {
            // 인증 서비스가 있고 토큰 갱신이 가능한 경우
            if (this.authService && this.authService.refreshAccessToken) {
              await this.authService.refreshAccessToken();

              // 요청 재시도 (쿠키는 자동으로 전송됨)
              return this.client.request(error.config);
            }
          } catch (refreshError) {
            logger.error('Token refresh failed in SecureApiClient', refreshError);

            // 갱신 실패 시 로그아웃 처리
            if (this.authService) {
              await this.authService.logout();
            }
          }
        }

        // 403 에러 (CSRF 토큰 문제 가능성)
        if (status === 403 && this.csrfConfig.enabled) {
          logger.warn('CSRF token may be invalid or missing');
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, { params });
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'GET', url);
      throw error;
    }
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'POST', url);
      throw error;
    }
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'PUT', url);
      throw error;
    }
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url);
      return response.data;
    } catch (error) {
      this.handleApiError(error, 'DELETE', url);
      throw error;
    }
  }

  /**
   * API 에러 공통 처리
   * @param error - 에러 객체
   * @param method - HTTP 메서드
   * @param url - 요청 URL
   */
  private handleApiError(error: any, method: string, url: string): void {
    const status = error.response?.status;

    // 특정 에러에 대한 추가 처리
    switch (status) {
      case 401:
        logger.warn(`Unauthorized access to ${method} ${url}`);
        break;
      case 403:
        logger.warn(`Forbidden access to ${method} ${url} - Check CSRF token`);
        break;
      case 429:
        logger.warn(`Rate limit exceeded for ${method} ${url}`);
        break;
      case 500:
        logger.error(`Server error for ${method} ${url}:`, error.response?.data);
        break;
      default:
        logger.error(`API error for ${method} ${url}:`, error.message);
    }
  }

  /**
   * 쿠키 서비스 인스턴스 반환
   * @returns 쿠키 서비스
   */
  getCookieService(): SecureCookieService {
    return this.cookieService;
  }

  /**
   * CSRF 설정 업데이트
   * @param config - 새로운 CSRF 설정
   */
  updateCSRFConfig(config: Partial<CSRFConfig>): void {
    this.csrfConfig = { ...this.csrfConfig, ...config };
  }

  /**
   * 디버그 정보 출력
   */
  debugLog(): void {
    console.group('🔒 Secure API Client Status');
    console.log('Base URL:', this.client.defaults.baseURL);
    console.log('Timeout:', this.client.defaults.timeout);
    console.log('CSRF Config:', this.csrfConfig);
    console.log('Auth Service:', !!this.authService);
    this.cookieService.debugLog();
    console.groupEnd();
  }
}