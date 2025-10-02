/**
 * Cookie 유틸리티 함수
 * document.cookie에서 특정 쿠키 값을 읽거나 설정
 */

/**
 * 쿠키 값 가져오기
 * @param name 쿠키 이름
 * @returns 쿠키 값 (없으면 null)
 */
export function getCookie(name: string): string | null {
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return matches ? decodeURIComponent(matches[1]) : null;
}

/**
 * Access Token 쿠키 가져오기
 * @returns access_token 값 (없으면 null)
 */
export function getAccessTokenFromCookie(): string | null {
  return getCookie('access_token');
}

/**
 * 쿠키 설정
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param options 쿠키 옵션
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
): void {
  const {
    maxAge,
    path = '/',
    domain,
    secure = true,
    sameSite = 'Lax',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (maxAge !== undefined) {
    cookieString += `; max-age=${maxAge}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += '; secure';
  }

  cookieString += `; samesite=${sameSite}`;

  document.cookie = cookieString;
}

/**
 * 쿠키 삭제
 * @param name 쿠키 이름
 * @param options 쿠키 옵션 (path, domain)
 */
export function deleteCookie(
  name: string,
  options: {
    path?: string;
    domain?: string;
  } = {}
): void {
  setCookie(name, '', {
    ...options,
    maxAge: -1,
  });
}
