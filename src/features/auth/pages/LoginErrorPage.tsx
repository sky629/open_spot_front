// Login Error Page Component

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { LoginError } from '../types';
import {
  mapServerErrorCode,
  ERROR_MESSAGES,
  ERROR_TITLES,
  shouldRetryError,
  shouldAutoRetry
} from '../constants';
import { logger } from '../../../utils/logger';

export const LoginErrorPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<LoginError | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const code = searchParams.get('code');
    const msg = searchParams.get('msg');
    const details = searchParams.get('details');

    if (!code) {
      // No error code provided, redirect to login
      navigate('/login', { replace: true });
      return;
    }

    const errorCode = mapServerErrorCode(code);
    const loginError: LoginError = {
      code: errorCode,
      message: msg || ERROR_MESSAGES[errorCode],
      details: details || undefined,
      timestamp: Date.now()
    };

    setError(loginError);

    // Log the error for analytics
    logger.error('Login error occurred', {
      code: errorCode,
      originalCode: code,
      message: loginError.message,
      details: loginError.details,
      userAgent: navigator.userAgent,
      timestamp: loginError.timestamp
    });

    // Auto-retry for certain errors (with backoff)
    if (shouldAutoRetry(errorCode) && retryCount < 2) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      setTimeout(() => {
        logger.info('Auto-retrying login after error', {
          errorCode,
          retryAttempt: retryCount + 1,
          delay
        });
        setRetryCount(prev => prev + 1);
        handleRetry();
      }, delay);
    }
  }, [searchParams, navigate, retryCount]);

  const handleRetry = () => {
    logger.userAction('User clicked retry after login error', { errorCode: error?.code });
    navigate('/login', { replace: true });
  };

  const handleSupport = () => {
    logger.userAction('User requested support after login error', { errorCode: error?.code });
    // TODO: Implement support/help page or modal
    window.open('mailto:support@openspot.com?subject=로그인 문제 문의', '_blank');
  };

  if (!error) {
    return null; // Loading or redirecting
  }

  const canRetry = shouldRetryError(error.code);
  const title = ERROR_TITLES[error.code];

  return (
    <Container>
      <Background />
      <ErrorContent>
        <ErrorIcon>⚠️</ErrorIcon>
        <ErrorTitle>{title}</ErrorTitle>
        <ErrorMessage>{error.message}</ErrorMessage>

        {error.details && (
          <ErrorDetails>
            <DetailsToggle>세부 정보</DetailsToggle>
            <DetailsContent>{error.details}</DetailsContent>
          </ErrorDetails>
        )}

        <ButtonGroup>
          {canRetry && (
            <RetryButton onClick={handleRetry}>
              다시 시도
            </RetryButton>
          )}
          <HomeButton onClick={() => navigate('/login')}>
            로그인 페이지로
          </HomeButton>
          <SupportButton onClick={handleSupport}>
            도움말
          </SupportButton>
        </ButtonGroup>

        {retryCount > 0 && (
          <RetryInfo>
            재시도 횟수: {retryCount}
          </RetryInfo>
        )}
      </ErrorContent>
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Background = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.9;
`;

const ErrorContent = styled.div`
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  max-width: 500px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
`;

const ErrorIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
`;

const ErrorTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.p`
  font-size: 1rem;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const ErrorDetails = styled.details`
  text-align: left;
  margin-bottom: 2rem;
  background: #f7fafc;
  border-radius: 8px;
  padding: 1rem;
`;

const DetailsToggle = styled.summary`
  font-weight: 600;
  color: #4a5568;
  cursor: pointer;
  margin-bottom: 0.5rem;

  &:hover {
    color: #2d3748;
  }
`;

const DetailsContent = styled.div`
  font-size: 0.875rem;
  color: #718096;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: #edf2f7;
  padding: 0.75rem;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 480px) {
    flex-direction: row;
    justify-content: center;
  }
`;

const BaseButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

const RetryButton = styled(BaseButton)`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;

  &:hover {
    background: linear-gradient(135deg, #5a6fd8 0%, #6b4190 100%);
  }
`;

const HomeButton = styled(BaseButton)`
  background: #48bb78;
  color: white;

  &:hover {
    background: #38a169;
  }
`;

const SupportButton = styled(BaseButton)`
  background: #ed8936;
  color: white;

  &:hover {
    background: #dd7724;
  }
`;

const RetryInfo = styled.div`
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #718096;
`;