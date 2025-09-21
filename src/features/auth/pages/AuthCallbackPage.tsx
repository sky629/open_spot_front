// Auth Callback Page Component

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { useAuthActions } from '../../../stores/auth';
import { logger } from '../../../utils/logger';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUserFromToken, setError } = useAuthActions();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('인증을 처리하는 중입니다...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL에서 토큰 또는 인증 코드 추출
        const token = searchParams.get('token');
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`OAuth Error: ${error}`);
        }

        if (token) {
          // JWT 토큰이 있는 경우
          logger.userAction('Processing auth callback with token');
          setMessage('사용자 정보를 설정하는 중...');

          await setUserFromToken(token);

          setStatus('success');
          setMessage('로그인이 완료되었습니다. 잠시 후 이동합니다...');

          // 2초 후 메인 페이지로 이동
          setTimeout(() => {
            navigate('/map', { replace: true });
          }, 2000);

        } else if (code) {
          // 인증 코드가 있는 경우 (추후 구현)
          logger.userAction('Processing auth callback with code');
          setMessage('인증 코드를 처리하는 중...');

          // TODO: 인증 코드로 토큰 교환 로직 구현
          throw new Error('Authorization code processing not implemented yet');

        } else {
          throw new Error('No token or code provided in callback');
        }

      } catch (error) {
        logger.error('Auth callback failed', error);

        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setError(errorMessage);
        setStatus('error');
        setMessage('로그인 처리 중 오류가 발생했습니다.');

        // 5초 후 로그인 페이지로 이동
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 5000);
      }
    };

    handleAuthCallback();
  }, [searchParams, setUserFromToken, setError, navigate]);

  const handleRetryLogin = () => {
    navigate('/login', { replace: true });
  };

  return (
    <Container>
      <Content>
        <StatusIcon status={status}>
          {status === 'processing' && <Spinner />}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </StatusIcon>

        <Message status={status}>{message}</Message>

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

const StatusIcon = styled.div<{ status: string }>`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: ${props => {
    switch (props.status) {
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

const Message = styled.h2<{ status: string }>`
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: ${props => {
    switch (props.status) {
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