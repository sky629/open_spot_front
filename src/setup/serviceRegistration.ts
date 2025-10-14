// Service Registration and DI Container Setup
// Orval 기반으로 완전 마이그레이션됨

import { container, SERVICE_TOKENS } from '../core/container';
import { SecureCookieService } from '../services/SecureCookieService';
import { AuthServiceImpl } from '../features/auth/services';
import { LocationService } from '../services';
import { GroupService } from '../services/groupService';
import { CategoryService } from '../services/categoryService';
import { MapServiceFactory } from '../services/map';
import { setupStores } from '../stores/setup';
import { logger } from '../utils/logger';
import type { ILocationService, IAuthServiceFull, IGroupService, ICategoryService } from '../core/interfaces';

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

    // 2. 인증 서비스 등록 (Orval 기반 - API 클라이언트 주입 불필요)
    container.register(
      SERVICE_TOKENS.AUTH_SERVICE,
      () => new AuthServiceImpl(),
      true // 싱글톤
    );

    // 3. 위치 서비스 등록 (Orval 기반)
    container.register(
      SERVICE_TOKENS.LOCATION_SERVICE,
      () => new LocationService(),
      true // 싱글톤
    );

    // 4. 그룹 서비스 등록 (Orval 기반)
    container.register(
      SERVICE_TOKENS.GROUP_SERVICE,
      () => new GroupService(),
      true // 싱글톤
    );

    // 5. 카테고리 서비스 등록 (Orval 기반)
    container.register(
      SERVICE_TOKENS.CATEGORY_SERVICE,
      () => new CategoryService(),
      true // 싱글톤
    );

    // 6. 맵 서비스 팩토리 등록
    container.register(
      SERVICE_TOKENS.MAP_SERVICE_FACTORY,
      () => MapServiceFactory.getInstance(),
      true // 싱글톤
    );

    // 7. 로거 등록 (기존 logger 인스턴스 재사용)
    container.register(
      SERVICE_TOKENS.LOGGER,
      () => logger,
      true // 싱글톤
    );

    isServiceRegistered = true;
    logger.info('✅ All services registered successfully (Orval-based)');

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
    const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE) as IAuthServiceFull;
    const locationService = container.resolve(SERVICE_TOKENS.LOCATION_SERVICE) as ILocationService;
    const groupService = container.resolve(SERVICE_TOKENS.GROUP_SERVICE) as IGroupService;
    const categoryService = container.resolve(SERVICE_TOKENS.CATEGORY_SERVICE) as ICategoryService;

    // 직접 동기적으로 실행하여 무한 루프 방지
    setupStores({
      authService,
      locationService,
      groupService,
      categoryService
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

    // 3. 인증 서비스 자동 로그인 시도 (HttpOnly Cookie 유효성 확인)
    const authService = container.resolve(SERVICE_TOKENS.AUTH_SERVICE) as IAuthServiceFull;
    const autoLoginSuccessful = await (authService as IAuthServiceFull & { attemptAutoLogin?: () => Promise<boolean> }).attemptAutoLogin?.();

    if (autoLoginSuccessful) {
      logger.info('✅ Auto login successful - cookie is valid');
    } else {
      logger.info('ℹ️ No existing authentication or cookie expired');
    }

    // HttpOnly Cookie 방식에서는 자동 토큰 갱신 불필요
    // 백엔드가 API 응답마다 Set-Cookie로 자동 갱신함

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
export const getLocationService = (): ILocationService => container.resolve(SERVICE_TOKENS.LOCATION_SERVICE) as ILocationService;
export const getGroupService = (): IGroupService => container.resolve(SERVICE_TOKENS.GROUP_SERVICE) as IGroupService;
export const getCategoryService = (): ICategoryService => container.resolve(SERVICE_TOKENS.CATEGORY_SERVICE) as ICategoryService;
export const getCookieService = () => container.resolve(SERVICE_TOKENS.COOKIE_SERVICE);
export const getMapServiceFactory = () => container.resolve(SERVICE_TOKENS.MAP_SERVICE_FACTORY);