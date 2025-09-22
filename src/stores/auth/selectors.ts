// Auth Store Selectors

import React from 'react';
import { useAuthStore } from './authStore';
import type { AuthState } from './types';

/**
 * 인증 상태만 선택하는 셀렉터
 */
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

/**
 * 사용자 정보만 선택하는 셀렉터
 */
export const useUser = () =>
  useAuthStore((state) => state.user);

/**
 * 로딩 상태만 선택하는 셀렉터
 */
export const useAuthLoading = () =>
  useAuthStore((state) => state.isLoading);

/**
 * 에러 상태만 선택하는 셀렉터
 */
export const useAuthError = () =>
  useAuthStore((state) => state.error);

/**
 * 사용자 정보 중 필요한 부분만 선택하는 셀렉터
 * 무한 루프 방지를 위해 각 필드를 개별적으로 선택
 */
export const useUserProfile = () => {
  const user = useAuthStore((state) => state.user);

  return React.useMemo(() => {
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      profileImageUrl: user.profileImageUrl,
    };
  }, [user?.id, user?.name, user?.email, user?.profileImageUrl]);
};

/**
 * 인증 액션들만 선택하는 셀렉터
 */
export const useAuthActions = () =>
  useAuthStore((state) => ({
    loginWithGoogle: state.loginWithGoogle,
    setUserFromToken: state.setUserFromToken,
    getUserProfile: state.getUserProfile,
    logout: state.logout,
    refreshToken: state.refreshToken,
    setUser: state.setUser,
    setLoading: state.setLoading,
    setError: state.setError,
    clearError: state.clearError,
    reset: state.reset,
  }));

/**
 * 로그인 관련 상태와 액션만 선택하는 셀렉터
 * 개별 상태만 선택하여 무한 루프 방지
 */
export const useLogin = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const isServiceReady = useAuthStore((state) => state.isServiceReady);
  const loginWithGoogle = useAuthStore((state) => state.loginWithGoogle);
  const clearError = useAuthStore((state) => state.clearError);

  return React.useMemo(() => ({
    isLoading,
    error,
    isServiceReady,
    loginWithGoogle,
    clearError,
  }), [isLoading, error, isServiceReady, loginWithGoogle, clearError]);
};

/**
 * 전체 인증 상태 (읽기 전용)
 */
export const useAuthStatus = () =>
  useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    isLoading: state.isLoading,
    error: state.error,
  }));

/**
 * 커스텀 셀렉터 생성 유틸리티
 */
export const createAuthSelector = <T>(selector: (state: AuthState) => T) =>
  () => useAuthStore(selector);