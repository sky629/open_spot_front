// 성능 모니터링 유틸리티

import { logger } from './logger';

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

interface WebVitalsMetrics {
  FCP?: number; // First Contentful Paint
  LCP?: number; // Largest Contentful Paint
  FID?: number; // First Input Delay
  CLS?: number; // Cumulative Layout Shift
  TTFB?: number; // Time to First Byte
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private webVitals: WebVitalsMetrics = {};
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = false; // 성능 모니터링 완전 비활성화

    if (this.isEnabled) {
      this.initializeWebVitalsTracking();
      this.setupPerformanceObserver();
    }
  }

  // 성능 측정 시작
  mark(name: string, metadata?: Record<string, unknown>): void {
    if (!this.isEnabled) return;

    const startTime = performance.now();

    this.metrics.set(name, {
      name,
      startTime,
      metadata
    });

    logger.debug(`Performance mark started: ${name}`, metadata);
  }

  // 성능 측정 완료
  measure(name: string, additionalMetadata?: Record<string, unknown>): number | null {
    if (!this.isEnabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      logger.warn(`Performance mark not found: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    const updatedMetric: PerformanceMetrics = {
      ...metric,
      endTime,
      duration,
      metadata: { ...metric.metadata, ...additionalMetadata }
    };

    this.metrics.set(name, updatedMetric);

    // 로그 출력
    logger.performance(name, duration);

    // 성능 임계값 체크
    this.checkPerformanceThresholds(name, duration, updatedMetric.metadata);

    return duration;
  }

  // 함수 실행 성능 측정
  measureFunction<T>(name: string, fn: () => T, metadata?: Record<string, unknown>): T {
    if (!this.isEnabled) return fn();

    this.mark(name, metadata);
    const result = fn();
    this.measure(name);

    return result;
  }

  // 비동기 함수 실행 성능 측정
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    if (!this.isEnabled) return fn();

    this.mark(name, metadata);
    const result = await fn();
    this.measure(name);

    return result;
  }

  // 렌더링 성능 측정
  measureRender(componentName: string): {
    start: () => void;
    end: () => void;
  } {
    const measureName = `render:${componentName}`;

    return {
      start: () => this.mark(measureName, { type: 'render', component: componentName }),
      end: () => this.measure(measureName)
    };
  }

  // API 호출 성능 측정
  measureApi(url: string, method: string): {
    start: () => void;
    end: (status?: number, size?: number) => void;
  } {
    const measureName = `api:${method}:${url}`;

    return {
      start: () => this.mark(measureName, { type: 'api', url, method }),
      end: (status?: number, size?: number) => {
        this.measure(measureName, { status, responseSize: size });
      }
    };
  }

  // Web Vitals 추적 초기화
  private initializeWebVitalsTracking(): void {
    // First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.name === 'first-contentful-paint') {
              this.webVitals.FCP = entry.startTime;
              logger.performance('FCP (First Contentful Paint)', entry.startTime);
            }
          });
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (error) {
        logger.warn('Failed to observe paint metrics', error);
      }
    }

    // Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        const [navigation] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];

        if (navigation) {
          this.webVitals.TTFB = navigation.responseStart - navigation.requestStart;
          logger.performance('TTFB (Time to First Byte)', this.webVitals.TTFB);

          // 페이지 로드 메트릭스 로깅
          const loadMetrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
            load: navigation.loadEventEnd - navigation.startTime,
            domInteractive: navigation.domInteractive - navigation.startTime,
          };

          Object.entries(loadMetrics).forEach(([metric, value]) => {
            logger.performance(`Page ${metric}`, value);
          });
        }
      });
    }
  }

  // Performance Observer 설정
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      // Largest Contentful Paint 관찰
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;

        if (lastEntry) {
          this.webVitals.LCP = lastEntry.startTime;
          logger.performance('LCP (Largest Contentful Paint)', lastEntry.startTime);
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Cumulative Layout Shift 관찰
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry: PerformanceEntry & { value?: number; hadRecentInput?: boolean }) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value || 0;
          }
        });

        if (clsValue > 0) {
          this.webVitals.CLS = (this.webVitals.CLS || 0) + clsValue;
          logger.performance('CLS (Cumulative Layout Shift)', this.webVitals.CLS);
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // First Input Delay 관찰
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: PerformanceEntry & { processingStart?: number }) => {
          this.webVitals.FID = (entry.processingStart || 0) - entry.startTime;
          logger.performance('FID (First Input Delay)', this.webVitals.FID);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

    } catch (error) {
      logger.warn('Failed to setup performance observers', error);
    }
  }

  // 성능 임계값 체크
  private checkPerformanceThresholds(
    name: string,
    duration: number,
    metadata?: Record<string, unknown>
  ): void {
    const thresholds = {
      api: 2000,        // API 호출: 2초
      render: 16,       // 렌더링: 16ms (60fps)
      interaction: 100, // 상호작용: 100ms
      navigation: 3000, // 페이지 네비게이션: 3초
    };

    let threshold = 1000; // 기본값

    // 타입별 임계값 설정
    if (metadata?.type) {
      threshold = thresholds[metadata.type as keyof typeof thresholds] || threshold;
    }

    if (duration > threshold) {
      logger.warn(`Performance threshold exceeded: ${name}`, {
        duration,
        threshold,
        metadata
      });
    }
  }

  // 현재 성능 메트릭스 가져오기
  getMetrics(): {
    measurements: PerformanceMetrics[];
    webVitals: WebVitalsMetrics;
    memory?: {
      usedJSHeapSize?: number;
      totalJSHeapSize?: number;
      jsHeapSizeLimit?: number;
    };
  } {
    return {
      measurements: Array.from(this.metrics.values()),
      webVitals: this.webVitals,
      memory: (performance as Performance & { memory?: { usedJSHeapSize?: number; totalJSHeapSize?: number; jsHeapSizeLimit?: number } }).memory || undefined
    };
  }

  // 성능 리포트 생성
  generateReport(): string {
    const metrics = this.getMetrics();

    const report = {
      timestamp: new Date().toISOString(),
      webVitals: metrics.webVitals,
      slowestOperations: metrics.measurements
        .filter(m => m.duration !== undefined)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 10),
      memory: metrics.memory,
      userAgent: navigator.userAgent,
    };

    logger.info('Performance report generated', report);
    return JSON.stringify(report, null, 2);
  }

  // 메트릭스 초기화
  clearMetrics(): void {
    this.metrics.clear();
    this.webVitals = {};
    logger.info('Performance metrics cleared');
  }
}

// 싱글톤 인스턴스 생성
export const performanceMonitor = new PerformanceMonitor();

// 개발 모드에서 전역 접근 가능하도록 설정
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as typeof window & { performanceMonitor: PerformanceMonitor }).performanceMonitor = performanceMonitor;
}