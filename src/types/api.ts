// API 타입 정의
// NOTE: 대부분의 API 타입은 Orval이 자동 생성합니다 (src/api/generated/model/)
// 여기에는 프론트엔드 호환성을 위한 타입과 Orval이 생성하지 않는 타입만 정의합니다

// Orval 생성 타입 import
import type {
  LocationResponse as OrvalLocationResponse,
  SortByParamParameter,
} from '../api/generated/model';

// Orval 타입 그대로 re-export
export type { UserResponse, CategoryResponse } from '../api/generated/model';

// SortBy enum re-export
export type LocationSortBy = SortByParamParameter;
export { SortByParamParameter } from '../api/generated/model';

// 공통 API 응답 타입 (Orval ApiResponse와 호환)
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 프론트엔드 호환 타입 - 기존 코드와의 호환성을 위해 유지
// Orval 타입을 확장하여 latitude/longitude 접근 가능하도록 함
export interface LocationResponse extends Omit<OrvalLocationResponse, 'category' | 'coordinates' | 'address' | 'distance'> {
  latitude: number;
  longitude: number;
  coordinates: OrvalLocationResponse['coordinates'];
  category: string; // CategoryInfo 대신 string 사용
  address?: string; // null을 undefined로 변환
  distance?: number; // null을 undefined로 변환
}

export interface CreateLocationRequest {
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  categoryId?: string;
  iconUrl?: string;
  rating?: number;
  review?: string;
  address?: string;
  tags?: string[];
  groupId?: string;
}

export interface UpdateLocationRequest extends Partial<CreateLocationRequest> {
  id: string;
}

export interface GetLocationsParams {
  category?: string;
  categoryId?: string;
  groupId?: string;
  bounds?: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  };
  limit?: number;
  offset?: number;
  page?: number;
  size?: number;
  sortBy?: LocationSortBy;
}

// 프론트엔드 전용 타입 - Orval이 생성하지 않는 타입들
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
  accessToken?: string;   // HttpOnly Cookie 방식에서는 사용 안 함
  refreshToken?: string;  // HttpOnly Cookie 방식에서는 사용 안 함
  expiresAt?: string;     // HttpOnly Cookie 방식에서는 사용 안 함
}

export interface GoogleLoginRequest {
  accessToken: string;
}

export interface GoogleLoginResponse {
  user: User;
  tokens: AuthTokens | null;  // HttpOnly Cookie 방식에서는 null
}