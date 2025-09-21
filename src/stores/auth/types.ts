// Auth Store Types

import type { User } from '../../types';

export interface AuthState {
  // 상태
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isServiceReady: boolean;

  // 액션
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setServiceReady: (ready: boolean) => void;

  // 비동기 액션
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithGoogleCode: (authorizationCode: string) => Promise<void>;
  setUserFromToken: (token: string) => Promise<void>;
  getUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // 유틸리티
  clearError: () => void;
  reset: () => void;
}

export interface AuthActions {
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

export interface AuthAsyncActions {
  loginWithGoogle: (accessToken: string) => Promise<void>;
  loginWithGoogleCode: (authorizationCode: string) => Promise<void>;
  setUserFromToken: (token: string) => Promise<void>;
  getUserProfile: () => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}