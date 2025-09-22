// User Profile Component

import React, { useState } from 'react';
import styled from 'styled-components';
import { useUser, useAuthStore } from '../../../stores/auth';
import { logger } from '../../../utils/logger';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  onLogout?: () => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogout, className }) => {
  const user = useUser();
  const navigate = useNavigate();
  const authStore = useAuthStore();
  const logout = authStore.logout;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      logger.userAction('User logout initiated');

      await logout();
      navigate('/login');

      logger.userAction('User logout completed');
      onLogout?.();
    } catch (error) {
      logger.error('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (!user) {
    return (
      <Container className={className}>
        <ErrorMessage>사용자 정보를 불러올 수 없습니다.</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container className={className}>
      <ProfileHeader>
        <ProfileImage>
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.name} />
          ) : (
            <DefaultAvatar>
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </DefaultAvatar>
          )}
        </ProfileImage>

        <UserInfo>
          <UserName>{user.name || '사용자'}</UserName>
          <UserEmail>{user.email || 'user@example.com'}</UserEmail>
        </UserInfo>

        <LogoutButton
          onClick={handleLogout}
          disabled={isLoggingOut}
          title={isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        >
          {isLoggingOut ? '⏳' : '🚪'}
        </LogoutButton>
      </ProfileHeader>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ProfileImage = styled.div`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  border: 2px solid rgba(255, 255, 255, 0.3);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.3));
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  backdrop-filter: blur(10px);
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.125rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const UserEmail = styled.p`
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const LogoutButton = styled.button`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  backdrop-filter: blur(10px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  padding: 1rem;
  background-color: #fed7d7;
  color: #c53030;
  border-radius: 8px;
  text-align: center;
  font-size: 0.875rem;
`;