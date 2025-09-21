// Secure Authentication Service with HttpOnly Cookie Support

import type { IAuthServiceFull } from '../core/interfaces';
import type { User, GoogleLoginResponse } from '../types';
import { SecureCookieService } from './SecureCookieService';
import { API_ENDPOINTS } from '../constants';
import { logger } from '../utils/logger';

export class SecureAuthService implements IAuthServiceFull {
  private cookieService: SecureCookieService;
  private apiClient: any; // IApiClient 타입을 나중에 주입받음

  constructor() {
    this.cookieService = new SecureCookieService();
  }

  /**
   * API 클라이언트 주입 (순환 참조 방지)
   * @param apiClient - API 클라이언트 인스턴스
   */
  setApiClient(apiClient: any): void {
    this.apiClient = apiClient;
  }

  async loginWithGoogle(accessToken: string): Promise<GoogleLoginResponse> {
    try {
      logger.userAction('Google login with access token');

      const response = await (this.apiClient as any).post(
        API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
        { accessToken }
      );

      if (response.success && response.data) {
        const loginResponse = response.data;
        const { user } = loginResponse;

        // 사용자 정보만 로컬에 저장 (토큰은 HttpOnly 쿠키로 서버에서 설정됨)
        this.setUser(user);

        logger.userAction('Google login success', { userId: user.id });
        return loginResponse;
      } else {
        throw new Error(response.message || 'Google login failed');
      }
    } catch (error) {
      logger.error('Google login failed', error);
      throw error;
    }
  }

  async loginWithGoogleCode(authorizationCode: string): Promise<GoogleLoginResponse> {
    try {
      logger.userAction('Google login with authorization code');

      const response = await (this.apiClient as any).post(
        API_ENDPOINTS.AUTH.GOOGLE_LOGIN_CODE,
        { code: authorizationCode }
      );

      if (response.success && response.data) {
        const loginResponse = response.data;
        const { user } = loginResponse;

        // 사용자 정보만 로컬에 저장
        this.setUser(user);

        logger.userAction('Google login with code success', { userId: user.id });
        return loginResponse;
      } else {
        throw new Error(response.message || 'Google login with code failed');
      }
    } catch (error) {
      logger.error('Google login with code failed', error);
      throw error;
    }
  }

  async setUserFromToken(token: string): Promise<GoogleLoginResponse> {
    try {
      logger.userAction('Setting user from JWT token');

      // HttpOnly 쿠키 환경에서는 클라이언트에서 토큰을 직접 처리하지 않음
      // 대신 서버에서 토큰 검증 및 사용자 정보 반환을 요청
      const response = await (this.apiClient as any).post(
        API_ENDPOINTS.AUTH.VERIFY_TOKEN,
        { token }
      );

      if (response.success && response.data) {
        const user = response.data;
        this.setUser(user);

        const loginResponse: GoogleLoginResponse = {
          user: user,
          tokens: {
            accessToken: '', // HttpOnly 쿠키로 관리됨
            refreshToken: '', // HttpOnly 쿠키로 관리됨
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후
          }
        };

        logger.userAction('User set from token successfully', { userId: user.id });
        return loginResponse;
      } else {
        throw new Error(response.message || 'Token verification failed');
      }
    } catch (error) {
      logger.error('Failed to set user from token', error);
      throw error;
    }
  }

  async getUserProfile(): Promise<User> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      const response = await (this.apiClient as any).get(
        API_ENDPOINTS.AUTH.USER_PROFILE
      );

