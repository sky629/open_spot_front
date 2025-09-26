// Store Setup and Service Injection

import { setAuthServiceForStore } from './auth';
import { setLocationServiceForStore } from './location';
import type { IAuthServiceFull, ILocationService } from '../core/interfaces';

/**
 * 모든 스토어에 서비스 의존성을 주입합니다
 * @param services - 주입할 서비스들
 */
export const setupStores = (services: {
  authService: IAuthServiceFull;
  locationService: ILocationService;
}) => {
  // Auth Store에 서비스 주입
  setAuthServiceForStore(services.authService);

  // Location Store에 서비스 주입
  setLocationServiceForStore(services.locationService);

  console.log('✅ All stores configured with services');
};

/**
 * 개발 모드에서 스토어 디버깅 정보 출력
 */
export const debugStores = () => {
  if (import.meta.env.DEV) {
    console.group('🏪 Store Debug Information');

    // Zustand devtools에서 확인 가능한 스토어들
    console.log('Available stores:');
    console.log('- auth-store (Authentication)');
    console.log('- location-store (Locations)');

    console.log('💡 Use Redux DevTools to inspect store states');
    console.groupEnd();
  }
};

/**
 * 모든 스토어 초기화
 */
export const resetAllStores = () => {
  // 동적 import를 통해 스토어들을 가져와서 reset 호출
  import('./auth').then(({ useAuthStore }) => {
    useAuthStore.getState().reset();
  });

  import('./location').then(({ useLocationStore }) => {
    useLocationStore.getState().reset();
  });

  console.log('🔄 All stores reset');
};