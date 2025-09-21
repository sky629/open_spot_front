// Dependency Injection Container Interface

export interface IContainer {
  /**
   * 서비스를 컨테이너에 등록합니다
   * @param token - 서비스 식별자
   * @param implementation - 서비스 구현체 또는 팩토리 함수
   * @param singleton - 싱글톤 여부 (기본값: true)
   */
  register<T>(
    token: string | symbol,
    implementation: T | (() => T),
    singleton?: boolean
  ): void;

  /**
   * 등록된 서비스를 해결하여 반환합니다
   * @param token - 서비스 식별자
   * @returns 해결된 서비스 인스턴스
   */
  resolve<T>(token: string | symbol): T;

  /**
   * 서비스가 등록되어 있는지 확인합니다
   * @param token - 서비스 식별자
   * @returns 등록 여부
   */
  isRegistered(token: string | symbol): boolean;

  /**
   * 등록된 서비스를 제거합니다
   * @param token - 서비스 식별자
   */
  unregister(token: string | symbol): void;

  /**
   * 모든 서비스를 제거합니다
   */
  clear(): void;
}