      if (response.success && response.data) {
        const user = response.data;
        this.setUser(user); // 최신 정보로 업데이트
        return user;
      } else {
        throw new Error(response.message || 'Failed to get user profile');
      }
    } catch (error) {
      logger.error('Failed to get user profile', error);

      // 네트워크 에러 처리
      if (error instanceof Error &&
          (error.message.includes('Network Error') || error.message.includes('ERR_FAILED'))) {
        throw new Error('Backend server is not available. Please check if the server is running.');
      }

      throw error;
    }
  }

  async refreshAccessToken(): Promise<string> {
    try {
      // HttpOnly 쿠키 환경에서는 서버에서 자동으로 토큰 갱신
      const response = await (this.apiClient as any).post(
        API_ENDPOINTS.AUTH.TOKEN_REFRESH
      );

      if (response.success) {
        logger.info('Token refreshed successfully via HttpOnly cookie');
        return 'token_refreshed'; // 실제 토큰은 쿠키로 관리됨
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error) {
      logger.error('Token refresh failed', error);
      await this.logout(); // 갱신 실패 시 로그아웃
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      // 서버에 로그아웃 요청 (HttpOnly 쿠키 제거)
      try {
        await this.apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
        logger.userAction('Server logout successful');
      } catch (error) {
        logger.warn('Server logout failed, proceeding with local logout', error);
      }

      // 로컬에 저장된 사용자 정보 제거
      this.removeUser();

      // 클라이언트 측 쿠키 제거 (CSRF 토큰 등)
      this.cookieService.clearAppCookies();

      logger.userAction('User logged out - cleared all local data');
    } catch (error) {
      logger.error('Error during logout', error);
      throw error;
    }
  }

  isAuthenticated(): boolean {
    // HttpOnly 쿠키 환경에서는 사용자 정보 존재 여부로 인증 상태 확인
    const user = this.getUser();
    return !!user;
  }

  isTokenExpired(): boolean {
    // HttpOnly 쿠키는 서버에서 관리하므로 클라이언트에서는 확인 불가
    // API 요청 시 401 에러로 만료 여부 확인
    return false;
  }

  getAuthHeader(): Record<string, string> {
    // HttpOnly 쿠키 환경에서는 추가 헤더가 필요한 경우에만 사용
    // CSRF 토큰은 SecureApiClient에서 처리됨
    return {};
  }

  setUser(user: User): void {
    try {
      // 사용자 정보를 안전하게 저장 (쿠키 + localStorage 백업)
      this.cookieService.setUserPreferences({
        userId: user.id,
        email: user.email,
        name: user.name,
        profileImageUrl: user.profileImageUrl
      });

      // localStorage에도 백업 저장
      localStorage.setItem('open_spot_user', JSON.stringify(user));

      logger.info('User data stored successfully');
    } catch (error) {
      logger.error('Failed to store user data', error);
    }
  }

  getUser(): User | null {
    try {
      // 먼저 쿠키에서 시도
      const preferences = this.cookieService.getUserPreferences();
      if (preferences && preferences.userId) {
        return {
          id: preferences.userId as string,
          email: preferences.email as string,
          name: preferences.name as string,
          profileImageUrl: preferences.profileImageUrl as string | undefined,
          provider: 'Google',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      // 쿠키에 없으면 localStorage에서 시도
      const userStr = localStorage.getItem('open_spot_user');
      if (userStr) {
        return JSON.parse(userStr);
      }

      return null;
    } catch (error) {
      logger.error('Failed to get user data', error);
      return null;
    }
  }

  getCSRFToken(): string | null {
    return this.cookieService.getCSRFToken();
  }

  setCSRFToken(token: string): void {
    this.cookieService.setCSRFToken(token);
  }

  /**
   * 사용자 정보 제거
   */
  private removeUser(): void {
    try {
      // 쿠키에서 제거
      this.cookieService.deleteCookie('open_spot_user_preference');

      // localStorage에서 제거
      localStorage.removeItem('open_spot_user');

      logger.info('User data removed successfully');
    } catch (error) {
      logger.error('Failed to remove user data', error);
    }
  }

  /**
   * 디버그 정보 출력
   */
  debugLog(): void {
    console.group('🔐 Secure Auth Service Status');
    console.log('Authenticated:', this.isAuthenticated());
    console.log('User:', this.getUser());
    console.log('CSRF Token:', this.getCSRFToken());
    this.cookieService.debugLog();
    console.groupEnd();
  }
}