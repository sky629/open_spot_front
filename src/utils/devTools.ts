// 개발 전용 디버깅 도구

import { logger } from './logger';

interface DebugInfo {
  environment: string;
  userAgent: string;
  viewport: { width: number; height: number };
  timestamp: string;
  performance: {
    memory?: {
      usedJSHeapSize?: number;
      totalJSHeapSize?: number;
      jsHeapSizeLimit?: number;
    };
    navigation?: PerformanceNavigationTiming;
  };
}

class DevTools {
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = import.meta.env.DEV;

    if (this.isEnabled) {
      this.initializeDevTools();
    }
  }

  private initializeDevTools(): void {
    // 개발 모드에서만 실행
    if (typeof window === 'undefined') return;

    // 전역 디버그 함수 등록
    (window as typeof window & {
      debug: {
        logger: typeof logger;
        getDebugInfo: () => DebugInfo;
        exportLogs: () => void;
        clearLogs: () => void;
        testApiConnection: () => Promise<void>;
        inspectComponent: (element: HTMLElement) => void;
        measurePerformance: <T>(operation: string, fn: () => T) => T;
      };
    }).debug = {
      logger: logger,
      getDebugInfo: this.getDebugInfo.bind(this),
      exportLogs: this.exportLogs.bind(this),
      clearLogs: this.clearLogs.bind(this),
      testApiConnection: this.testApiConnection.bind(this),
      inspectComponent: this.inspectComponent.bind(this),
      measurePerformance: this.measurePerformance.bind(this),
    };

    // 성능 관찰자 설정
    this.setupPerformanceObserver();

    // 에러 캐처 설정
    this.setupGlobalErrorHandler();
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            logger.performance('Page load', entry.duration);
          } else if (entry.entryType === 'measure') {
            logger.performance(entry.name, entry.duration);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['navigation', 'measure'] });
      } catch (error) {
        logger.warn('Performance observer setup failed', error);
      }
    }
  }

  private setupGlobalErrorHandler(): void {
    window.addEventListener('error', (event) => {
      logger.error('Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled promise rejection', event.reason);
    });
  }

  getDebugInfo(): DebugInfo {
    const info: DebugInfo = {
      environment: import.meta.env.MODE,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString(),
      performance: {}
    };

    // 성능 정보 수집
    if ('performance' in window) {
      if ((performance as Performance & { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory) {
        info.performance.memory = (performance as Performance & { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory;
      }

      if (performance.getEntriesByType) {
        const navigationEntries = performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          info.performance.navigation = navigationEntries[0] as PerformanceNavigationTiming;
        }
      }
    }

    return info;
  }

  exportLogs(): void {
    const debugInfo = this.getDebugInfo();
    const exportData = {
      debugInfo,
      timestamp: new Date().toISOString(),
      logs: 'Check console for detailed logs'
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `debug-logs-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    logger.info('Debug logs exported');
  }

  clearLogs(): void {
    console.clear();
    logger.info('Console cleared');
  }

  async testApiConnection(): Promise<void> {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    logger.info('Testing API connection', { baseUrl });

    try {
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        logger.info('API connection successful', {
          status: response.status,
          statusText: response.statusText
        });
      } else {
        logger.warn('API connection failed', {
          status: response.status,
          statusText: response.statusText
        });
      }
    } catch (error) {
      logger.error('API connection error', error);
    }
  }

  inspectComponent(element: HTMLElement): void {
    if (!element) {
      logger.warn('No element provided for inspection');
      return;
    }

    const info = {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      dataset: element.dataset,
      boundingRect: element.getBoundingClientRect(),
      styles: window.getComputedStyle(element)
    };

    logger.debug('Component inspection', info);

    // 브라우저 개발자 도구에서 쉽게 접근할 수 있도록
    (window as typeof window & { $inspected: HTMLElement }).$inspected = element;
    logger.info('Element stored in window.$inspected');
  }

  measurePerformance<T>(operation: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    logger.performance(operation, duration);
    return result;
  }

  // React DevTools 설치 체크
  checkReactDevTools(): void {
    if (typeof window !== 'undefined') {
      const hasReactDevTools = !!(window as typeof window & { __REACT_DEVTOOLS_GLOBAL_HOOK__?: unknown }).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      // DevTools 존재 여부만 체크 (로그 없이)
      return;
    }
  }
}

// 싱글톤 인스턴스 생성
export const devTools = new DevTools();

// 개발 모드에서만 React DevTools 체크
if (import.meta.env.DEV) {
  // DOM이 로드된 후 실행
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        devTools.checkReactDevTools();
      });
    } else {
      devTools.checkReactDevTools();
    }
  }
}