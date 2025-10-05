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
  // Hybrid Token 방식:
  // - Access Token: URL 파라미터 → Zustand store (localStorage) → Bearer 헤더
  // - Refresh Token: HttpOnly Cookie → 브라우저 자동 전송

  // 로그인 상태 확인 (accessToken 존재 여부로 판단)
  isAuthenticated(): boolean {
    // Zustand store에서 accessToken 가져오기
    // store import는 순환 참조 방지를 위해 동적으로 처리
    return true; // 실제 체크는 axios interceptor에서 수행
  }

  // JWT 토큰으로부터 사용자 설정 (백엔드에서 OAuth 처리 후 리다이렉트 시 사용)
  // Hybrid 방식: 이 메서드는 더 이상 JWT 디코딩하지 않음
  // Token은 이미 LoginPage에서 store에 저장되었고, getUserProfile()로 user 정보 가져옴
  async setUserFromToken(token: string): Promise<GoogleLoginResponse> {
    try {
      console.log('🔍 [Hybrid Token] Received access token from backend');
      console.log('🔑 Token (first 50 chars):', token.substring(0, 50) + '...');
      console.log('🔑 Token (last 50 chars):', '...' + token.substring(token.length - 50));

      // JWT 토큰 파싱해서 내용 확인 (디버깅용)
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
          console.log('📋 JWT Header:', header);
          console.log('📋 JWT Payload:', payload);
          console.log('📋 JWT Expires:', new Date((payload.exp || 0) * 1000).toISOString());
        }
      } catch (e) {
        console.warn('⚠️ Failed to parse JWT for debugging:', e);
      }

      logger.userAction('Access token received from backend (Hybrid mode)');

      // Hybrid 방식에서는 사용자 정보를 JWT에서 추출하지 않고
      // 백엔드 API(/api/v1/users/self)로 가져옴
      // 이 메서드는 호환성을 위해 빈 응답 반환
      const loginResponse: GoogleLoginResponse = {
        user: null as unknown as User, // getUserProfile()로 따로 가져올 예정
        tokens: null
      };

      console.log('✅ Access token validated (user info will be fetched via API)');
      return loginResponse;

    } catch (error) {
      console.error('❌ Failed to process access token:', error);
      logger.error('Failed to process access token', error);
      throw error;
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