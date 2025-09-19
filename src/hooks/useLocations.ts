// 위치 정보 관리 커스텀 훅

import { useState, useEffect, useCallback } from 'react';
import { LocationService } from '../services';
import type { LocationResponse, GetLocationsParams } from '../types';

interface UseLocationsState {
  locations: LocationResponse[];
  loading: boolean;
  error: string | null;
  locationCounts: Record<string, number>;
}

const calculateLocationCounts = (locations: LocationResponse[]): Record<string, number> => {
  const counts: Record<string, number> = {};

  locations.forEach(location => {
    if (location.category) {
      counts[location.category] = (counts[location.category] || 0) + 1;
    }
  });

  return counts;
};

export const useLocations = (params?: GetLocationsParams) => {
  const [state, setState] = useState<UseLocationsState>({
    locations: [],
    loading: false,
    error: null,
    locationCounts: {},
  });

  const fetchLocations = useCallback(async (searchParams?: GetLocationsParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const locations = await LocationService.getLocations(searchParams || params);
      const locationCounts = calculateLocationCounts(locations);
      setState({
        locations,
        loading: false,
        error: null,
        locationCounts,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, [params]);

  const refreshLocations = useCallback(() => {
    fetchLocations(params);
  }, [fetchLocations, params]);

  const getLocationsByBounds = useCallback(async (
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    category?: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const locations = await LocationService.getLocationsByBounds(
        northEast,
        southWest,
        category
      );
      const locationCounts = calculateLocationCounts(locations);
      setState({
        locations,
        loading: false,
        error: null,
        locationCounts,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }));
    }
  }, []);

  // 초기 로드 시에만 실행되도록 의존성 배열을 빈 배열로 변경
  useEffect(() => {
    fetchLocations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchLocations 의존성 제거 - 초기 로드 시에만 실행

  return {
    ...state,
    refreshLocations,
    getLocationsByBounds,
  };
};