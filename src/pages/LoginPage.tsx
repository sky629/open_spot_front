// 구글 로그인 페이지 컴포넌트

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../constants';
import { logger } from '../utils/logger';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: #fff;
  padding: 48px 40px;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 40px 32px;
    border-radius: 20px;
  }

  @media (max-width: 480px) {
    padding: 32px 24px;
    margin: 0 16px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 32px;
`;

const LogoIcon = styled.div`
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #03C75A 0%, #029E4A 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 24px;

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
`;

const Title = styled.h1`
  margin: 0;
  font-size: 28px;
  color: #2d2d2d;
  font-weight: 700;
  letter-spacing: -0.5px;

  @media (max-width: 480px) {
    font-size: 24px;
  }
`;

const Subtitle = styled.p`
  margin: 16px 0 40px;
  font-size: 16px;
  color: #666;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 15px;
    margin: 12px 0 32px;
  }
`;

const GoogleLoginButton = styled.button<{ $isLoading?: boolean }>`
  width: 100%;
  height: 56px;
  background: ${props => props.$isLoading ? '#f8f9fa' : '#fff'};
  border: 2px solid #e8e8e8;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  cursor: ${props => props.$isLoading ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.$isLoading ? 0.7 : 1};

  &:hover {
    ${props => !props.$isLoading && `
      border-color: #03C75A;
      background: #f8fff8;
      transform: translateY(-1px);
      box-shadow: 0 4px 20px rgba(3, 199, 90, 0.15);
    `}
  }

  &:active {
    transform: ${props => props.$isLoading ? 'none' : 'translateY(0)'};
  }

  @media (max-width: 480px) {
    height: 52px;
    font-size: 15px;
  }
`;

const GoogleIcon = styled.div`
  width: 24px;
  height: 24px;
  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIyLjU2IDEyLjI1QzIyLjU2IDExLjQ3IDIyLjQ5IDEwLjcyIDIyLjM2IDEwSDE2VjE0LjI2SDIwLjA2QzE5LjMzIDE2Ljc4IDE3LjcxIDE4LjY5IDE1LjM5IDE5Ljc4VjIyLjAxSDE5LjA4QzIxLjU0IDIwLjA4IDIyLjU2IDE2LjUzIDIyLjU2IDEyLjI1WiIgZmlsbD0iIzQyODVGNCIvPgo8cGF0aCBkPSJNMTIgMjRDMTUuMjQgMjQgMTcuOTUgMjIuOTIgMTkuMDggMjIuMDFMMTUuMzkgMTkuNzhDMTQuMzYgMjAuNDYgMTMuMDkgMjAuODkgMTIgMjAuODlDOS00IDYuNDMgMTguMjIgNC4zMiAxNS4yN0w2LjA2IDEyLjc3TDE5Ljc4IDIwLjAzWiIgZmlsbD0iIzM0QTg1MyIvPgo8cGF0aCBkPSJNOC4xMSAxMy4zOUM4LjExIDEyLjY0IDguMjggMTEuOTIgOC41NyAxMS4yN0w0LjMyIDcuNzJDMy4xNSA5LjY4IDIuNSAxMS45NSAyLjUgMTQuMjVDMi41IDE2LjU1IDMuMTUgMTguODIgNC4zMiAyMC43OEw2LjczIDE5Ljg4QzYuNDMgMTkuMjMgNi4yNSAxOC41MSA2LjI1IDE3Ljc2TDguMTEgMTMuMzlaIiBmaWxsPSIjRkJCQzA0Ii8+CjxwYXRoIGQ9Ik0xMiAzLjEwMDVDMTMuMTUgMy4xMDA1IDE0LjIgMy41NTA1IDE1IDQuMzIwNUwxOC4xIDEuMjIwNUMxNi40MiAwLjEyMDUgMTQuMzYgLTAuNTU5NSAxMiAtMC41NTk1QzguOTEgLTAuNTU5NSA2LjA5IDEuMTEwNSA0LjMyIDMuNjQwNUw4LjUgNy4xODA1QzEwLjA1IDQuNjAwNSAxMC45IDMuMTAwNSAxMiAzLjEwMDVaIiBmaWxsPSIjRUE0MzM1Ii8+Cjwvc3ZnPgo=') no-repeat center;
  background-size: contain;
