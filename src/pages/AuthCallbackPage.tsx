// OAuth 로그인 성공 후 콜백 처리 페이지
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import type { User } from '../types';

const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
`;

const CallbackCard = styled.div`
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid #e8e8e8;
  border-top: 3px solid #03C75A;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  margin: 0;
  font-size: 16px;
  color: #666;
  line-height: 1.5;

  @media (max-width: 480px) {
    font-size: 15px;
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

const RetryButton = styled.button`
  width: 100%;
  height: 48px;
  background: #03C75A;
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;

  &:hover {
    background: #029E4A;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(3, 199, 90, 0.3);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 480px) {
    height: 44px;
    font-size: 15px;
  }
`;

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        logger.userAction('Auth callback page accessed', {
          url: location.search
        });

        // URL에서 파라미터 추출
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const refreshToken = urlParams.get('refresh_token');
        const userParam = urlParams.get('user');
        const error = urlParams.get('error');

        // 디버깅을 위한 URL 파라미터 로깅
        console.log('🔍 URL Parameters:', {
          token: token ? token.substring(0, 20) + '...' : null,
          refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
          userParam: userParam,
          error: error
        });

        // 에러 체크
        if (error) {
          logger.error('OAuth callback error', { error });
          throw new Error(`로그인이 실패했습니다: ${error}`);
        }

        // 필수 파라미터 체크
        if (!token || !refreshToken) {
          logger.error('OAuth callback missing parameters', {
            hasToken: !!token,
            hasRefreshToken: !!refreshToken,
            hasUser: !!userParam
          });
          throw new Error('로그인 정보가 누락되었습니다. 다시 로그인해 주세요.');
        }

        logger.userAction('Processing OAuth callback with backend data', {
          tokenLength: token.length,
          hasRefreshToken: !!refreshToken,
          hasUserData: !!userParam
        });

        // 사용자 정보 파싱 또는 JWT 토큰에서 추출
        let userData: User;
        if (userParam && userParam !== 'false' && userParam !== 'null') {
          try {
            userData = JSON.parse(decodeURIComponent(userParam));
            console.log('✅ Parsed user data from URL parameter:', userData);
          } catch (parseError) {
            logger.error('Failed to parse user data', parseError);
            throw new Error('사용자 정보를 처리할 수 없습니다.');
          }
        } else {
          // userParam이 없거나 'false'인 경우 JWT 토큰에서 사용자 정보 추출
          console.log('⚠️ No valid user param, extracting from JWT token');
          try {
            const loginResponse = await authService.setUserFromToken(token);
            userData = loginResponse.user;
            console.log('✅ Extracted user data from JWT token:', userData);
          } catch (tokenError) {
            logger.error('Failed to extract user from JWT token', tokenError);
            throw new Error('JWT 토큰에서 사용자 정보를 추출할 수 없습니다.');
          }
        }

        // 토큰 정보 구성 및 저장
        if (userParam && userParam !== 'false' && userParam !== 'null') {
          // URL 파라미터에서 사용자 정보를 가져온 경우 토큰 저장
          const tokens = {
            accessToken: token,
            refreshToken: refreshToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후 만료로 임시 설정
          };

          console.log('🔐 Storing tokens:', { 
            accessToken: tokens.accessToken.substring(0, 20) + '...',
            refreshToken: tokens.refreshToken.substring(0, 20) + '...',
            expiresAt: tokens.expiresAt 
          });
          
          authService.setTokens(tokens);
          authService.setUser(userData);
        } else {
          // JWT 토큰에서 사용자 정보를 추출한 경우 이미 토큰이 저장됨
          console.log('✅ Tokens already stored from JWT token extraction');
        }
        
        console.log('👤 Final user data:', userData);
        setUser(userData);
        
        console.log('✅ Auth data stored successfully');

        logger.userAction('OAuth login successful, redirecting to map', {
          userId: userData.id,
          userName: userData.name
        });

        // 지도 페이지로 리다이렉트
        console.log('🚀 Redirecting to map page...');
        navigate('/map', { replace: true });

      } catch (error: unknown) {
        logger.error('OAuth callback processing failed', error);

        let errorMessage = '로그인 처리 중 오류가 발생했습니다.';
        if (error instanceof Error) {
          errorMessage = error.message;
        }

        setError(errorMessage);
        setIsProcessing(false);
      }
    };

    processCallback();
  }, [location.search, navigate, setUser]);

  const handleRetry = () => {
    // 로그인 페이지로 이동
    navigate('/login', { replace: true });
  };

  if (error) {
    return (
      <PageContainer>
        <CallbackCard>
          <Logo>
            <LogoIcon>OS</LogoIcon>
            <Title>Open Spot</Title>
          </Logo>

          <ErrorMessage>
            {error}
          </ErrorMessage>

          <RetryButton onClick={handleRetry}>
            다시 로그인하기
          </RetryButton>
        </CallbackCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <CallbackCard>
        <Logo>
          <LogoIcon>OS</LogoIcon>
          <Title>Open Spot</Title>
        </Logo>

        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>
            {isProcessing ? '로그인 처리 중...' : '로그인 완료!'}
          </LoadingText>
        </LoadingContainer>
      </CallbackCard>
    </PageContainer>
  );
};