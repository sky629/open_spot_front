// Loading Spinner Component

import React from 'react';
import styled, { keyframes } from 'styled-components';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  message?: string;
  fullscreen?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = '#3182ce',
  message,
  fullscreen = false,
  className
}) => {
  const Container = fullscreen ? FullscreenContainer : InlineContainer;

  return (
    <Container className={className}>
      <Spinner size={size} color={color} />
      {message && <Message>{message}</Message>}
    </Container>
  );
};

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const Spinner = styled.div<{ size: string; color: string }>`
  width: ${props => {
    switch (props.size) {
      case 'small': return '1.5rem';
      case 'large': return '3rem';
      default: return '2rem';
    }
  }};
  height: ${props => {
    switch (props.size) {
      case 'small': return '1.5rem';
      case 'large': return '3rem';
      default: return '2rem';
    }
  }};
  border: ${props => {
    switch (props.size) {
      case 'small': return '2px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid #e2e8f0;
  border-top: ${props => {
    switch (props.size) {
      case 'small': return '2px';
      case 'large': return '4px';
      default: return '3px';
    }
  }} solid ${props => props.color};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const BaseContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const InlineContainer = styled(BaseContainer)`
  padding: 1rem;
`;

const FullscreenContainer = styled(BaseContainer)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 9999;
  backdrop-filter: blur(2px);
`;

const Message = styled.p`
  margin-top: 1rem;
  color: #4a5568;
  font-size: 0.875rem;
  text-align: center;
  margin-bottom: 0;
`;

// 다양한 스타일의 로딩 스피너들
export const DotSpinner: React.FC<Omit<LoadingSpinnerProps, 'size'>> = ({
  color = '#3182ce',
  message,
  fullscreen = false,
  className
}) => {
  const Container = fullscreen ? FullscreenContainer : InlineContainer;

  return (
    <Container className={className}>
      <DotContainer>
        <Dot color={color} delay="0s" />
        <Dot color={color} delay="0.2s" />
        <Dot color={color} delay="0.4s" />
      </DotContainer>
      {message && <Message>{message}</Message>}
    </Container>
  );
};

const bounce = keyframes`
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
`;

const DotContainer = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const Dot = styled.div<{ color: string; delay: string }>`
  width: 0.75rem;
  height: 0.75rem;
  background-color: ${props => props.color};
  border-radius: 50%;
  animation: ${bounce} 1.4s ease-in-out ${props => props.delay} infinite both;
`;

// 펄스 애니메이션 스피너
export const PulseSpinner: React.FC<Omit<LoadingSpinnerProps, 'size'>> = ({
  color = '#3182ce',
  message,
  fullscreen = false,
  className
}) => {
  const Container = fullscreen ? FullscreenContainer : InlineContainer;

  return (
    <Container className={className}>
      <PulseCircle color={color} />
      {message && <Message>{message}</Message>}
    </Container>
  );
};

const pulse = keyframes`
  0% { transform: scale(0); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
`;

const PulseCircle = styled.div<{ color: string }>`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${props => props.color};
  animation: ${pulse} 1s ease-out infinite;
`;