// Auth Service Implementation for Feature Module
// Orval 기반으로 완전 마이그레이션됨

import { AuthService } from './authService';
import type { IAuthServiceFull } from '../../../core/interfaces';
import type { User } from '../../../types';
import { useAuthStore } from '../../../stores/auth';

/**
 * Auth Feature용 서비스 구현체
 * AuthService(Orval 기반)를 래핑하여 DI 컨테이너 호환성 제공
 */
export class AuthServiceImpl implements IAuthServiceFull {
  private authService: AuthService;
  private _hasLoggedNoUserData = false;

  constructor() {
    this.authService = new AuthService();
  }

  // IApiClient 인터페이스 호환을 위한 메서드 (더 이상 사용하지 않음)
  setApiClient(): void {
    // Orval axios-instance가 자동으로 처리하므로 아무것도 하지 않음
  }

  /**
   * User 정보 저장 (Zustand store에 위임)
   */
  setUser(user: User | null): void {
    useAuthStore.getState().setUser(user);
  }

  /**
   * User 정보 조회 (Zustand store에서 가져옴)
   */
  getUser(): User | null {
    return useAuthStore.getState().user;
  }

  /**
   * 자동 로그인 시도 (HttpOnly Cookie 방식)
   * User는 Zustand persist에서 자동 복원됨
   * 쿠키 유효성은 백엔드 API 호출 시 자동 확인됨
   */
  async attemptAutoLogin(): Promise<boolean> {
    try {
      // Zustand persist가 자동으로 user를 복원함
      const savedUser = useAuthStore.getState().user;

      if (savedUser) {
        // User가 있으면 백엔드에서 쿠키 유효성 확인
        try {
          const updatedUser = await this.authService.getUserProfile();
          this.setUser(updatedUser);
          console.log('✅ Auto login successful - cookie valid');
          return true;
        } catch (error) {
          // 쿠키 만료/무효 - user 제거
          console.warn('Cookie expired or invalid, clearing user');
          this.setUser(null);
          return false;
        }
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

  // HttpOnly Cookie 방식에서는 토큰 자동 갱신 불필요
  // 백엔드가 API 응답마다 Set-Cookie로 자동 갱신함

  /**
   * 로그인 상태 변경 감지를 위한 이벤트 시스템
   */
  private listeners: Array<(isAuthenticated: boolean) => void> = [];

  onAuthStateChange(callback: (isAuthenticated: boolean) => void): () => void {
    this.listeners.push(callback);

    // 즉시 현재 상태 전달
    callback(this.authService.isAuthenticated());

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
    const isAuthenticated = this.authService.isAuthenticated();
    this.listeners.forEach(callback => {
      try {
        callback(isAuthenticated);
      } catch (error) {
        console.error('Auth state change callback error:', error);
      }
    });
  }

  // AuthService 메서드들을 위임
  async setUserFromToken(token: string) {
    const result = await this.authService.setUserFromToken(token);
    // User를 store에 저장
    this.setUser(result.user);
    this.notifyAuthStateChange();
    return result;
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  async refreshAccessToken(): Promise<{ access_token: string }> {
    const result = await this.authService.refreshAccessToken();
    this.notifyAuthStateChange();
    return result;
  }

  async getUserProfile(): Promise<User> {
    const user = await this.authService.getUserProfile();
    // User를 store에 저장
    this.setUser(user);
    return user;
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    // User와 accessToken을 store에서 제거
    this.setUser(null);
    useAuthStore.getState().setAccessToken(null);
    this.notifyAuthStateChange();
  }

  getAuthHeader(): Record<string, never> {
    return this.authService.getAuthHeader();
  }
}