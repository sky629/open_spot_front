// 인증 상태 관리를 위한 React Context
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useEffect, useState, useRef, ReactNode } from 'react';
import { AuthService } from '../features/auth/services/authService';
import { useAuthStore } from '../stores/auth';
import { logger } from '../utils/logger';
import type { User } from '../types';

// authService 인스턴스 생성 (API 호출용)
const authService = new AuthService();

export interface AuthContextType {
  // 상태
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 액션
  setUserFromToken: (token: string) => Promise<void>;
  setUser: (user: User) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // 인증 상태 확인
  const isAuthenticated = !!user && authService.isAuthenticated();

  // 초기 로드 시 access_token 검증 및 사용자 정보 로드
  useEffect(() => {
    // React StrictMode에서 useEffect가 두 번 실행되는 것을 방지
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing auth...');

        // 1. Store에 access_token이 있는지 확인
        const accessToken = useAuthStore.getState().accessToken;

        if (accessToken) {
          // access_token이 있으면 바로 사용자 정보 가져오기
          try {
            console.log('🔑 Access token found in store, fetching user profile...');
            const user = await authService.getUserProfile();

            console.log('✅ User authenticated with access token:', { id: user.id, name: user.name });

            // React Context와 Zustand 모두 업데이트
            setUser(user);
            useAuthStore.getState().setUser(user);
            return;
          } catch (error) {
            // access_token이 만료되었거나 유효하지 않음
            console.log('⚠️ Access token invalid, clearing and attempting refresh...');
            useAuthStore.getState().setAccessToken(null);
          }
        }

        // 2. access_token이 없거나 유효하지 않으면 refresh 시도
        try {
          console.log('🔄 Attempting token refresh with HttpOnly cookie...');
          const response = await authService.refreshAccessToken();

          if (response && response.access_token) {
            // 새 access_token을 store에 저장
            useAuthStore.getState().setAccessToken(response.access_token);
            console.log('✅ Access token refreshed and stored');

            // 사용자 정보 가져오기
            const user = await authService.getUserProfile();
            console.log('✅ User authenticated:', { id: user.id, name: user.name });

            setUser(user);
            useAuthStore.getState().setUser(user);
          }
        } catch (error) {
          // Refresh도 실패 - 정상적인 미인증 상태
          console.log('ℹ️ No valid authentication, user not authenticated');
          logger.info('No valid authentication', error);

          // 명시적으로 null 설정 (Zustand도 동기화)
          setUser(null);
          useAuthStore.getState().setUser(null);
          useAuthStore.getState().setAccessToken(null);
        }
      } catch (error) {
        console.error('💥 Failed to initialize auth:', error);
        logger.error('Failed to initialize auth', error);

        // 예상치 못한 오류 발생 시에도 미인증 상태로 설정
        setUser(null);
        useAuthStore.getState().setUser(null);
        useAuthStore.getState().setAccessToken(null);
      } finally {
        console.log('🏁 Auth initialization completed');
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);


  // JWT 토큰으로부터 사용자 설정 (백엔드 OAuth 성공 후)
  const setUserFromToken = async (token: string): Promise<void> => {
    try {
      logger.userAction('Setting user from JWT token', { tokenLength: token.length });

      const userWithTokens = await authService.setUserFromToken(token);

      // React Context 상태 업데이트
      setUser(userWithTokens.user);

      // Zustand 스토어에도 동기화 (지속성 보장)
      useAuthStore.getState().setUser(userWithTokens.user);

      logger.userAction('User set from token successfully', { userId: userWithTokens.user.id });
    } catch (error) {
      logger.error('Failed to set user from token', error);
      throw error;
    }
  };

  // 사용자 정보 설정
  const setUserData = (userData: User): void => {
    setUser(userData);
    useAuthStore.getState().setUser(userData);
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setAccessToken(null);
      logger.userAction('User logged out');
    } catch (error) {
      logger.error('Logout failed', error);
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      setUser(null);
      useAuthStore.getState().setUser(null);
      useAuthStore.getState().setAccessToken(null);
    }
  };

  // 사용자 정보 새로고침 (HttpOnly Cookie 검증 포함)
  const refreshUser = async (): Promise<void> => {
    try {
      // OAuth 콜백 후 쿠키로 사용자 정보 가져오기
      // isAuthenticated 체크 제거: 쿠키는 있지만 user 상태가 아직 없을 수 있음
      const updatedUser = await authService.getUserProfile();
      setUser(updatedUser);
      useAuthStore.getState().setUser(updatedUser);
      logger.info('User profile refreshed');
    } catch (error) {
      logger.error('Failed to refresh user profile', error);
      // 인증 실패 시 로그아웃 처리
      if (error instanceof Error && (error as { response?: { status: number } }).response?.status === 401) {
        logout();
      }
      throw error;
    }
  };

  // HttpOnly Cookie 방식에서는 토큰 자동 갱신 불필요
  // 백엔드가 API 응답마다 Set-Cookie로 자동 갱신함

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    setUserFromToken,
    setUser: setUserData,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// AuthContext와 타입을 export (useAuth 훅은 별도 파일로 분리됨)