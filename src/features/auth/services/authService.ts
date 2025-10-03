// 인증 관련 API 서비스
// REFACTORED: DI 패턴, Zustand 상태 관리, Feature 중심 구조, HttpOnly Cookie 완료
import { logger } from '../../../utils/logger';
import type {
  GoogleLoginResponse,
  User
} from '../../../types';

// Orval 생성 API factory import
import { getAuthentication } from '../../../api/generated/authentication/authentication';
import { getUsers } from '../../../api/generated/users/users';

// Orval API 함수들 생성
const authApi = getAuthentication();
const usersApi = getUsers();

export class AuthService {
  // HttpOnly Cookie 방식에서는 토큰 관리 불필요
  // 브라우저가 자동으로 쿠키 전송/수신 처리

  // 로그인 상태 확인 (user 존재 여부로 판단)
  isAuthenticated(): boolean {
    // 실제 토큰 유효성은 API 호출 시 백엔드에서 자동 확인
    // 프론트엔드는 user가 store에 있으면 인증된 것으로 간주
    return true;
  }

  // JWT 토큰으로부터 사용자 설정 (백엔드에서 OAuth 처리 후 리다이렉트 시 사용)
  async setUserFromToken(token: string): Promise<GoogleLoginResponse> {
    try {
      console.log('🔍 Setting user from JWT token:', token.substring(0, 20) + '...');
      logger.userAction('Setting user from JWT token');

      // JWT 토큰 디코딩하여 사용자 정보 추출
      const tokenPayload = this.decodeJwtToken(token);
      console.log('📋 JWT Token payload:', tokenPayload);

      // 사용자 정보 구성 (JWT payload에서 추출)
      // 토큰은 HttpOnly 쿠키로 자동 관리되므로 저장하지 않음
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

      const loginResponse: GoogleLoginResponse = {
        user: user,
        tokens: null  // HttpOnly Cookie 방식에서는 불필요
      };

      console.log('✅ User extracted from token successfully');
      logger.userAction('User extracted from token', { userId: user.id });
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

  // 토큰 갱신 (Refresh Token: HttpOnly Cookie, Access Token: Response Body)
  async refreshAccessToken(): Promise<{ access_token: string }> {
    try {
      // refreshToken은 HttpOnly 쿠키로 자동 전송됨
      const response = await authApi.refreshToken();

      if (response.success && response.data) {
        // Response body에서 새 accessToken 추출 (camelCase)
        const accessToken = response.data.accessToken;
        logger.info('Token refreshed successfully, received new access_token');
        return { access_token: accessToken };
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      logger.error('Token refresh failed', error);
      // logout 호출 제거: 무한 루프 방지 (logout API도 401 에러 발생 가능)
      // 호출자(AuthContext)에서 적절히 처리하도록 에러만 전파
      throw error;
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(): Promise<User> {
    try {
      // Orval 생성 API 호출
      const response = await usersApi.getCurrentUser();

      if (response.success && response.data) {
        const user = response.data as unknown as User;

        // User는 반환하여 호출자(store)가 관리하도록 함
        return user;
      } else {
        throw new Error('Failed to get user profile');
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

  // 로그아웃 (HttpOnly Cookie 방식)
  async logout(): Promise<void> {
    try {
      // 서버에 로그아웃 요청 (쿠키 Max-Age=0으로 삭제)
      await authApi.logout();
      logger.userAction('Logout successful - cookies cleared by server');
    } catch (error) {
      // 401 에러는 이미 인증 실패 상태이므로 정상으로 간주
      if ((error as { response?: { status: number } }).response?.status === 401) {
        logger.info('Already unauthenticated, skipping server logout');
      } else {
        logger.error('Logout request failed', error);
      }
      // 서버 요청 실패 여부와 관계없이 클라이언트 정리는 진행
      logger.warn('Continuing with client-side logout');
    }
  }

  // 인증 헤더 가져오기 (HttpOnly Cookie 방식에서는 불필요)
  getAuthHeader(): Record<string, never> {
    // 쿠키가 자동 전송되므로 빈 객체 반환
    return {};
  }
}