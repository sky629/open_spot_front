// Authentication Service Interface
import type { User, GoogleLoginResponse } from '../../types';

export interface IAuthService {
  /**
   * JWT 토큰으로부터 사용자 설정
   * @param token - JWT 토큰
   * @returns 로그인 응답
   */
  setUserFromToken(token: string): Promise<GoogleLoginResponse>;

  /**
   * 사용자 프로필 조회
   * @returns 사용자 정보
   */
  getUserProfile(): Promise<User>;

  /**
   * 토큰 갱신 (Hybrid 방식)
   * @returns 새로운 access_token (refresh_token은 HttpOnly Cookie로 자동 처리)
   */
  refreshAccessToken(): Promise<{ access_token: string }>;

  /**
   * 로그아웃
   */
  logout(): Promise<void>;

  /**
   * 인증 상태 확인
   * @returns 인증 여부
   */
  isAuthenticated(): boolean;

  /**
   * 인증 헤더 가져오기 (HttpOnly Cookie 방식에서는 빈 객체 반환)
   * @returns 인증 헤더 객체
   */
  getAuthHeader(): Record<string, never>;

  /**
   * 사용자 정보 저장
   * @param user - 사용자 정보
   */
  setUser(user: User | null): void;

  /**
   * 사용자 정보 가져오기
   * @returns 사용자 정보 또는 null
   */
  getUser(): User | null;
}