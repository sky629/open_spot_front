// Simple Dependency Injection Container Implementation

import type { IContainer } from '../interfaces/IContainer';

interface ServiceRegistration<T = unknown> {
  implementation: T | (() => T);
  singleton: boolean;
  instance?: T;
}

export class Container implements IContainer {
  private services = new Map<string | symbol, ServiceRegistration>();

  register<T>(
    token: string | symbol,
    implementation: T | (() => T),
    singleton: boolean = true
  ): void {
    if (this.services.has(token)) {
      console.warn(`Service ${String(token)} is already registered. Overwriting...`);
    }

    this.services.set(token, {
      implementation,
      singleton,
      instance: undefined
    });
  }

  resolve<T>(token: string | symbol): T {
    const service = this.services.get(token);

    if (!service) {
      throw new Error(`Service ${String(token)} is not registered`);
    }

    // 싱글톤이고 이미 인스턴스가 있는 경우 반환
    if (service.singleton && service.instance) {
      return service.instance as T;
    }

    // 팩토리 함수인 경우 실행하여 인스턴스 생성
    let instance: T;
    if (typeof service.implementation === 'function') {
      instance = (service.implementation as () => T)();
    } else {
      instance = service.implementation as T;
    }

    // 싱글톤인 경우 인스턴스 캐시
    if (service.singleton) {
      service.instance = instance;
    }

    return instance;
  }

  isRegistered(token: string | symbol): boolean {
    return this.services.has(token);
  }

  unregister(token: string | symbol): void {
    this.services.delete(token);
  }

  clear(): void {
    this.services.clear();
  }

  /**
   * 등록된 모든 서비스 토큰 목록을 반환합니다
   * @returns 서비스 토큰 배열
   */
  getRegisteredTokens(): (string | symbol)[] {
    return Array.from(this.services.keys());
  }

  /**
   * 컨테이너의 현재 상태를 로깅합니다 (디버깅용)
   */
  debugLog(): void {
    console.group('🔧 DI Container Status');
    console.log('Registered services:', this.services.size);

    for (const [token, service] of this.services.entries()) {
      console.log(`- ${String(token)}:`, {
        singleton: service.singleton,
        hasInstance: !!service.instance,
        implementationType: typeof service.implementation
      });
    }

    console.groupEnd();
  }
}