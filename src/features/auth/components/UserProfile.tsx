// User Profile Component

import React, { useState } from 'react';
import styled from 'styled-components';
import { useUser, useAuthStore } from '../../../stores/auth';
import { logger } from '../../../utils/logger';

interface UserProfileProps {
  onLogout?: () => void;
  className?: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ onLogout, className }) => {
  const user = useUser();
  const authStore = useAuthStore();
  const logout = authStore.logout;
  const getUserProfile = authStore.getUserProfile;
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      logger.userAction('User logout initiated');

      await logout();

      logger.userAction('User logout completed');
      onLogout?.();
    } catch (error) {
      logger.error('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleRefreshProfile = async () => {
    try {
      setIsRefreshing(true);
      logger.userAction('Profile refresh initiated');

      await getUserProfile();

      logger.userAction('Profile refresh completed');
    } catch (error) {
      logger.error('Profile refresh failed', error);
    } finally {
      setIsRefreshing(false);
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
          <UserName>{user.name}</UserName>
          <UserEmail>{user.email}</UserEmail>
        </UserInfo>
      </ProfileHeader>

      <ActionButtons>
        <RefreshButton
          onClick={handleRefreshProfile}
          disabled={isRefreshing}
        >
          {isRefreshing ? '새로고침 중...' : '프로필 새로고침'}
        </RefreshButton>

        <LogoutButton
          onClick={handleLogout}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </LogoutButton>
      </ActionButtons>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  max-width: 300px;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ProfileImage = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const DefaultAvatar = styled.div`
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.25rem;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const UserEmail = styled.p`
  font-size: 0.875rem;
  color: #718096;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RefreshButton = styled(Button)`
  background-color: #f7fafc;
  color: #4a5568;
  border: 1px solid #e2e8f0;

  &:hover:not(:disabled) {
    background-color: #edf2f7;
    border-color: #cbd5e0;
  }
`;

const LogoutButton = styled(Button)`
  background-color: #fed7d7;
  color: #c53030;
  border: 1px solid #feb2b2;

  &:hover:not(:disabled) {
    background-color: #fbb6b9;
    border-color: #f687b3;
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