// Error Boundary Component

import { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { logger } from '../../utils/logger';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 에러 로깅
    logger.error('Error boundary caught error', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // 외부 에러 핸들러 호출
    this.props.onError?.(error, errorInfo);

    // 개발 모드에서 콘솔에 상세 정보 출력
    if (import.meta.env.DEV) {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    logger.userAction('Error boundary retry attempted');
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // 커스텀 fallback이 제공된 경우
      if (this.props.fallback && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo);
      }

      // 기본 에러 UI
      return (
        <ErrorContainer>
          <ErrorIcon>💥</ErrorIcon>
          <ErrorTitle>문제가 발생했습니다</ErrorTitle>
          <ErrorMessage>
            애플리케이션에서 예상치 못한 오류가 발생했습니다.
            잠시 후 다시 시도해주세요.
          </ErrorMessage>

          {import.meta.env.DEV && (
            <ErrorDetails>
              <summary>기술적 세부사항 (개발 모드)</summary>
              <ErrorStack>
                <strong>Error:</strong> {this.state.error.message}
                <br />
                <strong>Stack:</strong>
                <pre>{this.state.error.stack}</pre>
                {this.state.errorInfo && (
                  <>
                    <strong>Component Stack:</strong>
                    <pre>{this.state.errorInfo.componentStack}</pre>
                  </>
                )}
              </ErrorStack>
            </ErrorDetails>
          )}

          <ErrorActions>
            <RetryButton onClick={this.handleRetry}>
              다시 시도
            </RetryButton>
            <ReloadButton onClick={this.handleReload}>
              페이지 새로고침
            </ReloadButton>
          </ErrorActions>

          <ErrorFooter>
            문제가 계속 발생하면 새로고침하거나 잠시 후 다시 접속해주세요.
          </ErrorFooter>
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background-color: #f7fafc;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const ErrorTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #718096;
  margin: 0 0 2rem 0;
  max-width: 500px;
  line-height: 1.6;
`;

const ErrorDetails = styled.details`
  margin: 1rem 0 2rem 0;
  max-width: 800px;
  width: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  padding: 1rem;

  summary {
    cursor: pointer;
    font-weight: 500;
    color: #4a5568;
    margin-bottom: 1rem;

    &:hover {
      color: #2d3748;
    }
  }
`;

const ErrorStack = styled.div`
  text-align: left;
  font-size: 0.875rem;
  color: #4a5568;

  pre {
    background: #f7fafc;
    padding: 0.75rem;
    border-radius: 4px;
    overflow-x: auto;
    margin: 0.5rem 0;
    white-space: pre-wrap;
    word-break: break-word;
  }
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const RetryButton = styled(Button)`
  background-color: #3182ce;
  color: white;

  &:hover {
    background-color: #2c5aa0;
  }
`;

const ReloadButton = styled(Button)`
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;

  &:hover {
    background-color: #edf2f7;
    border-color: #cbd5e0;
  }
`;

const ErrorFooter = styled.p`
  font-size: 0.875rem;
  color: #a0aec0;
  margin: 0;
  max-width: 400px;
  line-height: 1.5;
`;