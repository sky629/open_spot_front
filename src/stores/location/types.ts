// Location Store Types

import type { LocationResponse, GetLocationsParams, CreateLocationRequest, UpdateLocationRequest } from '../../types';

export interface LocationState {
  // 상태
  locations: LocationResponse[];
  selectedLocation: LocationResponse | null;
  shouldFocusOnMap: boolean; // "지도에서 보기" 버튼 클릭 시 true
  openInfoWindow: { close: () => void } | null; // 현재 열린 정보창 참조
  isLoading: boolean;
  error: string | null;
  locationCounts: Record<string, number>;

  // 필터 상태
  currentCategory: string | null;
  currentGroupId: string | null;
  currentBounds: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  } | null;

  // 액션
  setLocations: (locations: LocationResponse[]) => void;
  setSelectedLocation: (location: LocationResponse | null) => void;
  focusLocationOnMap: (location: LocationResponse) => void; // 지도에서 포커스 (지도 이동 포함)
  setOpenInfoWindow: (infoWindow: { close: () => void } | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentCategory: (category: string | null) => void;
  setCurrentGroupId: (groupId: string | null) => void;
  setCurrentBounds: (bounds: LocationState['currentBounds']) => void;

  // 비동기 액션
  fetchLocations: (params?: GetLocationsParams) => Promise<void>;
  fetchLocationsByBounds: (
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    category?: string,
    groupId?: string
  ) => Promise<void>;
  refreshLocations: () => Promise<void>;
  createLocation: (request: CreateLocationRequest) => Promise<LocationResponse>;
  updateLocation: (requestData: UpdateLocationRequest) => Promise<LocationResponse>;
  deleteLocation: (id: string) => Promise<void>;
  addLocationToGroup: (requestData: UpdateLocationRequest) => Promise<LocationResponse>;
  removeLocationFromGroup: (requestData: UpdateLocationRequest) => Promise<LocationResponse>;

  // 유틸리티
  clearError: () => void;
  reset: () => void;
}

export interface LocationActions {
  setLocations: (locations: LocationResponse[]) => void;
  setSelectedLocation: (location: LocationResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentCategory: (category: string | null) => void;
  setCurrentBounds: (bounds: LocationState['currentBounds']) => void;
  clearError: () => void;
  reset: () => void;
}

export interface LocationAsyncActions {
  fetchLocations: (params?: GetLocationsParams) => Promise<void>;
  fetchLocationsByBounds: (
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    category?: string
  ) => Promise<void>;
  refreshLocations: () => Promise<void>;
  createLocation: (request: CreateLocationRequest) => Promise<LocationResponse>;
}