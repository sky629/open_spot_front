// 강화된 로깅 유틸리티

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

interface LoggerConfig {
  level: LogLevel;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableSource: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    this.config = {
      level: LogLevel.ERROR, // 오류만 표시하도록 변경
      enableColors: import.meta.env.DEV,
      enableTimestamp: true,
      enableSource: import.meta.env.DEV,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  private formatMessage(level: LogLevel, message: string, source?: string): string {
    let formatted = '';

    // 타임스탬프 추가
    if (this.config.enableTimestamp) {
      const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
      formatted += `[${timestamp}] `;
    }

    // 로그 레벨 추가
    const levelName = LogLevel[level];
    if (this.config.enableColors) {
      const colors = {
        [LogLevel.DEBUG]: '\x1b[36m', // cyan
        [LogLevel.INFO]: '\x1b[32m',  // green
        [LogLevel.WARN]: '\x1b[33m',  // yellow
        [LogLevel.ERROR]: '\x1b[31m', // red
      };
      formatted += `${colors[level]}[${levelName}]\x1b[0m `;
    } else {
      formatted += `[${levelName}] `;
    }

    // 소스 정보 추가
    if (this.config.enableSource && source) {
      formatted += `[${source}] `;
    }

    formatted += message;
    return formatted;
  }

  private getStackTrace(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    // 첫 번째는 Error, 두 번째는 이 함수, 세 번째는 로그 메서드, 네 번째가 실제 호출자
    const callerLine = lines[4] || '';
    const match = callerLine.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);

    if (match) {
      const [, , file, line] = match;
      const fileName = file.split('/').pop() || file;
      return `${fileName}:${line}`;
    }

    return 'unknown';
  }

  debug(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;

    const source = this.config.enableSource ? this.getStackTrace() : undefined;
    const formatted = this.formatMessage(LogLevel.DEBUG, message, source);

    console.log(formatted, ...args);
  }

  info(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.INFO)) return;

    const source = this.config.enableSource ? this.getStackTrace() : undefined;
    const formatted = this.formatMessage(LogLevel.INFO, message, source);

    console.info(formatted, ...args);
  }

  warn(message: string, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.WARN)) return;

    const source = this.config.enableSource ? this.getStackTrace() : undefined;
    const formatted = this.formatMessage(LogLevel.WARN, message, source);

    console.warn(formatted, ...args);
  }

  error(message: string, error?: Error | any, ...args: any[]): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;

    const source = this.config.enableSource ? this.getStackTrace() : undefined;
    const formatted = this.formatMessage(LogLevel.ERROR, message, source);

    if (error instanceof Error) {
      console.error(formatted, error.message, error.stack, ...args);
    } else {
      console.error(formatted, error, ...args);
    }
  }

  // API 요청/응답 전용 로거
  apiRequest(method: string, url: string, data?: any): void {
    this.debug(`🌐 API ${method.toUpperCase()} ${url}`, data);
  }

  apiResponse(status: number, url: string, data?: any): void {
    if (status >= 400) {
      this.error(`🔴 API Error ${status} ${url}`, data);
    } else {
      this.debug(`🟢 API Success ${status} ${url}`, data);
    }
  }

  // 지도 이벤트 전용 로거
  mapEvent(event: string, data?: any): void {
    this.debug(`🗺️ Map Event: ${event}`, data);
  }

  // 성능 측정 로거
  performance(operation: string, duration: number): void {
    if (duration > 1000) {
      this.warn(`⚡ Slow operation: ${operation} took ${duration}ms`);
    } else {
      this.debug(`⚡ Performance: ${operation} took ${duration}ms`);
    }
  }

  // 사용자 액션 로거
  userAction(action: string, data?: any): void {
    this.info(`👤 User Action: ${action}`, data);
  }

  // 컴포넌트 라이프사이클 로거
  component(name: string, event: 'mount' | 'unmount' | 'update', data?: any): void {
    this.debug(`🧩 Component ${name} ${event}`, data);
  }
}

// 싱글톤 인스턴스 생성
export const logger = new Logger();

// 개발 모드에서만 window에 노출 (브라우저 콘솔에서 접근 가능)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).logger = logger;
}