// Auth Store Implementation with Zustand

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { AuthState } from './types';
import type { User } from '../../types';
import type { LoginError } from '../../features/auth/types';
import type { IAuthService } from '../../core/interfaces/IAuthService';
import { logger } from '../../utils/logger';

// 의존성 주입을 위한 서비스 참조
let authService: IAuthService | null = null;
let serviceRegistered = false;

export const setAuthServiceForStore = (service: IAuthService) => {
  // 중복 등록 방지
  if (serviceRegistered && authService === service) {
    logger.debug('Auth service already registered, skipping');
    return;
  }

  authService = service;
  serviceRegistered = true;

  // 서비스가 주입되면 스토어에 준비 완료 상태 설정
  // 직접 호출하여 무한 루프 방지
  try {
    const store = useAuthStore.getState();
    if (store && !store.isServiceReady) {
      store.setServiceReady(true);
      logger.info('✅ Auth service registered and store updated');
    }
  } catch (error) {
    logger.error('Failed to update service ready state', error);
  }
};

const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginError: null,
  isServiceReady: false,
};

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // 동기 액션들
        setUser: (user: User | null) => {
          set((state) => {
            // 같은 사용자이면 업데이트하지 않음 (무한 루프 방지)
            if (state.user === user) {
              return state;
            }

            return {
              ...state,
              user,
              isAuthenticated: !!user,
              error: null,
            };
          });

          if (user) {
            logger.info('User set in store', { userId: user.id });
          } else {
            logger.info('User cleared from store');
          }
        },

        setAccessToken: (token: string | null) => {
          set(() => {
            return {
              accessToken: token,
            };
          });

          if (token) {
            logger.info('Access token set in store');
          } else {
            logger.info('Access token cleared from store');
          }
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            // 같은 로딩 상태이면 업데이트하지 않음
            if (state.isLoading === loading) {
              return state;
            }

            return {
              ...state,
              isLoading: loading,
            };
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            // 같은 에러이면 업데이트하지 않음
            if (state.error === error) {
              return state;
            }

            return {
              ...state,
              error,
              isLoading: error ? false : state.isLoading,
            };
          });

          if (error) {
            logger.error('Auth store error', new Error(error));
          }
        },

        setLoginError: (error: LoginError | null) => {
          set((state) => {
            // 같은 에러이면 업데이트하지 않음
            if (state.loginError === error) {
              return state;
            }

            return {
              ...state,
              loginError: error,
              isLoading: error ? false : state.isLoading,
            };
          });

          if (error) {
            logger.error('Login error in store', {
              code: error.code,
              message: error.message,
              details: error.details,
              timestamp: error.timestamp
            });
          }
        },

        clearError: () => {
          set((state) => {
            // 이미 에러가 없으면 업데이트하지 않음
            if (!state.error) {
              return state;
            }

            return {
              ...state,
              error: null,
            };
          });
        },

        clearLoginError: () => {
          set((state) => {
            // 이미 로그인 에러가 없으면 업데이트하지 않음
            if (!state.loginError) {
              return state;
            }

            return {
              ...state,
              loginError: null,
            };
          });
        },

        setServiceReady: (ready: boolean) => {
          const currentState = get();
          // 상태가 이미 같으면 업데이트 하지 않음 (무한 루프 방지)
          if (currentState.isServiceReady === ready) {
            return;
          }

          set((state) => ({
            ...state,
            isServiceReady: ready,
          }));

          if (ready) {
            logger.info('Auth service ready');
          }
        },

        reset: () => {
          set(initialState);
          logger.info('Auth store reset');
        },

        // 비동기 액션들

        setUserFromToken: async (token: string) => {
          const { isServiceReady, isLoading, user } = get();

          if (!isServiceReady || !authService) {
            const errorMessage = 'Authentication service is not ready. Please wait...';
            set((state) => ({ ...state, error: errorMessage }));
            throw new Error(errorMessage);
          }

          // 이미 로딩 중이거나 사용자가 설정되어 있으면 중복 처리 방지
          if (isLoading) {
            logger.debug('setUserFromToken already in progress, skipping...');
            return;
          }

          if (user) {
            logger.debug('User already set, skipping setUserFromToken...');
            return;
          }

          try {
            set((state) => ({ ...state, isLoading: true, error: null }));

            logger.userAction('Setting user from JWT token');

            const loginResponse = await authService.setUserFromToken(token);

            // Zustand store 상태 업데이트 (persist 동작 보장)
            set((state) => ({
              ...state,
              user: loginResponse.user,
              isAuthenticated: !!loginResponse.user,
              isLoading: false,
              error: null
            }));

            logger.userAction('User set from token successfully via Zustand', {
              userId: loginResponse.user.id
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to set user from token';
            set((state) => ({ ...state, error: errorMessage, isLoading: false }));
            logger.error('Failed to set user from token in store', error);
            throw error;
          }
        },

        getUserProfile: async () => {
          const { isServiceReady } = get();

          if (!isServiceReady || !authService) {
            const errorMessage = 'Authentication service is not ready. Please wait...';
            set((state) => ({ ...state, error: errorMessage }));
            throw new Error(errorMessage);
          }

          const { setLoading, setError, setUser, isAuthenticated } = get();

          if (!isAuthenticated) {
            setError('User not authenticated');
            return;
          }

          try {
            setLoading(true);
            setError(null);

            const updatedUser = await authService.getUserProfile();
            setUser(updatedUser);

            logger.info('User profile refreshed successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to refresh user profile';
            setError(errorMessage);
            logger.error('Failed to refresh user profile in store', error);

            // 401 에러인 경우 로그아웃 처리
            if (error instanceof Error && error.message.includes('401')) {
              await get().logout();
            }

            throw error;
          } finally {
            setLoading(false);
          }
        },

        logout: async () => {
          const { isServiceReady } = get();

          if (!isServiceReady || !authService) {
            logger.warn('AuthService not available for logout');
            // 로그아웃은 서비스가 없어도 로컬 상태만 정리
          }

          const { setLoading, setError, setUser } = get();

          try {
            setLoading(true);
            setError(null);

            logger.userAction('Starting logout');

            if (authService) {
              await authService.logout();
            }

            setUser(null);
            logger.userAction('Logout completed successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Logout failed';
            setError(errorMessage);
            logger.error('Logout failed in store', error);

            // 로그아웃 실패해도 로컬 상태는 클리어
            setUser(null);
          } finally {
            setLoading(false);
          }
        },

        refreshToken: async () => {
          const { isServiceReady } = get();

          if (!isServiceReady || !authService) {
            const errorMessage = 'Authentication service is not ready. Please wait...';
            set((state) => ({ ...state, error: errorMessage }));
            throw new Error(errorMessage);
          }

          const { setError, isAuthenticated } = get();

          if (!isAuthenticated) {
            setError('User not authenticated');
            return;
          }

          try {
            await authService.refreshAccessToken();
            setError(null);
            logger.info('Token refreshed successfully in store');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
            setError(errorMessage);
            logger.error('Token refresh failed in store', error);

            // 토큰 갱신 실패 시 로그아웃
            await get().logout();
            throw error;
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          // Hybrid 방식: accessToken과 user를 localStorage에 저장하여 새로고침 시에도 유지
          // refresh_token은 HttpOnly Cookie로 백엔드에서 관리
          accessToken: state.accessToken,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            logger.debug('Auth store rehydrated from localStorage', {
              hasToken: !!state.accessToken,
              hasUser: !!state.user,
            });
          }
        },
      }
    )
  )
);