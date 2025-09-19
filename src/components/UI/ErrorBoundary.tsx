// 에러 바운더리 컴포넌트

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { logger } from '../../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  background: #fff;
  border: 1px solid #ff6b6b;
  border-radius: 8px;
  margin: 1rem;
`;

const ErrorTitle = styled.h2`
  color: #ff6b6b;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ErrorMessage = styled.p`
  color: #666;
  text-align: center;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const ErrorDetails = styled.details`
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  max-width: 100%;
  overflow: auto;

  summary {
    cursor: pointer;
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #495057;
  }
`;

const ErrorStack = styled.pre`
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #666;
  max-height: 300px;
  overflow-y: auto;
`;

const RetryButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  margin-top: 1rem;

  &:hover {
    background: #0056b3;
  }

  &:active {
    background: #004085;
  }
`;

export class ErrorBoundary extends Component<Props, State> {
  private retryTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logger.error('React Error Boundary caught an error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: this.constructor.name,
      timestamp: new Date().toISOString(),
    });

    // 에러 정보 상태 업데이트
    this.setState({
      error,
      errorInfo,
    });

    // 외부 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 개발 모드에서는 에러를 console.error로도 출력
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught an Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    logger.info('User initiated error boundary retry');

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // 약간의 지연 후 재시도 (상태 변경이 완전히 적용되도록)
    this.retryTimeoutId = window.setTimeout(() => {
      logger.debug('Error boundary state reset completed');
    }, 100);
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI
      return (
        <ErrorContainer>
          <ErrorTitle>앗! 문제가 발생했습니다</ErrorTitle>

          <ErrorMessage>
            예상치 못한 오류가 발생했습니다. 새로고침하거나 잠시 후 다시 시도해주세요.
          </ErrorMessage>

          <RetryButton onClick={this.handleRetry}>
            다시 시도
          </RetryButton>

          {import.meta.env.DEV && this.state.error && (
            <ErrorDetails>
              <summary>개발자 정보 (클릭하여 펼치기)</summary>
              <div>
                <strong>Error:</strong> {this.state.error.message}
              </div>
              {this.state.error.stack && (
                <div>
                  <strong>Stack Trace:</strong>
                  <ErrorStack>{this.state.error.stack}</ErrorStack>
                </div>
              )}
              {this.state.errorInfo?.componentStack && (
                <div>
                  <strong>Component Stack:</strong>
                  <ErrorStack>{this.state.errorInfo.componentStack}</ErrorStack>
                </div>
              )}
            </ErrorDetails>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

// HOC 버전도 제공
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}