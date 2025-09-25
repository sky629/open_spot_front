// Login Form Component

import React, { useState, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useLogin } from '../../../stores/auth';
import { logger } from '../../../utils/logger';

interface LoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, className }) => {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Zustand 스토어에서 필요한 값들만 선택적으로 구독
  const loginData = useLogin();
  const { isLoading, error, isServiceReady, loginWithGoogle, clearError } = loginData;

  // 핸들러를 useCallback으로 메모이제이션하여 불필요한 re-render 방지
  const handleGoogleLogin = useCallback(async () => {
    // 서비스가 준비되지 않았거나 이미 로딩 중이면 조기 반환
    if (!isServiceReady || isLoading || isGoogleLoading) {
      logger.warn('Google login attempted before service ready or during loading');
      return;
    }

    try {
      setIsGoogleLoading(true);
      clearError();

      // Google OAuth 플로우 시작
      logger.userAction('Google login initiated');

      // Google OAuth 리다이렉트 (/login으로 통합됨)
      const redirectUri = `${window.location.origin}/login`;
      const googleOAuthUrl = `${__VITE_API_BASE_URL__}/api/v1/auth/google/login?redirect_uri=${encodeURIComponent(redirectUri)}`;

      logger.info('Redirecting to Google OAuth', { url: googleOAuthUrl, redirectUri });
      window.location.href = googleOAuthUrl;

      // 리다이렉트 후에는 이 코드가 실행되지 않음
    } catch (error) {
      logger.error('Google login failed', error);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [isServiceReady, isLoading, isGoogleLoading, clearError, loginWithGoogle, onSuccess]);

  // 버튼 상태를 useMemo로 계산하여 불필요한 계산 방지
  const buttonState = useMemo(() => {
    const isDisabled = !isServiceReady || isLoading || isGoogleLoading;

    let content;
    if (!isServiceReady) {
      content = (
        <>
          <LoadingSpinner />
          서비스 준비 중...
        </>
      );
    } else if (isLoading || isGoogleLoading) {
      content = (
        <>
          <LoadingSpinner />
          로그인 중...
        </>
      );
    } else {
      content = (
        <>
          <GoogleIcon>G</GoogleIcon>
          Google로 로그인
        </>
      );
    }

    return { isDisabled, content };
  }, [isServiceReady, isLoading, isGoogleLoading]);

  return (
    <Container className={className}>
      <Title>Open Spot에 로그인</Title>
      <Description>
        위치 기반 서비스를 이용하려면 로그인이 필요합니다.
      </Description>

      {error && (
        <ErrorMessage>
          {error}
          <CloseButton onClick={clearError}>&times;</CloseButton>
        </ErrorMessage>
      )}

      <GoogleButton
        onClick={handleGoogleLogin}
        disabled={buttonState.isDisabled}
      >
        {buttonState.content}
      </GoogleButton>

      <FooterText>
        로그인하면 서비스 이용약관 및 개인정보처리방침에 동의하는 것으로 간주됩니다.
      </FooterText>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2.5rem;
  max-width: 420px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #8b5cf6, #7c3aed, #6d28d9);
  }

  animation: slideUp 0.6s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 480px) {
    padding: 2rem 1.5rem;
    margin: 1rem;
    max-width: calc(100vw - 2rem);
    border-radius: 16px;
  }

  @media (max-width: 320px) {
    padding: 1.5rem 1rem;
    margin: 0.5rem;
  }
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
  text-align: center;
`;

const Description = styled.p`
  font-size: 0.875rem;
  color: #718096;
  text-align: center;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const ErrorMessage = styled.div`
  position: relative;
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  border: 1px solid #feb2b2;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.75rem;
  background: none;
  border: none;
  color: #c53030;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(197, 48, 48, 0.1);
    border-radius: 4px;
  }
`;

const GoogleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem 1.5rem;
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 500;
  color: #2d3748;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent);
    transition: left 0.5s;
  }

  &:hover:not(:disabled) {
    border-color: #8b5cf6;
    background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
    transform: translateY(-2px);
    box-shadow:
      0 8px 20px rgba(139, 92, 246, 0.15),
      0 2px 4px rgba(0, 0, 0, 0.08);

    &::before {
      left: 100%;
    }
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const GoogleIcon = styled.span`
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
  background: linear-gradient(45deg, #ea4335 0%, #fbbc05 25%, #34a853 50%, #4285f4 75%);
  color: white;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.75rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    border-radius: 5px;
    background: linear-gradient(45deg, #ea4335 0%, #fbbc05 25%, #34a853 50%, #4285f4 75%);
    opacity: 0.8;
  }
`;

const LoadingSpinner = styled.div`
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const FooterText = styled.p`
  font-size: 0.75rem;
  color: #a0aec0;
  text-align: center;
  line-height: 1.4;
  max-width: 300px;
`;