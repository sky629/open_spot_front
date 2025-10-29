// Protected Route Component

import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthLoading, useIsAuthenticated, useAuthStore } from '../../../stores/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const isLoading = useAuthLoading();
  const isAuthenticated = useIsAuthenticated();
  const location = useLocation();

  // accessToken이 있지만 아직 user 상태가 업데이트 되지 않은 경우를 위해
  // 인증 처리 중으로 간주
  const accessToken = useAuthStore((state) => state.accessToken);

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return fallback || <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>인증 상태를 확인하는 중...</LoadingText>
    </LoadingContainer>;
  }

  // 토큰은 있지만 아직 인증 상태가 업데이트 되지 않은 경우
  // (OAuth 콜백 직후의 타이밍 이슈)
  if (accessToken && !isAuthenticated) {
    return fallback || <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>로그인 처리 중...</LoadingText>
    </LoadingContainer>;
  }

  // 미인증 사용자는 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 인증된 경우 자식 컴포넌트 렌더링
  return <>{children}</>;
};

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f7fafc;
`;

const LoadingSpinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #718096;
  font-size: 1rem;
  text-align: center;
`;