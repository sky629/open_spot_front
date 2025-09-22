// 인증 관련 API 서비스
// TODO: DI 패턴으로 리팩토링하기 & 토큰은 HttpOnlyCookie 사용 방식으로 수정 & 사용자 정보는 zustand 사용해서 상태 관리 방식으로 수정 & Feature 중심의 모델 리팩토링
import { api } from './api';
import { API_ENDPOINTS } from '../constants';
import { logger } from '../utils/logger';
import { cookieService } from './cookieService';
import type {
  ApiResponse,
  GoogleLoginResponse,
  User,
  RefreshTokenResponse
} from '../types';

interface TokenStorage {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export class AuthService {
  private readonly ACCESS_TOKEN_KEY = 'open_spot_access_token';
  private readonly REFRESH_TOKEN_KEY = 'open_spot_refresh_token';
  private readonly EXPIRES_AT_KEY = 'open_spot_expires_at';
  private readonly USER_KEY = 'open_spot_user';

  // 토큰 저장
  setTokens(tokens: TokenStorage): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.EXPIRES_AT_KEY, tokens.expiresAt);
  }

  // 토큰 가져오기
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  // 토큰 만료 확인
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.EXPIRES_AT_KEY);
    if (!expiresAt) return true;

    const now = new Date().getTime();
    const expireTime = new Date(expiresAt).getTime();

    // 5분 여유를 두고 만료 체크 (토큰 갱신을 위해)
    return now >= (expireTime - 5 * 60 * 1000);
  }

  // 사용자 정보 저장 (쿠키 우선, localStorage 백업)
  setUser(user: User): void {
    try {
      const userJson = JSON.stringify(user);

      // 쿠키에 저장 (24시간 유지)
      if (cookieService.isCookieSupported()) {
        cookieService.setCookie(this.USER_KEY, userJson, 24 * 60 * 60);
      }

      // localStorage에 백업 저장
      localStorage.setItem(this.USER_KEY, userJson);

      logger.info('User data stored successfully');
    } catch (error) {
      logger.error('Failed to store user data', error);
    }
  }

  // 사용자 정보 가져오기 (쿠키 우선, localStorage 백업)
  getUser(): User | null {
    try {
      // 쿠키에서 먼저 시도
      let userStr = cookieService.getCookie(this.USER_KEY);

      // 쿠키에 없으면 localStorage에서 시도
      if (!userStr) {
        userStr = localStorage.getItem(this.USER_KEY);
      }

      if (!userStr) return null;

      return JSON.parse(userStr);
    } catch (error) {
      logger.error('Failed to parse user data', error);
      return null;
    }
  }

  // 로그인 상태 확인
  isAuthenticated(): boolean {
    const accessToken = this.getAccessToken();
    const user = this.getUser();

    return !!(accessToken && user && !this.isTokenExpired());
  }

  // Google OAuth 로그인 (Access Token을 백엔드로 전송)
  async loginWithGoogle(accessToken: string): Promise<GoogleLoginResponse> {
    try {
      logger.userAction('Google login with access token');

      const response = await api.get<ApiResponse<GoogleLoginResponse>>(
        API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
        { accessToken }
      );

      if (response.success && response.data) {
        const loginResponse = response.data.data;
        const { user, tokens } = loginResponse;

        // 토큰과 사용자 정보 저장
        this.setTokens(tokens);
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

  // JWT 토큰으로부터 사용자 설정 (백엔드에서 OAuth 처리 후 리다이렉트 시 사용)
  async setUserFromToken(token: string): Promise<GoogleLoginResponse> {
    try {
      console.log('🔍 Setting user from JWT token:', token.substring(0, 20) + '...');
      logger.userAction('Setting user from JWT token');

      // JWT 토큰 디코딩하여 사용자 정보 추출
      const tokenPayload = this.decodeJwtToken(token);
      console.log('📋 JWT Token payload:', tokenPayload);

      // 토큰에서 만료 시간 계산
      const exp = tokenPayload.exp as number;
      const expiresAt = new Date(exp * 1000).toISOString();

      // 임시 토큰 저장 (refresh token은 별도로 받아야 함)
      const tokens = {
        accessToken: token,
        refreshToken: '', // 백엔드에서 별도 제공 필요
        expiresAt: expiresAt
      };

      this.setTokens(tokens);

      // 사용자 정보 구성 (JWT payload에서 추출)
      const user: User = {
        id: (tokenPayload.sub as string) || (tokenPayload.user_id as string) || '',
        email: (tokenPayload.email as string) || '',
        name: (tokenPayload.name as string) || (tokenPayload.given_name as string) || '',
        profileImageUrl: (tokenPayload.picture as string) || undefined,
        provider: 'Google',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('👤 Created user from JWT:', user);
      this.setUser(user);

      const loginResponse: GoogleLoginResponse = {
        user: user,
        tokens: tokens
      };

      console.log('✅ User set from token successfully');
      logger.userAction('User set from token successfully', { userId: user.id });
      return loginResponse;

    } catch (error) {
      console.error('❌ Failed to set user from token:', error);
      logger.error('Failed to set user from token', error);
      throw error;
    }
  }

  // JWT 토큰 디코딩 헬퍼 메서드
  private decodeJwtToken(token: string): Record<string, unknown> {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      return JSON.parse(jsonPayload);
    } catch (error) {
      logger.error('Failed to decode JWT token', error);
      throw new Error('Invalid JWT token format');
    }
  }

  // 토큰 갱신
  async refreshAccessToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post<ApiResponse<RefreshTokenResponse>>(
        API_ENDPOINTS.AUTH.TOKEN_REFRESH,
        { refreshToken }
      );

      if (response.success && response.data) {
        const tokenResponse = response.data.data;
        const { accessToken, expiresAt } = tokenResponse;

        // 새로운 액세스 토큰 저장
        localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(this.EXPIRES_AT_KEY, expiresAt);

        logger.info('Token refreshed successfully');
        return accessToken;
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error) {
      logger.error('Token refresh failed', error);
      // 토큰 갱신 실패 시 로그아웃 처리
      this.logout();
      throw error;
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>(API_ENDPOINTS.AUTH.USER_PROFILE);

      if (response.data.success && response.data.data) {
        const user = response.data.data;

        // 최신 사용자 정보로 업데이트
        this.setUser(user);

        return user;
      } else {
        throw new Error(response.data.message || 'Failed to get user profile');
      }
    } catch (error) {
      logger.error('Failed to get user profile', error);
      
      // 백엔드 서버가 없을 때 더 명확한 에러 메시지 제공
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('ERR_FAILED')) {
          throw new Error('Backend server is not available. Please check if the server is running.');
        }
      }
      
      throw error;
    }
  }

  // 로그아웃
  async logout(): Promise<void> {
    try {
      // 서버에 로그아웃 요청
      try {
        await api.post(API_ENDPOINTS.AUTH.LOGOUT);
        logger.userAction('Server logout successful');
      } catch (error) {
        logger.warn('Server logout failed, proceeding with local logout', error);
      }

      // 로컬 스토리지에서 모든 인증 관련 데이터 제거
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.EXPIRES_AT_KEY);
      localStorage.removeItem(this.USER_KEY);

      // 쿠키에서도 모든 인증 관련 데이터 제거
      cookieService.clearAppCookies();

      logger.userAction('User logged out - cleared all storage');
    } catch (error) {
      logger.error('Error during logout', error);
      throw error;
    }
  }

  // 인증 헤더 가져오기 (API 요청에서 사용)
  getAuthHeader(): { Authorization: string } | Record<string, never> {
    const accessToken = this.getAccessToken();
    if (accessToken && !this.isTokenExpired()) {
      return { Authorization: `Bearer ${accessToken}` };
    }
    return {};
  }
}

// 싱글톤 인스턴스 생성
export const authService = new AuthService();

// 전역 객체에 등록 (API 클라이언트에서 사용하기 위해)
if (typeof window !== 'undefined') {
  (window as unknown as { __authService: AuthService }).__authService = authService;
  console.log('✅ AuthService registered to global window object');
} else {
  console.log('⚠️ Window object not available, AuthService not registered globally');
}