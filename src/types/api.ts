// API 응답 타입 정의

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface LocationResponse {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  category?: string;
  iconUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationRequest {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  category?: string;
  iconUrl?: string;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  id: string;
}

export interface GetLocationsParams {
  category?: string;
  bounds?: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  };
  limit?: number;
  offset?: number;
}

// 인증 관련 타입 정의
export interface User {
  id: string;
  email: string;
  name: string;
  profileImageUrl?: string;
  provider: 'Google';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface GoogleLoginRequest {
  accessToken: string;
}

export interface GoogleLoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresAt: string;
}

// 분석 서비스 관련 타입 정의
export interface Store {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  category: string;
  businessStatus: 'ACTIVE' | 'INACTIVE' | 'PERMANENTLY_CLOSED';
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  title: string;
  latitude: number;
  longitude: number;
  radius: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  score?: string; // A-F 등급
  analysisData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportRequest {
  title: string;
  latitude: number;
  longitude: number;
  radius: number;
}

export interface GetStoresParams {
  lat: number;
  lon: number;
  radius: number;
  page?: number;
  size?: number;
}