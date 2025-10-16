// Location Store Implementation with Zustand

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { LocationState } from './types';
import type { LocationResponse, GetLocationsParams, CreateLocationRequest, UpdateLocationRequest } from '../../types';
import type { ILocationService } from '../../core/interfaces';
import { logger } from '../../utils/logger';

// 의존성 주입을 위한 서비스 참조
let locationService: ILocationService | null = null;

// 중복 호출 방지를 위한 플래그들
let isFetchingLocations = false;
let isFetchingByBounds = false;

export const setLocationServiceForStore = (service: ILocationService) => {
  locationService = service;
  logger.info('✅ Location service injected into store');
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
  shouldFocusOnMap: false,
  openInfoWindow: null,
  isLoading: false,
  error: null,
  locationCounts: {},
  currentCategory: null,
  currentGroupId: null,
  currentBounds: null,
  searchQuery: '',
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
          shouldFocusOnMap: false, // 마커 클릭 시에는 지도 이동 안함
        }));

        if (location) {
          logger.info('Location selected', { locationId: location.id });
        } else {
          logger.info('Location selection cleared');
        }
      },

      focusLocationOnMap: (location: LocationResponse) => {
        set((state) => ({
          ...state,
          selectedLocation: location,
          shouldFocusOnMap: true, // 지도 이동 플래그 설정
        }));

        logger.info('Focus location on map', { locationId: location.id });

        // 플래그를 다시 false로 되돌림 (한 번만 실행되도록)
        setTimeout(() => {
          set((state) => ({
            ...state,
            shouldFocusOnMap: false,
          }));
        }, 100);
      },

      setOpenInfoWindow: (infoWindow: { close: () => void } | null) => {
        // 이전 정보창이 있으면 닫기
        const currentInfoWindow = get().openInfoWindow;
        if (currentInfoWindow && currentInfoWindow !== infoWindow) {
          try {
            currentInfoWindow.close();
            logger.info('Previous info window closed');
          } catch (error) {
            logger.warn('Failed to close previous info window', error);
          }
        }

        set((state) => ({
          ...state,
          openInfoWindow: infoWindow,
        }));

        if (infoWindow) {
          logger.info('Info window reference stored');
        } else {
          logger.info('Info window reference cleared');
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

      setCurrentGroupId: (groupId: string | null) => {
        set((state) => ({
          ...state,
          currentGroupId: groupId,
        }));

        logger.info('Group filter changed', { groupId });
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

      setSearchQuery: (query: string) => {
        set((state) => ({
          ...state,
          searchQuery: query,
        }));

        logger.debug('Location search query updated', { query });
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
        category?: string,
        groupId?: string
      ) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        // 중복 호출 방지
        if (isFetchingByBounds) {
          logger.debug('fetchLocationsByBounds already in progress, skipping...');
          return;
        }

        const { setLoading, setError, setLocations, setCurrentBounds, setCurrentCategory, setCurrentGroupId } = get();

        try {
          isFetchingByBounds = true;
          setLoading(true);
          setError(null);

          // 현재 필터 상태 업데이트
          setCurrentBounds({ northEast, southWest });
          if (category !== undefined) {
            setCurrentCategory(category);
          }
          if (groupId !== undefined) {
            setCurrentGroupId(groupId);
          }

          logger.info('Fetching locations by bounds', {
            northEast,
            southWest,
            category,
            groupId
          });

          const locations = await locationService.getLocationsByBounds(
            northEast,
            southWest,
            category,
            groupId
          );
          setLocations(locations);

          logger.info('Locations fetched by bounds successfully', {
            count: locations.length,
            category,
            groupId
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
        const { currentBounds, currentCategory, currentGroupId, fetchLocations, fetchLocationsByBounds } = get();

        try {
          logger.info('Refreshing locations');

          if (currentBounds) {
            // 현재 경계 기준으로 새로고침
            await fetchLocationsByBounds(
              currentBounds.northEast,
              currentBounds.southWest,
              currentCategory || undefined,
              currentGroupId || undefined
            );
          } else {
            // 전체 새로고침
            await fetchLocations({
              category: currentCategory || undefined,
              groupId: currentGroupId || undefined
            });
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

        const { locations } = get();

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

      // 장소 수정
      updateLocation: async (requestData: UpdateLocationRequest) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        // 기존 장소 데이터 (그룹 변경 확인용)
        const originalLocation = get().locations.find(loc => loc.id === requestData.id);

        try {
          set({ isLoading: true, error: null });
          logger.info('Updating location', { requestData });

          const updatedLocation = await locationService.updateLocation(requestData);

          // 기존 locations 배열에 수정된 장소 교체
          const updatedLocations = get().locations.map((location) =>
            location.id === updatedLocation.id ? updatedLocation : location
          );
          const locationCounts = calculateLocationCounts(updatedLocations);

          set({
            locations: updatedLocations,
            locationCounts,
            selectedLocation: updatedLocation, // 수정된 장소로 선택 업데이트
            isLoading: false,
          });

          logger.userAction('Location updated successfully', { locationId: updatedLocation.id });

          // 그룹 변경이 있었다면 관련 그룹들 동기화
          if (originalLocation) {
            const { useGroupStore } = await import('../group/groupStore');
            const { updateGroupLocationIds } = useGroupStore.getState();

            const groupsToSync = new Set<string>();

            // 이전 그룹에서 제거되었으면 동기화
            if (originalLocation.groupId && originalLocation.groupId !== updatedLocation.groupId) {
              groupsToSync.add(originalLocation.groupId);
            }

            // 새 그룹에 추가되었으면 동기화
            if (updatedLocation.groupId && updatedLocation.groupId !== originalLocation.groupId) {
              groupsToSync.add(updatedLocation.groupId);
            }

            // 관련 그룹들 동기화
            for (const groupId of groupsToSync) {
              logger.info('Syncing group after location update', { groupId });
              await updateGroupLocationIds(groupId).catch((error) => {
                logger.error('Failed to sync group after location update', error);
              });
            }
          }

          return updatedLocation;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update location';
          set({ error: errorMessage, isLoading: false });
          logger.error('Failed to update location', error);
          throw error;
        }
      },

      // 장소 삭제
      deleteLocation: async (id: string) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        const location = get().locations.find(loc => loc.id === id);
        if (!location) {
          logger.warn('Location not found for deletion', { locationId: id });
          return;
        }

        try {
          set({ isLoading: true, error: null });
          logger.info('Deleting location', { locationId: id, name: location.name, groupId: location.groupId });

          await locationService.deleteLocation(id);

          // locations 배열에서 삭제된 장소 제거
          const updatedLocations = get().locations.filter((loc) => loc.id !== id);
          const locationCounts = calculateLocationCounts(updatedLocations);

          set({
            locations: updatedLocations,
            locationCounts,
            selectedLocation: get().selectedLocation?.id === id ? null : get().selectedLocation,
            isLoading: false,
          });

          logger.userAction('Location deleted successfully', { locationId: id, name: location.name });

          // 그룹에 속한 장소였다면 해당 그룹의 locationIds 동기화
          if (location.groupId) {
            const { useGroupStore } = await import('../group/groupStore');
            const { updateGroupLocationIds } = useGroupStore.getState();

            logger.info('Syncing group after location deletion', { groupId: location.groupId });
            await updateGroupLocationIds(location.groupId).catch((error) => {
              logger.error('Failed to sync group after location deletion', error);
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete location';
          set({ error: errorMessage, isLoading: false });
          logger.error('Failed to delete location', error);
          throw error;
        }
      },

      addLocationToGroup: async (requestData: UpdateLocationRequest) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        try {
          set({ isLoading: true, error: null });
          logger.info('Adding location to group', { requestData });

          const updatedLocation = await locationService.addLocationToGroup(requestData);

          // 기존 locations 배열에 수정된 장소 교체
          set((state) => ({
            locations: state.locations.map((location) =>
              location.id === updatedLocation.id ? updatedLocation : location
            ),
          }));

          logger.userAction('Location added to group successfully', { requestData });
          return updatedLocation;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to add location to group';
          set({ error: errorMessage });
          logger.error('Failed to add location to group', error);
          throw error;
        } finally {
            set({ isLoading: false });
        }
      },

      removeLocationFromGroup: async (requestData: UpdateLocationRequest) => {
        if (!locationService) {
          throw new Error('LocationService not initialized');
        }

        try {
          set({ isLoading: true, error: null });
          logger.info('Removing location from group', { requestData });

          const updatedLocation = await locationService.removeLocationFromGroup(requestData);

          // 기존 locations 배열에 수정된 장소 교체
          set((state) => ({
            locations: state.locations.map((location) =>
              location.id === updatedLocation.id ? updatedLocation : location
            ),
          }));

          logger.info('Location removed from group successfully.', { requestData });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to remove location from group';
          set({ error: errorMessage });
          logger.error('Failed to remove location from group', error);
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

    }),
    {
      name: 'location-store',
    }
  )

  
);