`;

const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid #e8e8e8;
  border-top: 2px solid #03C75A;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  background: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  color: #c53030;
  font-size: 14px;
  text-align: left;
`;

const FeatureList = styled.div`
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid #f0f0f0;
`;

const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #666;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FeatureIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #03C75A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
`;

export const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  // 이미 로그인된 상태면 지도 페이지로 리다이렉트
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      logger.userAction('Already authenticated, redirecting to map');
      navigate('/map', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  useEffect(() => {
    // URL 파라미터에서 에러 확인
    const urlParams = new URLSearchParams(location.search);
    const errorParam = urlParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [location.search]);

  useEffect(() => {
    // Google Identity Services 스크립트 로드
    const loadGoogleIdentityServices = () => {
      if (window.google?.accounts) {
        initializeGoogleIdentity();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleIdentity;
      script.onerror = () => {
        logger.error('Failed to load Google Identity Services');
        setError('Google 로그인 서비스를 로드할 수 없습니다.');
      };
      document.head.appendChild(script);
    };

    const initializeGoogleIdentity = () => {
      const clientId = __GOOGLE_CLIENT_ID__;
      if (!clientId) {
        logger.error('Google Client ID is not configured');
        setError('Google 로그인 설정이 올바르지 않습니다.');
        return;
      }

      if (!window.google?.accounts?.oauth2) {
        logger.error('Google Identity Services not available');
        setError('Google 로그인 서비스를 사용할 수 없습니다.');
        return;
      }

      logger.info('Google Identity Services initialized successfully');
    };

    loadGoogleIdentityServices();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      logger.userAction('Google OAuth login button clicked');

      // 백엔드 Google 로그인 엔드포인트로 직접 리다이렉트
      const googleLoginUrl = `${__API_BASE_URL__}${API_ENDPOINTS.AUTH.GOOGLE_LOGIN}`;

      logger.userAction('Redirecting to backend Google OAuth', { url: googleLoginUrl });

      // 백엔드 OAuth 엔드포인트로 리다이렉트
      window.location.href = googleLoginUrl;

    } catch (error: unknown) {
      logger.error('Google login failed', error);

      let errorMessage = '로그인에 실패했습니다. 다시 시도해 주세요.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <PageContainer>
      <LoginCard>
        <Logo>
          <LogoIcon>OS</LogoIcon>
          <Title>Open Spot</Title>
        </Logo>

        <Subtitle>
          흩어진 추억의 조각을 나만의 지도 위에.<br />
          Open Spot에 오신 것을 환영합니다!<br />
          구글 계정으로 간편하게 시작하세요.
        </Subtitle>

        <GoogleLoginButton
          onClick={handleGoogleLogin}
          disabled={isLoading}
          $isLoading={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              로그인 중...
            </>
          ) : (
            <>
              <GoogleIcon />
              Google로 로그인
            </>
          )}
        </GoogleLoginButton>

        {error && (
          <ErrorMessage>
            {error}
          </ErrorMessage>
        )}

        <FeatureList>
          <FeatureItem>
            <FeatureIcon>📍</FeatureIcon>
            스쳐간 모든 소중한 장소를 기록하세요.
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>📊</FeatureIcon>
            나만의 평점과 솔직한 경험을 간직하세요.
          </FeatureItem>
          <FeatureItem>
            <FeatureIcon>🚶</FeatureIcon>
            우리끼리만 아는 비밀 지도를 공유하세요.
          </FeatureItem>
        </FeatureList>
      </LoginCard>
    </PageContainer>
  );
};