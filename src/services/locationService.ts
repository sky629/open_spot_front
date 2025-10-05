// 위치 정보 관련 API 서비스

import { logger } from '../utils/logger';
import type { ILocationService } from '../core/interfaces';
import type {
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  GetLocationsParams
} from '../types';

// Orval 생성 API factory import
import { getLocations as getLocationsFactory } from '../api/generated/locations/locations';

// Orval 생성 타입들 import
import type {
  GetLocationsParams as ApiGetLocationsParams,
} from '../api/generated/model';

// Orval API 함수들 생성
const locationsApi = getLocationsFactory();

// Mock 데이터 import
import { MOCK_LOCATIONS } from './locationService.mockData';

export class LocationService implements ILocationService {
  /**
   * 모든 위치 정보 조회
   */
  async getLocations(params?: GetLocationsParams): Promise<LocationResponse[]> {
    try {
      logger.debug('Fetching locations from API', params);

      // Orval 생성 API 호출
      const response = await locationsApi.getLocations(params as ApiGetLocationsParams);

      if (response.success && response.data) {
        // 백엔드가 페이지네이션 응답을 반환: { content: [], page: {} }
        // content 배열을 추출
        const data = response.data as unknown as { content?: LocationResponse[]; page?: unknown };
        const locations = data.content || [];
        logger.info(`Successfully fetched ${locations.length} locations`);
        return locations;
      } else {
        throw new Error('Failed to fetch locations');
      }
    } catch (error) {
      logger.error('Error fetching locations, using mock data', error);

      // 백엔드 연결 실패시 mock 데이터 사용
      let filteredLocations = MOCK_LOCATIONS;

      if (params?.category && params.category !== 'all') {
        filteredLocations = MOCK_LOCATIONS.filter(location =>
          location.category === params.category
        );
        logger.debug(`Filtered by category '${params.category}': ${filteredLocations.length} locations`);
      }

      return filteredLocations;
    }
  }

  /**
   * 특정 위치 정보 조회
   */
  async getLocationById(id: string): Promise<LocationResponse> {
    try {
      const response = await locationsApi.getLocationById(id);

      if (response.success && response.data) {
        return response.data as unknown as LocationResponse;
      } else {
        throw new Error('Failed to fetch location');
      }
    } catch (error) {
      logger.error('Error fetching location:', error);
      throw error;
    }
  }

  /**
   * 새 위치 정보 생성
   */
  async createLocation(locationData: CreateLocationRequest): Promise<LocationResponse> {
    try {
      const response = await locationsApi.createLocation(locationData as any);

      if (response.success && response.data) {
        return response.data as unknown as LocationResponse;
      } else {
        throw new Error('Failed to create location');
      }
    } catch (error) {
      logger.error('Error creating location:', error);
      throw error;
    }
  }

  /**
   * 위치 정보 업데이트
   */
  async updateLocation(locationData: UpdateLocationRequest): Promise<LocationResponse> {
    try {
      const { id, ...updateData } = locationData;
      const response = await locationsApi.updateLocation(id, updateData as any);

      if (response.success && response.data) {
        return response.data as unknown as LocationResponse;
      } else {
        throw new Error('Failed to update location');
      }
    } catch (error) {
      logger.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * 위치 정보 삭제
   */
  async deleteLocation(id: string): Promise<void> {
    try {
      const response = await locationsApi.deleteLocation(id);

      if (!response.success) {
        throw new Error('Failed to delete location');
      }
    } catch (error) {
      logger.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * 지도 범위 내 위치 정보 조회
   */
  async getLocationsByBounds(
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    category?: string
  ): Promise<LocationResponse[]> {
    return this.getLocations({
      bounds: { northEast, southWest },
      category,
    });
  }
}