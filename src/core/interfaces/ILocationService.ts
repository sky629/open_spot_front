// Location Service Interface

import type {
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  GetLocationsParams
} from '../../types';

export interface ILocationService {
  /**
   * 모든 위치 정보 조회
   */
  getLocations(params?: GetLocationsParams): Promise<LocationResponse[]>;

  /**
   * 특정 위치 정보 조회
   */
  getLocationById(id: string): Promise<LocationResponse>;

  /**
   * 새 위치 정보 생성
   */
  createLocation(locationData: CreateLocationRequest): Promise<LocationResponse>;

  /**
   * 위치 정보 업데이트
   */
  updateLocation(locationData: UpdateLocationRequest): Promise<LocationResponse>;

  /**
   * 위치 정보 삭제
   */
  deleteLocation(id: string): Promise<void>;

  /**
   * 지도 범위 내 위치 정보 조회
   */
  getLocationsByBounds(
    northEast: { lat: number; lng: number },
    southWest: { lat: number; lng: number },
    category?: string,
    groupId?: string
  ): Promise<LocationResponse[]>;
}