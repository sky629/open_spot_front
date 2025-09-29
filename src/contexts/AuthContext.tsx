// 인증 상태 관리를 위한 React Context
/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useEffect, useState, useRef, ReactNode } from 'react';
import { authService } from '../services/authService';
import { logger } from '../utils/logger';
import type { User } from '../types';

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

  // 초기 로드 시 저장된 인증 정보 확인
  useEffect(() => {
    // React StrictMode에서 useEffect가 두 번 실행되는 것을 방지
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initializeAuth = async () => {
      try {
        console.log('🔍 Initializing auth...');
        
        // 로컬 스토리지에서 사용자 정보 로드
        const savedUser = authService.getUser();
        const isAuthenticated = authService.isAuthenticated();
        
        console.log('📦 Retrieved from storage:', { 
          savedUser: savedUser ? { id: savedUser.id, name: savedUser.name } : null,
          isAuthenticated 
        });

        if (savedUser && isAuthenticated) {
          console.log('✅ Setting user from cached data');
          setUser(savedUser);

          // 백엔드에서 최신 사용자 정보 가져오기 (선택적)
          try {
            console.log('🔄 Fetching updated user profile from backend...');
            const updatedUser = await authService.getUserProfile();
            console.log('✅ Updated user profile:', { id: updatedUser.id, name: updatedUser.name });
            setUser(updatedUser);
          } catch (error) {
            // 프로필 조회 실패 시 저장된 정보 사용
            console.log('⚠️ Backend profile fetch failed, using cached data');
            logger.warn('Failed to refresh user profile, using cached data', error);
          }
        } else {
          console.log('❌ No valid user data found');
        }
      } catch (error) {
        console.error('💥 Failed to initialize auth:', error);
        logger.error('Failed to initialize auth', error);
        // 인증 데이터가 손상된 경우 로그아웃 처리
        authService.logout();
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
      setUser(userWithTokens.user);

      logger.userAction('User set from token successfully', { userId: userWithTokens.user.id });
    } catch (error) {
      logger.error('Failed to set user from token', error);
      throw error;
    }
  };

  // 사용자 정보 설정
  const setUserData = (userData: User): void => {
    setUser(userData);
  };

  // 로그아웃
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
      setUser(null);
      logger.userAction('User logged out');
    } catch (error) {
      logger.error('Logout failed', error);
      // 서버 로그아웃 실패해도 로컬 로그아웃은 진행
      setUser(null);
    }
  };

  // 사용자 정보 새로고침
  const refreshUser = async (): Promise<void> => {
    try {
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const updatedUser = await authService.getUserProfile();
      setUser(updatedUser);
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

  // 토큰 만료 감지 및 자동 갱신
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = async () => {
      try {
        if (authService.isTokenExpired()) {
          await authService.refreshAccessToken();
          logger.info('Token automatically refreshed');
        }
      } catch (error) {
        logger.warn('Automatic token refresh failed, logging out', error as Error);
        logout();
      }
    };

    // 5분마다 토큰 만료 확인
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]); // isAuthenticated 의존성 복구

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