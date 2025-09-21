// Authentication Service Interface
import type { User, GoogleLoginResponse } from '../../types';

export interface IAuthService {
  /**
   * Google OAuth 로그인 (Access Token 사용)
   * @param accessToken - Google 액세스 토큰
   * @returns 로그인 응답
   */
  loginWithGoogle(accessToken: string): Promise<GoogleLoginResponse>;

  /**
   * Google OAuth 로그인 (Authorization Code 사용)
   * @param authorizationCode - Google 인증 코드
   * @returns 로그인 응답
   */
  loginWithGoogleCode(authorizationCode: string): Promise<GoogleLoginResponse>;

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
   * 토큰 갱신
   * @returns 새로운 액세스 토큰
   */
  refreshAccessToken(): Promise<string>;

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
   * 토큰 만료 여부 확인
   * @returns 만료 여부
   */
  isTokenExpired(): boolean;

  /**
   * 인증 헤더 가져오기
   * @returns 인증 헤더 객체
   */
  getAuthHeader(): Record<string, string>;

  /**
   * 사용자 정보 저장
   * @param user - 사용자 정보
   */
  setUser(user: User): void;

  /**
   * 사용자 정보 가져오기
   * @returns 사용자 정보 또는 null
   */
  getUser(): User | null;

  /**
   * CSRF 토큰 가져오기
   * @returns CSRF 토큰 또는 null
   */
  getCSRFToken(): string | null;

  /**
   * CSRF 토큰 설정
   * @param token - CSRF 토큰
   */
  setCSRFToken(token: string): void;
}