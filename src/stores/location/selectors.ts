// Location Store Selectors

import React from 'react';
import { useLocationStore } from './locationStore';
import type { LocationState } from './types';

/**
 * 위치 목록만 선택하는 셀렉터
 */
export const useLocations = () =>
  useLocationStore((state) => state.locations);

/**
 * 선택된 위치만 선택하는 셀렉터
 */
export const useSelectedLocation = () =>
  useLocationStore((state) => state.selectedLocation);

/**
 * 로딩 상태만 선택하는 셀렉터
 */
export const useLocationLoading = () =>
  useLocationStore((state) => state.isLoading);

/**
 * 에러 상태만 선택하는 셀렉터
 */
export const useLocationError = () =>
  useLocationStore((state) => state.error);

/**
 * 위치 개수 통계만 선택하는 셀렉터
 */
export const useLocationCounts = () =>
  useLocationStore((state) => state.locationCounts);

/**
 * 현재 필터 상태만 선택하는 셀렉터
 * 무한 루프 방지를 위해 개별 필드 선택
 */
export const useLocationFilters = () => {
  const currentCategory = useLocationStore((state) => state.currentCategory);
  const currentBounds = useLocationStore((state) => state.currentBounds);

  return React.useMemo(() => ({
    currentCategory,
    currentBounds,
  }), [currentCategory, currentBounds]);
};

/**
 * 위치 액션들만 선택하는 셀렉터 - 개별 함수 선택으로 무한 루프 방지
 */
export const useLocationActions = () => {
  const setLocations = useLocationStore((state) => state.setLocations);
  const setSelectedLocation = useLocationStore((state) => state.setSelectedLocation);
  const setLoading = useLocationStore((state) => state.setLoading);
  const setError = useLocationStore((state) => state.setError);
  const setCurrentCategory = useLocationStore((state) => state.setCurrentCategory);
  const setCurrentBounds = useLocationStore((state) => state.setCurrentBounds);
  const fetchLocations = useLocationStore((state) => state.fetchLocations);
  const fetchLocationsByBounds = useLocationStore((state) => state.fetchLocationsByBounds);
  const refreshLocations = useLocationStore((state) => state.refreshLocations);
  const clearError = useLocationStore((state) => state.clearError);
  const reset = useLocationStore((state) => state.reset);

  // React.useMemo로 메모이제이션하여 안정적인 참조 제공
  return React.useMemo(() => ({
    setLocations,
    setSelectedLocation,
    setLoading,
    setError,
    setCurrentCategory,
    setCurrentBounds,
    fetchLocations,
    fetchLocationsByBounds,
    refreshLocations,
    clearError,
    reset,
  }), [
    setLocations,
    setSelectedLocation,
    setLoading,
    setError,
    setCurrentCategory,
    setCurrentBounds,
    fetchLocations,
    fetchLocationsByBounds,
    refreshLocations,
    clearError,
    reset,
  ]);
};

/**
 * 카테고리별 위치 필터링 셀렉터
 */
export const useLocationsByCategory = (category?: string) =>
  useLocationStore((state) => {
    if (!category) return state.locations;
    return state.locations.filter(location => location.category === category);
  });

/**
 * 특정 ID의 위치 찾기 셀렉터
 */
export const useLocationById = (id: string) =>
  useLocationStore((state) =>
    state.locations.find(location => location.id === id) || null
  );

/**
 * 위치 검색 셀렉터 (외부 검색어 사용)
 */
export const useSearchLocations = (searchTerm: string) =>
  useLocationStore((state) => {
    if (!searchTerm.trim()) return state.locations;

    const term = searchTerm.toLowerCase();
    return state.locations.filter(location =>
      location.name?.toLowerCase().includes(term) ||
      location.description?.toLowerCase().includes(term)
    );
  });

/**
 * 필터링된 위치 목록 (store의 searchQuery 사용)
 */
export const useFilteredLocations = () => {
  const locations = useLocationStore((state) => state.locations);
  const searchQuery = useLocationStore((state) => state.searchQuery);

  return React.useMemo(() => {
    if (!locations) return [];

    const query = searchQuery.trim().toLowerCase();
    if (!query) return locations;

    return locations.filter(location =>
      location.name?.toLowerCase().includes(query) ||
      location.description?.toLowerCase().includes(query) ||
      location.address?.toLowerCase().includes(query)
    );
  }, [locations, searchQuery]);
};

/**
 * 지도 관련 상태 셀렉터
 */
export const useMapLocationState = () =>
  useLocationStore((state) => ({
    locations: state.locations,
    selectedLocation: state.selectedLocation,
    isLoading: state.isLoading,
    currentCategory: state.currentCategory,
    currentBounds: state.currentBounds,
  }));

/**
 * 전체 위치 상태 (읽기 전용)
 */
export const useLocationStatus = () =>
  useLocationStore((state) => ({
    locations: state.locations,
    selectedLocation: state.selectedLocation,
    isLoading: state.isLoading,
    error: state.error,
    locationCounts: state.locationCounts,
    currentCategory: state.currentCategory,
    currentBounds: state.currentBounds,
  }));

/**
 * 커스텀 셀렉터 생성 유틸리티
 */
export const createLocationSelector = <T>(selector: (state: LocationState) => T) =>
  () => useLocationStore(selector);