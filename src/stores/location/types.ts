// Location Store Types

import type { LocationResponse, GetLocationsParams, CreateLocationRequest } from '../../types';

export interface LocationState {
  // 상태
  locations: LocationResponse[];
  selectedLocation: LocationResponse | null;
  isLoading: boolean;
  error: string | null;
  locationCounts: Record<string, number>;

  // 필터 상태
  currentCategory: string | null;
  currentBounds: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  } | null;

  // 액션
  setLocations: (locations: LocationResponse[]) => void;
  setSelectedLocation: (location: LocationResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentCategory: (category: string | null) => void;
  setCurrentBounds: (bounds: LocationState['currentBounds']) => void;

  // 비동기 액션
  fetchLocations: (params?: GetLocationsParams) => Promise<void>;
  fetchLocationsByBounds: (
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    category?: string
  ) => Promise<void>;
  refreshLocations: () => Promise<void>;
  createLocation: (request: CreateLocationRequest) => Promise<LocationResponse>;

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