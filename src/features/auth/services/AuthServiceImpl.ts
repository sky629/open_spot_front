// Auth Service Implementation for Feature Module

import { SecureAuthService } from '../../../services/SecureAuthService';
import type { IAuthServiceFull } from '../../../core/interfaces';
import type { User } from '../../../types';

/**
 * Auth Feature용 서비스 구현체
 * SecureAuthService를 래핑하여 추가 기능 제공
 */
export class AuthServiceImpl extends SecureAuthService implements IAuthServiceFull {
  private _hasLoggedNoUserData = false;

  /**
   * 자동 로그인 시도 (페이지 로드 시)
   */
  async attemptAutoLogin(): Promise<boolean> {
    try {
      // 저장된 사용자 정보 확인
      const savedUser = this.getUser();
      if (savedUser) {
        console.log('✅ Found saved user data:', { id: savedUser.id, name: savedUser.name });

        // 저장된 사용자 정보가 있으면 자동 로그인 성공으로 처리
        // 불필요한 프로필 재조회 API 호출 제거
        console.log('🚀 Auto login successful with cached user data');
        return true;
      }

      // React Strict Mode에서 중복 로그 방지
      if (!this._hasLoggedNoUserData) {
        console.log('ℹ️ No saved user data found');
        this._hasLoggedNoUserData = true;
      }
      return false;
    } catch (error) {
      console.warn('Auto login failed:', error);
      return false;
    }
  }

  /**
   * 토큰 자동 갱신 설정
   */
  setupAutoTokenRefresh(): () => void {
    const refreshInterval = 15 * 60 * 1000; // 15분마다 갱신 시도

    const intervalId = setInterval(async () => {
      if (this.isAuthenticated()) {
        try {
          await this.refreshAccessToken();
        } catch (error) {
          console.warn('Auto token refresh failed:', error);
          // 갱신 실패 시 로그아웃 (상위 클래스에서 처리됨)
        }
      }
    }, refreshInterval);

    // 클린업 함수 반환
    return () => clearInterval(intervalId);
  }

  /**
   * 로그인 상태 변경 감지를 위한 이벤트 시스템
   */
  private listeners: Array<(isAuthenticated: boolean) => void> = [];

  onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void {
    this.listeners.push(callback);

    // 즉시 현재 상태 전달
    callback(this.isAuthenticated());

    // 언구독 함수 반환
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * 인증 상태 변경 알림
   */
  private notifyAuthStateChange(): void {
    const isAuthenticated = this.isAuthenticated();
    this.listeners.forEach(callback => {
      try {
        callback(isAuthenticated);
      } catch (error) {
        console.error('Auth state change callback error:', error);
      }
    });
  }

  // 기존 메서드들을 오버라이드하여 상태 변경 알림 추가
  async loginWithGoogle(accessToken: string) {
    const result = await super.loginWithGoogle(accessToken);
    this.notifyAuthStateChange();
    return result;
  }

  async logout() {
    await super.logout();
    this.notifyAuthStateChange();
  }

  setUser(user: User | null) {
    if (user) {
      super.setUser(user);
    }
    this.notifyAuthStateChange();
  }
}