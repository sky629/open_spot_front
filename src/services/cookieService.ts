// HttpOnly 쿠키 기반 토큰 저장 서비스

import { logger } from '../utils/logger';

interface CookieConfig {
  path: string;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  domain?: string;
}

class CookieService {
  private readonly defaultConfig: CookieConfig;

  constructor() {
    this.defaultConfig = {
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'lax',
      // domain은 개발 환경에서는 설정하지 않음
    };
  }

  // 쿠키 설정 (일반 쿠키 - HttpOnly는 서버에서만 설정 가능)
  setCookie(name: string, value: string, maxAge?: number): void {
    try {
      const config = this.defaultConfig;
      let cookieString = `${name}=${encodeURIComponent(value)}`;

      cookieString += `; path=${config.path}`;
      cookieString += `; SameSite=${config.sameSite}`;

      if (config.secure) {
        cookieString += '; Secure';
      }

      if (config.domain) {
        cookieString += `; Domain=${config.domain}`;
      }

      if (maxAge) {
        cookieString += `; Max-Age=${maxAge}`;
      }

      document.cookie = cookieString;
      logger.info(`Cookie set: ${name}`);
    } catch (error) {
      logger.error(`Failed to set cookie: ${name}`, error);
    }
  }

  // 쿠키 읽기
  getCookie(name: string): string | null {
    try {
      const nameEQ = name + '=';
      const cookies = document.cookie.split(';');

      for (let cookie of cookies) {
        cookie = cookie.trim();
        if (cookie.indexOf(nameEQ) === 0) {
          const value = cookie.substring(nameEQ.length);
          return decodeURIComponent(value);
        }
      }
      return null;
    } catch (error) {
      logger.error(`Failed to get cookie: ${name}`, error);
      return null;
    }
  }

  // 쿠키 삭제
  removeCookie(name: string): void {
    try {
      const config = this.defaultConfig;
      let cookieString = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC`;

      cookieString += `; path=${config.path}`;

      if (config.domain) {
        cookieString += `; Domain=${config.domain}`;
      }

      document.cookie = cookieString;
      logger.info(`Cookie removed: ${name}`);
    } catch (error) {
      logger.error(`Failed to remove cookie: ${name}`, error);
    }
  }

  // 모든 앱 관련 쿠키 삭제
  clearAppCookies(): void {
    const appCookieNames = [
      'open_spot_user',
      'open_spot_session',
      'open_spot_expires_at'
    ];

    appCookieNames.forEach(name => {
      this.removeCookie(name);
    });

    logger.info('All app cookies cleared');
  }

  // 쿠키 사용 가능 여부 확인
  isCookieSupported(): boolean {
    try {
      const testCookie = 'test_cookie_support';
      this.setCookie(testCookie, 'test');
      const isSupported = this.getCookie(testCookie) === 'test';
      this.removeCookie(testCookie);
      return isSupported;
    } catch {
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
export const cookieService = new CookieService();