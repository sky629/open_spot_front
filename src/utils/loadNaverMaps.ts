// 네이버 지도 API 동적 로드 유틸리티

import { logger } from './logger';

let isLoading = false;
let isLoaded = false;

export const loadNaverMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (isLoaded && window.naver && window.naver.maps) {
      resolve();
      return;
    }

    // 이미 로딩 중인 경우
    if (isLoading) {
      const checkLoaded = () => {
        if (isLoaded && window.naver && window.naver.maps) {
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    const clientId = __VITE_NAVER_MAP_CLIENT_ID__;
    logger.info('🗺️ Naver Maps Client ID:', clientId);

    if (!clientId) {
      logger.error('❌ 네이버 지도 API 클라이언트 ID가 설정되지 않았습니다.');
      reject(new Error('네이버 지도 API 클라이언트 ID가 설정되지 않았습니다.'));
      return;
    }

    isLoading = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    // Geocoder 서브모듈 추가로 Reverse Geocoding 지원
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;

    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      if (window.naver && window.naver.maps) {
        logger.info('Naver Maps API loaded successfully');
        resolve();
      } else {
        logger.error('Naver Maps API failed to initialize');
        reject(new Error('네이버 지도 API 초기화에 실패했습니다.'));
      }
    };

    script.onerror = () => {
      isLoading = false;
      logger.error('Failed to load Naver Maps API script');
      reject(new Error('네이버 지도 API 스크립트 로드에 실패했습니다.'));
    };

    document.head.appendChild(script);
  });
};