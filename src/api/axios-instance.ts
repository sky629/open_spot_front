import Axios, { AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const axiosInstance = Axios.create({
  baseURL: BACKEND_URL,
  timeout: 10000,
  withCredentials: true, // refresh_token HttpOnly 쿠키 전송용
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: access_token을 Zustand store에서 읽어 Bearer 헤더 추가
axiosInstance.interceptors.request.use(
  (config) => {
    // Zustand store에서 access_token 읽기
    const accessToken = useAuthStore.getState().accessToken;

    // access_token이 있으면 Authorization 헤더 추가
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('🔵 [Hybrid Token] API Request with Bearer token:', {
        url: config.url,
        method: config.method,
        tokenPreview: accessToken.substring(0, 30) + '...' + accessToken.substring(accessToken.length - 30),
        authHeader: config.headers.Authorization.substring(0, 50) + '...',
      });
    } else {
      console.log('🔵 API Request (no token):', {
        url: config.url,
        method: config.method,
      });
    }

    console.log('🔵 Request Headers:', {
      ...config.headers,
      Authorization: config.headers.Authorization ? '[PRESENT]' : '[MISSING]',
    });

    return config;
  },
  (error) => {
    console.error('🔴 Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

// Token Refresh 상태 관리
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};

// Response Interceptor: 자동 Token Refresh
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('🟢 API Response:', {
      url: response.config.url,
      status: response.status,
      headers: response.headers,
      hasSetCookie: !!response.headers['set-cookie'],
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    console.error('🔴 API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      responseData: error.response?.data,
      responseHeaders: error.response?.headers,
      requestHeaders: error.config?.headers,
    });

    // 401 상세 분석
    if (error.response?.status === 401) {
      console.error('🔴 [401 Unauthorized] Details:', {
        url: error.config?.url,
        method: error.config?.method,
        sentAuthHeader: error.config?.headers?.Authorization ? 'YES' : 'NO',
        authHeaderPreview: error.config?.headers?.Authorization ?
          error.config.headers.Authorization.substring(0, 50) + '...' :
          'N/A',
        backendResponse: error.response?.data,
        backendMessage: error.response?.data?.message || error.response?.statusText,
      });
    }

    // 401 Unauthorized 에러이고, refresh 재시도가 아닌 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh API 자체가 401이면 로그아웃 (무한 루프 방지)
      if (originalRequest.url?.includes('/auth/token/refresh')) {
        console.error('🔴 Refresh token expired, logging out...');
        isRefreshing = false;
        processQueue(error);
        // 로그아웃 처리 (AuthContext에서 처리하도록 에러 전파)
        return Promise.reject(error);
      }

      // 이미 refresh 중이면 대기열에 추가
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Refresh 완료 후 원래 요청 재시도
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('🔄 Access token expired, refreshing...');

        // Refresh API 호출 (refresh_token HttpOnly Cookie 자동 전송)
        const response = await axiosInstance.post<{ accessToken: string }>('/api/v1/auth/token/refresh');

        // Response body에서 새 accessToken 추출하여 store에 저장 (camelCase)
        if (response.data && response.data.accessToken) {
          useAuthStore.getState().setAccessToken(response.data.accessToken);
          console.log('✅ Token refreshed and stored successfully');
        }

        // 대기 중인 요청들 처리
        processQueue();

        // 원래 요청 재시도 (새 access_token이 store에 있음)
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.error('🔴 Token refresh failed:', refreshError);

        // Refresh 실패 시 대기 중인 요청들도 실패 처리
        processQueue(refreshError);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Hybrid Token 방식
// - access_token: 일반 Cookie → JavaScript로 읽어서 Authorization: Bearer 헤더에 추가
// - refresh_token: HttpOnly Cookie → JavaScript 접근 불가, Refresh API만 사용
// - withCredentials: true → refresh_token HttpOnly 쿠키 자동 전송
// - 토큰 갱신: /api/v1/auth/token/refresh 호출 시 refresh_token HttpOnly 쿠키 자동 전송

// Orval이 사용할 커스텀 Axios 인스턴스
export const customAxiosInstance = <T>(config: AxiosRequestConfig): Promise<T> => {
  return axiosInstance.request<T>(config).then((response) => response.data);
};

export default customAxiosInstance;
