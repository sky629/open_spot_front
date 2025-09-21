// New Auth Callback Page with Zustand Integration

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthStore } from '../../../stores/auth';
import { logger } from '../../../utils/logger';

export const NewAuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('인증을 처리하는 중입니다...');

  // 이미 처리했는지 추적하는 ref (무한 루프 방지)
  const isProcessedRef = useRef(false);

  // 컴포넌트 마운트 시마다 초기화
  useEffect(() => {
    isProcessedRef.current = false;
  }, []);

  // 안정적인 콜백 함수 생성 (useCallback으로 메모이제이션)
  const handleAuthCallback = useCallback(async () => {
    // URL 파라미터가 있는지 먼저 확인
    const token = searchParams.get('token');
    if (!token) {
      console.log('No token in URL, skipping auth callback...');
      return;
    }

    // 이미 처리된 경우 중복 실행 방지 (단, 토큰이 다르면 새로 처리)
    if (isProcessedRef.current) {
      console.log('Auth callback already processed, skipping...');
      return;
    }

    try {
      isProcessedRef.current = true; // 처리 시작 표시

      // 스토어에서 직접 함수를 가져와서 호출하여 의존성 문제 해결
      const { setLoading, setError, setUser, setUserFromToken } = useAuthStore.getState();

      setLoading(true);
      setError(null);

      // URL에서 파라미터 추출
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refresh_token');
      const userParam = searchParams.get('user');
      const error = searchParams.get('error');

      // 디버깅을 위한 URL 파라미터 로깅
      console.log('🔍 URL Parameters:', {
        token: token ? token.substring(0, 20) + '...' : null,
        refreshToken: refreshToken ? refreshToken.substring(0, 20) + '...' : null,
        userParam: userParam,
        error: error
      });

      if (error) {
        throw new Error(`OAuth Error: ${error}`);
      }

      if (!token) {
        throw new Error('No token provided in callback');
      }

      // JWT 토큰에서 사용자 정보 추출 및 Zustand 스토어에 저장
      if (userParam && userParam !== 'false' && userParam !== 'null') {
        // URL 파라미터에서 사용자 정보 파싱
        try {
          const userData = JSON.parse(decodeURIComponent(userParam));
          setUser(userData);
          console.log('✅ User data set from URL parameter:', userData);
        } catch (parseError) {
          logger.error('Failed to parse user data from URL', parseError);
          throw new Error('사용자 정보를 처리할 수 없습니다.');
        }
      } else {
        // JWT 토큰에서 사용자 정보 추출 (백엔드 없이 클라이언트에서 직접 디코딩)
        console.log('⚠️ No valid user param, extracting from JWT token');
        setMessage('JWT 토큰에서 사용자 정보를 추출하는 중...');

        try {
          // JWT 토큰 디코딩 (Base64 디코딩)
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid JWT token format');
          }

          // JWT payload 디코딩
          const payload = JSON.parse(atob(tokenParts[1]));
          console.log('🔍 JWT Payload:', payload);

          // 토큰에서 사용자 정보 추출
          const userData = {
            id: payload.sub,
            email: payload.email,
            name: payload.name,
            socialId: payload.socialId,
            provider: 'Google',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          console.log('✅ Extracted user data from JWT:', userData);

          // Zustand store에 사용자 정보 저장
          setUser(userData);
          console.log('✅ User data set in Zustand store');
        } catch (jwtError) {
          console.error('❌ Failed to decode JWT token:', jwtError);
          throw new Error('JWT 토큰을 해석할 수 없습니다.');
        }
      }

      setStatus('success');
      setMessage('로그인이 완료되었습니다. 잠시 후 이동합니다...');

      logger.userAction('Auth callback successful, redirecting to map');

      // 2초 후 메인 페이지로 이동
      setTimeout(() => {
        navigate('/map', { replace: true });
      }, 2000);

    } catch (error) {
      logger.error('Auth callback failed', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const { setError, setLoading } = useAuthStore.getState();
      setError(errorMessage);
      setStatus('error');
      setMessage('로그인 처리 중 오류가 발생했습니다.');

      // 5초 후 로그인 페이지로 이동
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 5000);

      // finally 블록이 실행되지 않을 수 있으므로 여기서도 로딩 상태 해제
      setLoading(false);
    } finally {
      // 스토어에서 직접 함수를 가져와서 호출
      const { setLoading } = useAuthStore.getState();
      setLoading(false);
    }
  }, [searchParams, navigate]); // 스토어 함수들을 의존성에서 제거하여 무한 루프 방지

  useEffect(() => {
    // 컴포넌트 마운트 시 한 번만 실행
    handleAuthCallback();
  }, []); // 빈 의존성 배열로 한 번만 실행되도록 보장

  const handleRetryLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Container>
      <Content>
        <StatusIcon $status={status}>
          {status === 'processing' && <Spinner />}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </StatusIcon>

        <Message $status={status}>{message}</Message>

        {status === 'processing' && (
          <ProgressBar>
            <ProgressFill />
          </ProgressBar>
        )}

        {status === 'error' && (
          <RetryButton onClick={handleRetryLogin}>
            로그인 페이지로 돌아가기
          </RetryButton>
        )}

        {status === 'success' && (
          <SuccessDetails>
            잠시 후 자동으로 메인 페이지로 이동합니다.
          </SuccessDetails>
        )}
      </Content>
    </Container>
  );
};

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: white;
  padding: 3rem 2rem;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  width: 100%;
`;

const StatusIcon = styled.div<{ $status: string }>`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: ${props => {
    switch (props.$status) {
      case 'success': return '#48bb78';
      case 'error': return '#f56565';
      default: return '#3182ce';
    }
  }};
`;

const Spinner = styled.div`
  width: 4rem;
  height: 4rem;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Message = styled.h2<{ $status: string }>`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: ${props => {
    switch (props.$status) {
      case 'success': return '#2d3748';
      case 'error': return '#c53030';
      default: return '#4a5568';
    }
  }};
  line-height: 1.5;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: #e2e8f0;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 1.5rem;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #3182ce, #667eea);
  border-radius: 2px;
  animation: progress 2s ease-in-out infinite;

  @keyframes progress {
    0% { width: 0%; }
    50% { width: 70%; }
    100% { width: 100%; }
  }
`;

const RetryButton = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #3182ce;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #2c5aa0;
  }
`;

const SuccessDetails = styled.p`
  color: #718096;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
`;