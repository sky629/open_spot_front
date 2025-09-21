// Service Registration and DI Container Setup

import { container, SERVICE_TOKENS } from '../core/container';
import { SecureApiClient } from '../services/SecureApiClient';
import { SecureCookieService } from '../services/SecureCookieService';
import { AuthServiceImpl } from '../features/auth/services';
import { LocationService } from '../services';
import { API_CONFIG } from '../constants';
import { setupStores } from '../stores/setup';
import { logger } from '../utils/logger';

/**
 * 모든 서비스를 DI 컨테이너에 등록합니다
 */
export const registerServices = (): void => {
  // 이미 등록되었다면 스킵
  if (isServiceRegistered) {
    logger.debug('Services already registered, skipping...');
    return;
  }

  logger.info('🔧 Starting service registration...');

  try {
    // 1. 쿠키 서비스 등록 (다른 서비스들의 의존성)
    container.register(
      SERVICE_TOKENS.COOKIE_SERVICE,
      () => new SecureCookieService(),
      true // 싱글톤
    );

    // 2. API 클라이언트 등록
    container.register(
      SERVICE_TOKENS.API_CLIENT,
      () => new SecureApiClient({
        baseURL: API_CONFIG.BASE_URL,
        timeout: API_CONFIG.TIMEOUT,
        withCredentials: true,
        csrf: {
          headerName: 'X-CSRF-Token',
          cookieName: 'open_spot_csrf_token',
          enabled: true
        }
      }),
      true // 싱글톤
    );

    // 3. 인증 서비스 등록
    container.register(
      SERVICE_TOKENS.AUTH_SERVICE,
      () => {
        const authService = new AuthServiceImpl();
        const apiClient = container.resolve(SERVICE_TOKENS.API_CLIENT);

        // 인증 서비스에 API 클라이언트 주입
        authService.setApiClient(apiClient);

        // API 클라이언트에 인증 서비스 주입 (순환 참조 해결)
        (apiClient as any).setAuthService(authService);

        return authService;
      },
      true // 싱글톤
    );

    // 4. 위치 서비스 등록
    container.register(
      SERVICE_TOKENS.LOCATION_SERVICE,
      () => new LocationService(),
      true // 싱글톤
    );

    // 5. 로거 등록 (기존 logger 인스턴스 재사용)
    container.register(
      SERVICE_TOKENS.LOGGER,
      () => logger,
      true // 싱글톤
    );

    isServiceRegistered = true;
    logger.info('✅ All services registered successfully');

    // 개발 모드에서 컨테이너 상태 로깅
    if (import.meta.env.DEV) {
      container.debugLog();
    }

  } catch (error) {
    logger.error('❌ Service registration failed', error);
    throw error;
  }
};

// 중복 실행 방지를 위한 플래그들
let isStoreConfigured = false;
let isServiceRegistered = false;

/**
 * 등록된 서비스들을 스토어에 주입합니다
 */
export const configureStores = (): void => {
  logger.info('🏪 Configuring stores with services...');

  // 이미 설정되었다면 스킵
  if (isStoreConfigured) {
    logger.debug('Stores already configured, skipping...');
    return;
  }

  try {
    const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE) as any;
    const locationService = container.resolve(SERVICE_TOKENS.LOCATION_SERVICE);

    // 직접 동기적으로 실행하여 무한 루프 방지
    setupStores({
      authService,
      locationService
    });

    isStoreConfigured = true;
    logger.info('✅ Stores configured successfully');

  } catch (error) {
    logger.error('❌ Store configuration failed', error);
    throw error;
  }
};

/**
 * 애플리케이션 초기화 시 필요한 모든 설정을 수행합니다
 */
export const initializeApplication = async (): Promise<void> => {
  logger.info('🚀 Initializing application...');

  try {
    // 1. 서비스 등록
    registerServices();

    // 2. 스토어 설정
    configureStores();

    // 3. 인증 서비스 자동 로그인 시도
    const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE) as any;
    const autoLoginSuccessful = await authService.attemptAutoLogin();

    if (autoLoginSuccessful) {
      // 자동 로그인 성공 시 Zustand 스토어에도 사용자 정보 설정
      const savedUser = authService.getUser();
      if (savedUser) {
        // 동적 import로 순환 참조 방지
        const { useAuthStore } = await import('../stores/auth');
        useAuthStore.getState().setUser(savedUser);
        logger.info('✅ Auto login successful and user data synced to store');
      }
    } else {
      logger.info('ℹ️ No existing authentication found');
    }

    // 4. 자동 토큰 갱신 설정
    authService.setupAutoTokenRefresh();

    logger.info('🎉 Application initialized successfully');

  } catch (error) {
    logger.error('💥 Application initialization failed', error);
    throw error;
  }
};

/**
 * 애플리케이션 종료 시 정리 작업
 */
export const cleanupApplication = (): void => {
  logger.info('🧹 Cleaning up application...');

  try {
    // 컨테이너 정리
    container.clear();

    // 플래그들 리셋
    isStoreConfigured = false;
    isServiceRegistered = false;

    logger.info('✅ Application cleanup completed');

  } catch (error) {
    logger.error('❌ Application cleanup failed', error);
  }
};

/**
 * 서비스 인스턴스를 가져오는 헬퍼 함수들
 */
export const getAuthService = () => container.resolve(SERVICE_TOKENS.AUTH_SERVICE);
export const getApiClient = () => container.resolve(SERVICE_TOKENS.API_CLIENT);
export const getLocationService = () => container.resolve(SERVICE_TOKENS.LOCATION_SERVICE);
export const getCookieService = () => container.resolve(SERVICE_TOKENS.COOKIE_SERVICE);