// Auth Store Types

import type { User } from '../../types';
import type { LoginError } from '../../features/auth/types';

export interface AuthState {
  // 상태
  user: User | null;
  accessToken: string | null;  // URL 파라미터로 받은 access_token 저장
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginError: LoginError | null;
  isServiceReady: boolean;

  // 액션
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoginError: (error: LoginError | null) => void;
  setServiceReady: (ready: boolean) => void;

  // 비동기 액션
  setUserFromToken: (token: string) => Promise<void>;
  getUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // 유틸리티
  clearError: () => void;
  clearLoginError: () => void;
  reset: () => void;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLoginError: (error: LoginError | null) => void;
  clearError: () => void;
  clearLoginError: () => void;
  reset: () => void;
}

export interface AuthAsyncActions {
  setUserFromToken: (token: string) => Promise<void>;
  getUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}