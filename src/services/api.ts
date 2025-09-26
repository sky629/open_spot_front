// API 클라이언트 설정

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { API_CONFIG } from '../constants';
import { logger } from '../utils/logger';
import type { ApiResponse } from '../types';
import type { AuthService } from './authService';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터 - 인증 헤더 추가
    this.client.interceptors.request.use(
      (config) => {
        // 순환 참조 방지를 위해 dynamic import 사용
        const authService = this.getAuthService();
        
        if (authService && authService.getAuthHeader) {
          const authHeaders = authService.getAuthHeader();
          if (authHeaders && Object.keys(authHeaders).length > 0) {
            config.headers = { ...config.headers, ...authHeaders } as Record<string, string>;
          }
        } else {
          console.warn('⚠️ AuthService not available for API request');
        }

        // 로그아웃 요청인 경우 JWT 토큰 포함 여부 로깅
        if (config.url?.includes('/logout')) {
          console.log('🔓 Logout request with headers:', {
            url: config.url,
            hasAuthHeader: !!config.headers?.Authorization,
            authHeader: config.headers?.Authorization ? 
              (config.headers.Authorization as string).substring(0, 20) + '...' : 'None',
            authServiceAvailable: !!authService
          });
        }

        logger.apiRequest(
          config.method?.toUpperCase() || 'UNKNOWN',
          config.url || 'unknown',
          config.data
        );
        return config;
      },
      (error) => {
        logger.error('API Request failed', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터 - 토큰 만료 처리
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse<unknown>>) => {
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

        // 401 에러 시 토큰 갱신 시도
        if (status === 401 && !error.config._retry) {
          error.config._retry = true;

          try {
            const authService = this.getAuthService();
            if (authService && authService.getRefreshToken()) {
              await authService.refreshAccessToken();

              // 새로운 토큰으로 요청 재시도
              const authHeaders = authService.getAuthHeader();
              error.config.headers = { ...error.config.headers, ...authHeaders };

              return this.client.request(error.config);
            }
          } catch (refreshError) {
            logger.error('Token refresh failed, redirecting to login', refreshError);
            // 로그인 페이지로 리다이렉트는 AuthContext에서 처리
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // 순환 참조 방지를 위한 동적 authService 가져오기
  private getAuthService() {
    try {
      // 런타임에서 authService 가져오기 (dynamic import는 비동기라서 여기서는 사용할 수 없음)
      // 대신 전역 객체에서 가져오기
      const authService = (window as unknown as { __authService?: AuthService }).__authService || null;
      
      if (!authService) {
        console.warn('⚠️ AuthService not found in global window object');
      }
      
      return authService;
    } catch (error) {
      // authService가 아직 로드되지 않은 경우
      console.error('❌ Error getting AuthService:', error);
      return null;
    }
  }

  async get<T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url, { params });
    return response.data;
  }

  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  async put<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.put<ApiResponse<T>>(url, data);
    return response.data;
  }

  async delete<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.delete<ApiResponse<T>>(url);
    return response.data;
  }
}

export const apiClient = new ApiClient();
export const api = apiClient; // authService에서 사용하기 위한 별칭