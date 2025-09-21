// Secure Cookie Service for HttpOnly Cookie Management

import type { CookieOptions } from '../core/types';

export class SecureCookieService {
  private readonly defaultOptions: CookieOptions = {
    path: '/',
    secure: true, // HTTPS에서만 전송
    sameSite: 'strict', // CSRF 보호
    httpOnly: false // JavaScript에서 접근 가능한 쿠키용 (CSRF 토큰 등)
  };

  /**
   * 쿠키 설정 (HttpOnly가 아닌 쿠키만 JavaScript에서 설정 가능)
   * HttpOnly 쿠키는 서버에서만 설정됩니다
   * @param name - 쿠키 이름
   * @param value - 쿠키 값
   * @param options - 쿠키 옵션
   */
  setCookie(name: string, value: string, options: Partial<CookieOptions> = {}): void {
    const cookieOptions = { ...this.defaultOptions, ...options };

    let cookieString = `${name}=${encodeURIComponent(value)}`;

    if (cookieOptions.domain) {
      cookieString += `; Domain=${cookieOptions.domain}`;
    }

    if (cookieOptions.path) {
      cookieString += `; Path=${cookieOptions.path}`;
    }

    if (cookieOptions.expires) {
      cookieString += `; Expires=${cookieOptions.expires.toUTCString()}`;
    }

    if (cookieOptions.maxAge) {
      cookieString += `; Max-Age=${cookieOptions.maxAge}`;
    }

    if (cookieOptions.secure) {
      cookieString += '; Secure';
    }

    if (cookieOptions.httpOnly) {
      console.warn('⚠️ HttpOnly 쿠키는 JavaScript에서 설정할 수 없습니다. 서버에서 설정해야 합니다.');
      return;
    }

    if (cookieOptions.sameSite) {
      cookieString += `; SameSite=${cookieOptions.sameSite}`;
    }

    document.cookie = cookieString;
  }

  /**
   * 쿠키 가져오기 (HttpOnly가 아닌 쿠키만 접근 가능)
   * @param name - 쿠키 이름
   * @returns 쿠키 값 또는 null
   */
  getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * 쿠키 삭제
   * @param name - 쿠키 이름
   * @param options - 쿠키 옵션 (도메인, 경로 등)
   */
  deleteCookie(name: string, options: Partial<CookieOptions> = {}): void {
    const deleteOptions = {
      ...options,
      expires: new Date(0),
      maxAge: 0
    };

    this.setCookie(name, '', deleteOptions);
  }

  /**
   * 모든 애플리케이션 쿠키 삭제
   */
  clearAppCookies(): void {
    const appCookieNames = [
      'open_spot_csrf_token',
      'open_spot_user_preference'
    ];

    appCookieNames.forEach(name => {
      this.deleteCookie(name);
    });
  }

  /**
   * CSRF 토큰 가져오기
   * @returns CSRF 토큰 또는 null
   */
  getCSRFToken(): string | null {
    return this.getCookie('open_spot_csrf_token');
  }

  /**
   * CSRF 토큰 설정
   * @param token - CSRF 토큰
   * @param maxAge - 유효 시간 (초)
   */
  setCSRFToken(token: string, maxAge: number = 24 * 60 * 60): void {
    this.setCookie('open_spot_csrf_token', token, {
      maxAge,
      secure: true,
      sameSite: 'strict'
    });
  }

  /**
   * 사용자 설정 저장 (비민감 정보만)
   * @param preferences - 사용자 설정
   */
  setUserPreferences(preferences: Record<string, unknown>): void {
    this.setCookie('open_spot_user_preference', JSON.stringify(preferences), {
      maxAge: 30 * 24 * 60 * 60, // 30일
      secure: true,
      sameSite: 'lax'
    });
  }

  /**
   * 사용자 설정 가져오기
   * @returns 사용자 설정 또는 null
   */
  getUserPreferences(): Record<string, unknown> | null {
    const preferences = this.getCookie('open_spot_user_preference');
    if (!preferences) return null;

    try {
      return JSON.parse(preferences);
    } catch (error) {
      console.error('Failed to parse user preferences:', error);
      return null;
    }
  }

  /**
   * 쿠키 지원 여부 확인
   * @returns 쿠키 지원 여부
   */
  isCookieSupported(): boolean {
    try {
      const testCookie = '__cookie_test__';
      this.setCookie(testCookie, 'test');
      const supported = this.getCookie(testCookie) === 'test';
      this.deleteCookie(testCookie);
      return supported;
    } catch (error) {
      return false;
    }
  }

  /**
   * 디버그 정보 출력
   */
  debugLog(): void {
    console.group('🍪 Cookie Service Status');
    console.log('Cookie support:', this.isCookieSupported());
    console.log('All cookies:', document.cookie);
    console.log('CSRF token:', this.getCSRFToken());
    console.log('User preferences:', this.getUserPreferences());
    console.groupEnd();
  }
}