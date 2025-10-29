// User Profile Component

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useUser, useAuthStore } from '../../../stores/auth';
import { logger } from '../../../utils/logger';
import { useNavigate } from 'react-router-dom';
import { media } from '../../../styles';

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isDropdownOpen]);

  if (!user) {
    return (
      <Container className={className}>
        <ErrorMessage>사용자 정보를 불러올 수 없습니다.</ErrorMessage>
      </Container>
    );
  }

  return (
    <Container className={className} ref={dropdownRef}>
      <ProfileHeader onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
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
          onClick={(e) => {
            e.stopPropagation();
            handleLogout();
          }}
          disabled={isLoggingOut}
          title={isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        >
          {isLoggingOut ? '⏳' : '🚪'}
        </LogoutButton>
      </ProfileHeader>

      {isDropdownOpen && (
        <DropdownMenu>
          <DropdownHeader>
            <DropdownUserName>{user.name || '사용자'}</DropdownUserName>
            <DropdownUserEmail>{user.email || 'user@example.com'}</DropdownUserEmail>
          </DropdownHeader>
          <DropdownDivider />
          <DropdownLogoutButton
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
              setIsDropdownOpen(false);
            }}
            disabled={isLoggingOut}
          >
            🚪 로그아웃
          </DropdownLogoutButton>
        </DropdownMenu>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;

  ${media.mobile} {
    gap: 0.5rem;
  }
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

  ${media.mobile} {
    display: none;
  }
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

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  margin-top: 0.5rem;
  z-index: 100;
  overflow: hidden;
`;

const DropdownHeader = styled.div`
  padding: 0.75rem 1rem;
  background: #f5f5f5;
`;

const DropdownUserName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const DropdownUserEmail = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin: 0.25rem 0 0 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: #e0e0e0;
`;

const DropdownLogoutButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  background: transparent;
  color: #333;
  font-size: 0.875rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #f5f5f5;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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