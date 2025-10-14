// Location Store Implementation with Zustand

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LocationState } from './types';
import type { LocationResponse, GetLocationsParams, CreateLocationRequest } from '../../types';
import type { ILocationService } from '../../core/interfaces';
import { logger } from '../../utils/logger';

// 의존성 주입을 위한 서비스 참조
let locationService: ILocationService | null = null;

// 중복 호출 방지를 위한 플래그들
let isFetchingLocations = false;
let isFetchingByBounds = false;

export const setLocationServiceForStore = (service: ILocationService) => {
  locationService = service;
};

// 위치 개수 계산 유틸리티
const calculateLocationCounts = (locations: LocationResponse[]): Record<string, number> => {
  const counts: Record<string, number> = {};

  locations.forEach(location => {
    if (location.category) {
      counts[location.category] = (counts[location.category] || 0) + 1;
    }
  });

  return counts;
};

const initialState = {
  locations: [],
  selectedLocation: null,
  isLoading: false,
  error: null,
  locationCounts: {},
  currentCategory: null,
  currentBounds: null,
};

export const useLocationStore = create<LocationState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // 동기 액션들
      setLocations: (locations: LocationResponse[]) => {
        const locationCounts = calculateLocationCounts(locations);
        set((state) => ({
          ...state,
          locations,
          locationCounts,
          error: null,
        }));

        logger.info('Locations set in store', { count: locations.length });
      },

      setSelectedLocation: (location: LocationResponse | null) => {
        set((state) => ({
          ...state,
          selectedLocation: location,
        }));

        if (location) {
          logger.info('Location selected', { locationId: location.id });
        } else {
          logger.info('Location selection cleared');
        }
      },

      setLoading: (loading: boolean) => {
        set((state) => ({
          ...state,
          isLoading: loading,
        }));
      },

      setError: (error: string | null) => {
        set((state) => ({
          ...state,
          error,
          isLoading: error ? false : state.isLoading,
        }));

        if (error) {
          logger.error('Location store error', new Error(error));
        }
      },

      setCurrentCategory: (category: string | null) => {
        set((state) => ({
          ...state,
          currentCategory: category,
        }));

        logger.info('Category filter changed', { category });
      },

      setCurrentBounds: (bounds: LocationState['currentBounds']) => {
        set((state) => ({
          ...state,
          currentBounds: bounds,
        }));

        if (bounds) {
          logger.debug('Map bounds updated', { bounds });
        }
      },

      clearError: () => {
        set((state) => ({
          ...state,
          error: null,
        }));
      },

      reset: () => {
        set(initialState);
        logger.info('Location store reset');
      },

      // 비동기 액션들
      fetchLocations: async (params?: GetLocationsParams) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        // 중복 호출 방지
        if (isFetchingLocations) {
          logger.debug('fetchLocations already in progress, skipping...');
          return;
        }

        const { setLoading, setError, setLocations } = get();

        try {
          isFetchingLocations = true;
          setLoading(true);
          setError(null);

          logger.info('Fetching locations', { params });

          const locations = await locationService.getLocations(params);
          setLocations(locations);

          logger.info('Locations fetched successfully', { count: locations.length });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch locations';
          setError(errorMessage);
          logger.error('Failed to fetch locations in store', error);
          throw error;
        } finally {
          isFetchingLocations = false;
          setLoading(false);
        }
      },

      fetchLocationsByBounds: async (
        northEast: { lat: number; lng: number },
        southWest: { lat: number; lng: number },
        category?: string
      ) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        // 중복 호출 방지
        if (isFetchingByBounds) {
          logger.debug('fetchLocationsByBounds already in progress, skipping...');
          return;
        }

        const { setLoading, setError, setLocations, setCurrentBounds, setCurrentCategory } = get();

        try {
          isFetchingByBounds = true;
          setLoading(true);
          setError(null);

          // 현재 필터 상태 업데이트
          setCurrentBounds({ northEast, southWest });
          if (category !== undefined) {
            setCurrentCategory(category);
          }

          logger.info('Fetching locations by bounds', {
            northEast,
            southWest,
            category
          });

          const locations = await locationService.getLocationsByBounds(
            northEast,
            southWest,
            category
          );
          setLocations(locations);

          logger.info('Locations fetched by bounds successfully', {
            count: locations.length,
            category
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch locations by bounds';
          setError(errorMessage);
          logger.error('Failed to fetch locations by bounds in store', error);
          throw error;
        } finally {
          isFetchingByBounds = false;
          setLoading(false);
        }
      },

      refreshLocations: async () => {
        const { currentBounds, currentCategory, fetchLocations, fetchLocationsByBounds } = get();

        try {
          logger.info('Refreshing locations');

          if (currentBounds) {
            // 현재 경계 기준으로 새로고침
            await fetchLocationsByBounds(
              currentBounds.northEast,
              currentBounds.southWest,
              currentCategory || undefined
            );
          } else {
            // 전체 새로고침
            await fetchLocations({ category: currentCategory || undefined });
          }

          logger.info('Locations refreshed successfully');
        } catch (error) {
          logger.error('Failed to refresh locations', error);
          throw error;
        }
      },

      // 새 장소 생성
      createLocation: async (request: CreateLocationRequest) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        const { setLoading, setError, setLocations, locations } = get();

        set({ isLoading: true, error: null });

        try {
          logger.info('Creating new location', { request });

          const newLocation = await locationService.createLocation(request);

          // 기존 locations 배열에 새 장소 추가
          const updatedLocations = [...locations, newLocation];
          const locationCounts = calculateLocationCounts(updatedLocations);

          set({
            locations: updatedLocations,
            locationCounts,
            isLoading: false,
            selectedLocation: newLocation, // 새로 생성된 장소 선택
          });

          logger.info('Location created successfully', { locationId: newLocation.id });
          return newLocation;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create location';
          set({ error: errorMessage, isLoading: false });
          logger.error('Failed to create location in store', error);
          throw error;
        }
      },
    }),
    {
      name: 'location-store',
    }
  )
);

// 개발 모드에서 스토어 상태 모니터링 (무한 루프 방지를 위해 임시 비활성화)
// if (import.meta.env.DEV) {
//   useLocationStore.subscribe((state) => {
//     console.debug('📍 Location Store State Change:', {
//       locationCount: state.locations.length,
//       selectedLocationId: state.selectedLocation?.id,
//       isLoading: state.isLoading,
//       error: state.error,
//       currentCategory: state.currentCategory,
//       hasBounds: !!state.currentBounds,
//     });
//   });
// }