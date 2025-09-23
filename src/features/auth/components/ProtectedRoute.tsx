// Protected Route Component

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { useAuthLoading } from '../../../stores/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback
}) => {
  const isLoading = useAuthLoading();

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return fallback || <LoadingContainer>
      <LoadingSpinner />
      <LoadingText>인증 상태를 확인하는 중...</LoadingText>
    </LoadingContainer>;
  }

  // 임시로 인증 우회 (테스트용)
  // if (!isAuthenticated) {
  //   return (
  //     <Navigate
  //       to={redirectTo}
  //       state={{ from: location }}
  //       replace
  //     />
  //   );
  // }

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