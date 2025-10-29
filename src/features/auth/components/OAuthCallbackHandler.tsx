// OAuth Callback Handler - Processes token at root route

import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore, useIsAuthenticated } from '../../../stores/auth';
import { useAuth } from '../../../hooks/useAuth';
import { LoginErrorCode } from '../types';
import { logger } from '../../../utils/logger';

export const OAuthCallbackHandler: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useIsAuthenticated();
  const { refreshUser } = useAuth();
  const isProcessedRef = useRef(false);

  const token = searchParams.get('token');
  const newUser = searchParams.get('new_user');
  const isOAuthCallback = !!(token || newUser !== null);

  useEffect(() => {
    const handleCallback = async () => {
      // 이미 처리된 경우 중복 처리 방지
      if (isProcessedRef.current) {
        return;
      }

      // OAuth 콜백이 아닌 경우는 처리하지 않음
      if (!isOAuthCallback) {
        return;
      }

      try {
        isProcessedRef.current = true;

        const { setLoading, setError } = useAuthStore.getState();
        setLoading(true);
        setError(null);

        const error = searchParams.get('error');
        const code = searchParams.get('code');
        const msg = searchParams.get('msg');
        const details = searchParams.get('details');

        logger.info('🔍 OAuth callback processing at root route', {
          hasToken: !!token,
          hasNewUser: newUser !== null,
          hasError: !!error,
          hasCode: !!code,
          hasMsg: !!msg,
          hasDetails: !!details
        });

        // 에러 처리
        if (error || code) {
          if (code) {
            const errorParams = new URLSearchParams({
              code,
              ...(msg && { msg }),
              ...(details && { details })
            });
            navigate(`/login/error?${errorParams.toString()}`, { replace: true });
            return;
          } else {
            throw new Error(`OAuth Error: ${error}`);
          }
        }

        // 1. URL 파라미터의 access_token을 store에 저장 (동기 처리)
        if (token) {
          logger.info('Access token received from URL, storing in memory');
          useAuthStore.getState().setAccessToken(token);
        }

        // 2. refresh_token은 HttpOnly Cookie로 자동 설정됨
        // 3. 이제 store에 access_token이 있으므로 사용자 정보 조회 가능
        logger.info('🔐 Access token stored, fetching user from API...');

        // 백엔드에서 access_token 검증 및 사용자 정보 조회
        await refreshUser();

        logger.info('✅ User authenticated with HttpOnly cookie', { newUser });
        logger.userAction('OAuth callback successful, redirecting to map');

        // 즉시 리다이렉트
        navigate('/map', { replace: true });

      } catch (error) {
        logger.error('OAuth callback failed', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        const { setError, setLoginError, setLoading } = useAuthStore.getState();

        setError(errorMessage);
        setLoginError({
          code: LoginErrorCode.AUTH_FAILED,
          message: errorMessage,
          details: error instanceof Error ? error.stack : undefined,
          timestamp: Date.now()
        });

        // 즉시 로그인 페이지로 리셋
        navigate('/login', { replace: true });

        setLoading(false);
      } finally {
        const { setLoading } = useAuthStore.getState();
        setLoading(false);
      }
    };

    handleCallback();
  }, [isOAuthCallback, token, newUser, searchParams, navigate, refreshUser]);

  // If OAuth callback, show loading
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

  // If already authenticated, go to map
  if (isAuthenticated) {
    return <Navigate to="/map" replace />;
  }

  // Otherwise, go to login
  return <Navigate to="/login" replace />;
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
