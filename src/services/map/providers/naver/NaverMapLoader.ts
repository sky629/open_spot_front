import { IMapLoader, MapProvider } from '../../../../core/interfaces/IMapService';
import { logger } from '../../../../utils/logger';

export class NaverMapLoader implements IMapLoader {
  private static isLoading = false;
  private static isLoaded = false;

  async loadMapAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우
      if (NaverMapLoader.isLoaded && window.naver && window.naver.maps) {
        resolve();
        return;
      }

      // 이미 로딩 중인 경우
      if (NaverMapLoader.isLoading) {
        const checkLoaded = () => {
          if (NaverMapLoader.isLoaded && window.naver && window.naver.maps) {
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
        return;
      }

      const clientId = __NAVER_MAP_CLIENT_ID__;
      logger.info('🗺️ Naver Maps Client ID:', clientId);

      if (!clientId) {
        logger.error('❌ 네이버 지도 API 클라이언트 ID가 설정되지 않았습니다.');
        reject(new Error('네이버 지도 API 클라이언트 ID가 설정되지 않았습니다.'));
        return;
      }

      NaverMapLoader.isLoading = true;

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;

      script.onload = () => {
        NaverMapLoader.isLoaded = true;
        NaverMapLoader.isLoading = false;
        if (window.naver && window.naver.maps) {
          logger.info('Naver Maps API loaded successfully');
          resolve();
        } else {
          logger.error('Naver Maps API failed to initialize');
          reject(new Error('네이버 지도 API 초기화에 실패했습니다.'));
        }
      };

      script.onerror = () => {
        NaverMapLoader.isLoading = false;
        logger.error('Failed to load Naver Maps API script');
        reject(new Error('네이버 지도 API 스크립트 로드에 실패했습니다.'));
      };

      document.head.appendChild(script);
    });
  }

  isLoaded(): boolean {
    return NaverMapLoader.isLoaded && !!window.naver && !!window.naver.maps;
  }

  getProvider(): MapProvider {
    return MapProvider.NAVER;
  }
}