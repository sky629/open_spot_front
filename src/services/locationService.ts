// 위치 정보 관련 API 서비스

import { apiClient } from './api';
import { API_ENDPOINTS } from '../constants';
import { logger } from '../utils/logger';
import type {
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  GetLocationsParams
} from '../types';

// Mock 데이터 (백엔드 연결 실패시 사용) - MAP_CATEGORIES와 일치
const MOCK_LOCATIONS: LocationResponse[] = [
  // 음식점 (restaurant)
  {
    id: '1',
    name: '본죽&비빔밥 강남점',
    latitude: 37.4979,
    longitude: 127.0276,
    description: '건강한 죽과 비빔밥 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: '명동교자 본점',
    latitude: 37.5636,
    longitude: 126.9856,
    description: '서울의 대표적인 만두 맛집',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    name: '미정국수 홍대점',
    latitude: 37.5519,
    longitude: 126.9205,
    description: '깔끔한 국수와 만두 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    name: '호미곶막창 신촌점',
    latitude: 37.5583,
    longitude: 126.9364,
    description: '신선한 막창과 곱창 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    name: '곤지암돼지갈비 이태원점',
    latitude: 37.5346,
    longitude: 126.9947,
    description: '맛있는 돼지갈비 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '6',
    name: '청진동해장국 명동점',
    latitude: 37.5658,
    longitude: 126.9831,
    description: '얼큰한 해장국 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '7',
    name: '북촌손만두 인사동점',
    latitude: 37.5694,
    longitude: 126.9859,
    description: '수제 손만두 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '8',
    name: '육쌈냉면 서초점',
    latitude: 37.4948,
    longitude: 127.0266,
    description: '시원한 냉면과 육쌈 전문점',
    category: 'restaurant',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },

  // 카페 (cafe)
  {
    id: '9',
    name: '스타벅스 강남역점',
    latitude: 37.4985,
    longitude: 127.0269,
    description: '글로벌 커피 전문점',
    category: 'cafe',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '10',
    name: '블루보틀 삼청점',
    latitude: 37.5836,
    longitude: 126.9830,
    description: '스페셜티 커피 전문점',
    category: 'cafe',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '11',
    name: '폴바셋 홍대점',
    latitude: 37.5511,
    longitude: 126.9227,
    description: '프리미엄 커피 브랜드',
    category: 'cafe',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '12',
    name: '카페베네 명동점',
    latitude: 37.5647,
    longitude: 126.9859,
    description: '편안한 분위기의 카페',
    category: 'cafe',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '13',
    name: '투썸플레이스 신촌점',
    latitude: 37.5591,
    longitude: 126.9368,
    description: '디저트와 커피 전문점',
    category: 'cafe',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },

  // 쇼핑 (shopping)
  {
    id: '14',
    name: '롯데백화점 본점',
    latitude: 37.5651,
    longitude: 126.9815,
    description: '명동의 대표적인 백화점',
    category: 'shopping',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '15',
    name: '현대백화점 무역센터점',
    latitude: 37.5081,
    longitude: 127.0594,
    description: '강남 코엑스의 프리미엄 백화점',
    category: 'shopping',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '16',
    name: '홍대 와우마켓',
    latitude: 37.5507,
    longitude: 126.9216,
    description: '젊은이들의 쇼핑 명소',
    category: 'shopping',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '17',
    name: '동대문 DDP',
    latitude: 37.5665,
    longitude: 127.0092,
    description: '24시간 패션 쇼핑몰',
    category: 'shopping',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '18',
    name: '신세계백화점 강남점',
    latitude: 37.5043,
    longitude: 127.0065,
    description: '럭셔리 쇼핑의 명소',
    category: 'shopping',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },

  // 공원 (park)
  {
    id: '19',
    name: '한강공원 반포지구',
    latitude: 37.5184,
    longitude: 126.9966,
    description: '서울의 대표적인 한강공원',
    category: 'park',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '20',
    name: '남산공원',
    latitude: 37.5512,
    longitude: 126.9882,
    description: '서울 중심의 역사적인 공원',
    category: 'park',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '21',
    name: '경복궁',
    latitude: 37.5796,
    longitude: 126.9770,
    description: '조선 왕조의 정궁',
    category: 'park',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '22',
    name: '올림픽공원',
    latitude: 37.5219,
    longitude: 127.1230,
    description: '1988 서울올림픽 기념공원',
    category: 'park',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '23',
    name: '월드컵공원',
    latitude: 37.5654,
    longitude: 126.8970,
    description: '마포구의 대형 도시공원',
    category: 'park',
    iconUrl: '',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export class LocationService {
  /**
   * 모든 위치 정보 조회
   */
  static async getLocations(params?: GetLocationsParams): Promise<LocationResponse[]> {
    // Mock-first 전략: 백엔드 엔드포인트가 구현되지 않았으므로 즉시 mock 데이터 반환
    logger.info(`Using mock data: ${MOCK_LOCATIONS.length} locations`);

    // 카테고리 필터링 적용
    let filteredLocations = MOCK_LOCATIONS;

    if (params?.category && params.category !== 'all') {
      filteredLocations = MOCK_LOCATIONS.filter(location =>
        location.category === params.category
      );
      logger.debug(`Filtered by category '${params.category}': ${filteredLocations.length} locations`);
    }

    // 바운더리 필터링 (나중에 필요시 구현)
    if (params?.bounds) {
      logger.debug('Bounds filtering requested but not implemented in mock mode');
    }

    return filteredLocations;

    // TODO: 백엔드 API 구현 후 아래 코드로 교체
    // try {
    //   logger.debug('Fetching locations', params);
    //   const response = await apiClient.get<LocationResponse[]>(
    //     API_ENDPOINTS.LOCATIONS,
    //     params
    //   );
    //   if (response.success) {
    //     logger.info(`Successfully fetched ${response.data.length} locations`);
    //     return response.data;
    //   } else {
    //     const errorMsg = response.error || 'Failed to fetch locations';
    //     logger.error('Location fetch failed', new Error(errorMsg));
    //     throw new Error(errorMsg);
    //   }
    // } catch (error) {
    //   logger.error('Error fetching locations, using mock data', error);
    //   return MOCK_LOCATIONS;
    // }
  }

  /**
   * 특정 위치 정보 조회
   */
  static async getLocationById(id: string): Promise<LocationResponse> {
    try {
      const response = await apiClient.get<LocationResponse>(
        API_ENDPOINTS.LOCATION_BY_ID(id)
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch location');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }

  /**
   * 새 위치 정보 생성
   */
  static async createLocation(locationData: CreateLocationRequest): Promise<LocationResponse> {
    try {
      const response = await apiClient.post<LocationResponse>(
        API_ENDPOINTS.LOCATIONS,
        locationData
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to create location');
      }
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    }
  }

  /**
   * 위치 정보 업데이트
   */
  static async updateLocation(locationData: UpdateLocationRequest): Promise<LocationResponse> {
    try {
      const { id, ...updateData } = locationData;
      const response = await apiClient.put<LocationResponse>(
        API_ENDPOINTS.LOCATION_BY_ID(id),
        updateData
      );

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  /**
   * 위치 정보 삭제
   */
  static async deleteLocation(id: string): Promise<void> {
    try {
      const response = await apiClient.delete<void>(
        API_ENDPOINTS.LOCATION_BY_ID(id)
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      throw error;
    }
  }

  /**
   * 지도 범위 내 위치 정보 조회
   */
  static async getLocationsByBounds(
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