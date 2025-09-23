// New App Component with Feature-based Architecture

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary, LoadingSpinner } from './shared/components';
import { LoginPage, LoginErrorPage, ProtectedRoute } from './features/auth';
import { MapPage } from './features/map';
import { initializeApplication, cleanupApplication } from './setup';
import { logger } from './utils/logger';
import './App.css';

interface AppState {
  isInitialized: boolean;
  initializationError: string | null;
}

export const NewApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    isInitialized: false,
    initializationError: null
  });

  // 애플리케이션 초기화
  useEffect(() => {
    let isInitializing = false;

    const initialize = async () => {
      // 중복 초기화 방지
      if (isInitializing) {
        return;
      }
      isInitializing = true;

      try {
        logger.info('🎯 Starting application initialization...');

        await initializeApplication();

        setState({
          isInitialized: true,
          initializationError: null
        });

        logger.info('🎉 Application ready!');

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';

        setState({
          isInitialized: false,
          initializationError: errorMessage
        });

        logger.error('💥 Application initialization failed', error);
      } finally {
        isInitializing = false;
      }
    };

    initialize();

    // 클린업 함수
    return () => {
      // 개발 모드에서는 클린업하지 않음 (React Strict Mode 대응)
      if (!import.meta.env.DEV) {
        cleanupApplication();
      }
    };
  }, []);

  // 개발 모드에서 개발 도구 로드
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('./utils/devTools').catch(error => {
        console.warn('Failed to load dev tools:', error);
      });

      import('./utils/performance').catch(error => {
        console.warn('Failed to load performance tools:', error);
      });
    }
  }, []);

  // 초기화 중 로딩 화면
  if (!state.isInitialized && !state.initializationError) {
    return (
      <LoadingSpinner
        size="large"
        message="애플리케이션을 초기화하는 중..."
        fullscreen
      />
    );
  }

  // 초기화 실패 화면
  if (state.initializationError) {
    return (
      <ErrorBoundary>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#f7fafc'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#2d3748' }}>
            초기화 실패
          </h1>
          <p style={{ color: '#718096', marginBottom: '2rem', maxWidth: '500px' }}>
            애플리케이션을 시작하는 중 문제가 발생했습니다: {state.initializationError}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              cursor: 'pointer'
            }}
          >
            페이지 새로고침
          </button>
        </div>
      </ErrorBoundary>
    );
  }

  // 메인 애플리케이션
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logger.error('Global error boundary caught error', error, {
          componentStack: errorInfo.componentStack
        });
      }}
    >
      <Router>
        <div className="App">
          <Routes>
            {/* 공개 경로들 */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/error" element={<LoginErrorPage />} />


            {/* 보호된 경로들 */}
            <Route
              path="/map"
              element={
                <ProtectedRoute>
                  <MapPage />
                </ProtectedRoute>
              }
            />

            {/* 기본 경로 */}
            <Route path="/" element={<Navigate to="/map" replace />} />

            {/* 404 처리 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};