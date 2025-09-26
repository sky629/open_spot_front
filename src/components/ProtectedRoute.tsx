// 인증이 필요한 라우트를 보호하는 컴포넌트

import React from 'react';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e8e8e8;
  border-top: 4px solid #03C75A;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
`;

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>인증 정보를 확인하는 중...</LoadingText>
      </LoadingContainer>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 인증된 경우 요청된 컴포넌트 렌더링
  return <>{children}</>;
};