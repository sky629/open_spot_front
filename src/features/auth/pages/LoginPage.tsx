// Unified Login Page Component with OAuth Callback

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { LoginForm } from '../components';
import { useIsAuthenticated, useAuthStore } from '../../../stores/auth';
import { logger } from '../../../utils/logger';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useIsAuthenticated();

  // OAuth 콜백 상태 관리 (간소화)
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessedRef = useRef(false);

  // URL 파라미터에서 토큰 확인하여 OAuth 콜백인지 판단
  const token = searchParams.get('token');
  const isOAuthCallback = !!token;

  // OAuth 콜백 처리 로직 (NewAuthCallbackPage에서 이동)
  const handleAuthCallback = useCallback(async () => {
    if (!token) {
      return;
    }

    if (isProcessedRef.current) {
      return;
    }

    try {
      isProcessedRef.current = true;
      setIsProcessing(true);

      const { setLoading, setError, setUser } = useAuthStore.getState();
      setLoading(true);
      setError(null);

      const refreshToken = searchParams.get('refresh_token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      logger.info('🔍 OAuth callback processing', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        hasUser: !!userParam,
        hasError: !!error
      });

      if (error) {
        throw new Error(`OAuth Error: ${error}`);
      }

      if (!token) {
        throw new Error('No token provided in callback');
      }

      // 사용자 정보 처리
      if (userParam && userParam !== 'false' && userParam !== 'null') {
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          setUser(userData);
          logger.info('✅ User data set from URL parameter:', userData);
        } catch (parseError) {
          logger.error('Failed to parse user data from URL', parseError);
          throw new Error('사용자 정보를 처리할 수 없습니다.');
        }
      } else {
        // JWT 토큰에서 사용자 정보 추출

        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT token format');
          }

          const decodeBase64UTF8 = (str: string) => {
            try {
              return new TextDecoder().decode(Uint8Array.from(atob(str), c => c.charCodeAt(0)));
            } catch {
              return decodeURIComponent(escape(atob(str)));
            }
          };

          const payload = JSON.parse(decodeBase64UTF8(tokenParts[1]));

          const userData = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            socialId: payload.socialId,
            provider: 'Google' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          setUser(userData);
          logger.info('✅ User data extracted from JWT and set in store');
        } catch (jwtError) {
          logger.error('❌ Failed to decode JWT token:', jwtError);
          throw new Error('JWT 토큰을 해석할 수 없습니다.');
        }
      }

      logger.userAction('OAuth callback successful, redirecting to map');

      // 즉시 리다이렉트
      navigate('/map', { replace: true });

    } catch (error) {
      logger.error('OAuth callback failed', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const { setError, setLoading } = useAuthStore.getState();
      setError(errorMessage);

      // 즉시 로그인 페이지로 리셋
      navigate('/login', { replace: true });

      setLoading(false);
    } finally {
      const { setLoading } = useAuthStore.getState();
      setLoading(false);
    }
  }, [searchParams, navigate, token]);

  // OAuth 콜백 처리 useEffect
  useEffect(() => {
    if (isOAuthCallback) {
      handleAuthCallback();
    }
  }, [isOAuthCallback, handleAuthCallback]);

  // 일반 로그인 상태 처리
  useEffect(() => {
    if (isAuthenticated && !isOAuthCallback) {
      const from = (location.state as any)?.from?.pathname || '/map';
      logger.info('User already authenticated, redirecting', { to: from });
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, isOAuthCallback]);

  const handleLoginSuccess = () => {
    const from = (location.state as any)?.from?.pathname || '/map';
    logger.userAction('Login successful, redirecting', { to: from });
    navigate(from, { replace: true });
  };


  // OAuth 콜백 처리 중인 경우 간단한 로딩 UI 렌더링
  if (isOAuthCallback) {
    return (
      <Container>
        <Background />
        <SimpleCallbackContent>
          <LoadingSpinner />
          <LoadingMessage>로그인 처리 중...</LoadingMessage>
        </SimpleCallbackContent>
      </Container>
    );
  }

  // 일반 로그인 UI 렌더링
  return (
    <Container>
      <Background />
      <Content>
        <Header>
          <Logo>🗺️ Open Spot</Logo>
          <Subtitle>위치 기반 정보 공유 플랫폼</Subtitle>
        </Header>

        <LoginForm onSuccess={handleLoginSuccess} />

        <Footer>
          <FooterLink href="/privacy">개인정보처리방침</FooterLink>
          <FooterSeparator>|</FooterSeparator>
          <FooterLink href="/terms">이용약관</FooterLink>
        </Footer>
      </Content>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6d28d9 100%);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, rgba(167, 139, 250, 0.2) 0%, transparent 50%);
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.08'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    animation: float 20s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(180deg); }
  }
`;

const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 480px;
  z-index: 1;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const Subtitle = styled.p`
  font-size: 1.125rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rem;
  gap: 0.5rem;
`;

const FooterLink = styled.a`
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-size: 0.875rem;
  transition: color 0.2s ease;

  &:hover {
    color: white;
    text-decoration: underline;
  }
`;

const FooterSeparator = styled.span`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.875rem;
`;

// 간소화된 OAuth 콜백 처리용 스타일 컴포넌트들
const SimpleCallbackContent = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  max-width: 300px;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem;
`;

const LoadingSpinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 3px solid #e2e8f0;
  border-top: 3px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingMessage = styled.p`
  font-size: 1rem;
  font-weight: 500;
  color: #4a5568;
  margin: 0;
`;