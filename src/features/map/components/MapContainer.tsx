// Map Container Component

import React, { useEffect, useRef, useState, useCallback } from 'react';
import styled from 'styled-components';
import { useLocations, useLocationStore } from '../../../stores/location';
import { LocationMarker } from './LocationMarker';
import { useNaverMap } from '../../../hooks/useNaverMap';
import { logger } from '../../../utils/logger';

interface MapContainerProps {
  onLocationSelect?: (location: any) => void;
  className?: string;
}

export const MapContainer: React.FC<MapContainerProps> = ({
  onLocationSelect,
  className
}) => {
  logger.info('🚀 MapContainer component rendering...');

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const lastBoundsRef = useRef<{ne: {lat: number, lng: number}, sw: {lat: number, lng: number}} | null>(null);

  const locations = useLocations();
  const setSelectedLocation = useLocationStore((state) => state.setSelectedLocation);

  const { mapRef, map, isLoaded } = useNaverMap({
    center: { lat: 37.5665, lng: 126.9780 }, // 서울 시청
    zoom: 13,
    options: {
      // 지도 인터랙션 활성화
      scaleControl: true,
      logoControl: true,
      mapDataControl: true,
      zoomControl: true,
    }
  });

  // bounds가 유의미하게 변경되었는지 확인하는 함수 - useCallback으로 메모이제이션
  const hasBoundsChanged = useCallback((newBounds: {ne: {lat: number, lng: number}, sw: {lat: number, lng: number}}) => {
    if (!lastBoundsRef.current) return true;

    const prev = lastBoundsRef.current;
    const THRESHOLD = 0.001; // 약 100m 정도의 변화량

    return (
      Math.abs(newBounds.ne.lat - prev.ne.lat) > THRESHOLD ||
      Math.abs(newBounds.ne.lng - prev.ne.lng) > THRESHOLD ||
      Math.abs(newBounds.sw.lat - prev.sw.lat) > THRESHOLD ||
      Math.abs(newBounds.sw.lng - prev.sw.lng) > THRESHOLD
    );
  }, []);

  // API 호출 함수 - useCallback으로 메모이제이션
  const fetchLocationsWithBounds = useCallback(async (bounds: {ne: {lat: number, lng: number}, sw: {lat: number, lng: number}}) => {
    if (!hasBoundsChanged(bounds) || isLoadingLocations) {
      logger.info('🔄 API 호출 스킵 - bounds 변화 없음 또는 로딩 중');
      return;
    }

    try {
      setIsLoadingLocations(true);
      const fetchLocationsByBounds = useLocationStore.getState().fetchLocationsByBounds;

      await fetchLocationsByBounds(bounds.ne, bounds.sw);
      lastBoundsRef.current = bounds;

      logger.info('✅ Locations 로드 완료', bounds);
    } catch (error) {
      logger.error('❌ Locations 로드 실패', error);
    } finally {
      setIsLoadingLocations(false);
    }
  }, [hasBoundsChanged, isLoadingLocations]);

  // 지도 로드 완료 처리
  useEffect(() => {
    if (map && isLoaded) {
      setIsMapLoaded(true);
      logger.info('🗺️ Map 로드 완료');

      // 초기 위치 데이터 로드 - 약간의 지연을 두고 실행
      const timer = setTimeout(() => {
        try {
          const bounds = map.getBounds && map.getBounds();
          if (bounds) {
            let northEast, southWest;

            try {
              if (typeof bounds.getNorthEast === 'function') {
                northEast = bounds.getNorthEast();
                southWest = bounds.getSouthWest();
              } else if (typeof bounds.getMax === 'function') {
                northEast = bounds.getMax();
                southWest = bounds.getMin();
              } else {
                northEast = (bounds as any).northEast;
                southWest = (bounds as any).southWest;
              }

              if (northEast && southWest) {
                const boundsData = {
                  ne: {
                    lat: typeof northEast.lat === 'function' ? northEast.lat() : northEast.lat,
                    lng: typeof northEast.lng === 'function' ? northEast.lng() : northEast.lng
                  },
                  sw: {
                    lat: typeof southWest.lat === 'function' ? southWest.lat() : southWest.lat,
                    lng: typeof southWest.lng === 'function' ? southWest.lng() : southWest.lng
                  }
                };

                fetchLocationsWithBounds(boundsData);
              }
            } catch (boundsError) {
              logger.warn('🚧 지도 bounds 가져오기 실패', boundsError);
            }
          }
        } catch (error) {
          logger.error('❌ 초기 위치 로딩 오류', error);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [map, isLoaded, fetchLocationsWithBounds]);

  // 지도 이동 시 위치 데이터 업데이트 - idle 이벤트 사용
  useEffect(() => {
    if (!map || !isLoaded) return;

    const handleMapIdle = () => {
      try {
        const bounds = map.getBounds();
        if (bounds) {
          let northEast, southWest;

          try {
            if (typeof bounds.getNorthEast === 'function') {
              northEast = bounds.getNorthEast();
              southWest = bounds.getSouthWest();
            } else if (typeof bounds.getMax === 'function') {
              northEast = bounds.getMax();
              southWest = bounds.getMin();
            } else {
              northEast = (bounds as any).northEast;
              southWest = (bounds as any).southWest;
            }

            if (northEast && southWest) {
              const boundsData = {
                ne: {
                  lat: typeof northEast.lat === 'function' ? northEast.lat() : northEast.lat,
                  lng: typeof northEast.lng === 'function' ? northEast.lng() : northEast.lng
                },
                sw: {
                  lat: typeof southWest.lat === 'function' ? southWest.lat() : southWest.lat,
                  lng: typeof southWest.lng === 'function' ? southWest.lng() : southWest.lng
                }
              };

              fetchLocationsWithBounds(boundsData);
            }
          } catch (boundsError) {
            logger.warn('🚧 지도 idle 시 bounds 가져오기 실패', boundsError);
          }
        }
      } catch (error) {
        logger.error('❌ 지도 idle 핸들러 오류', error);
      }
    };

    // idle 이벤트는 사용자가 지도 조작을 멈춘 후 발생
    const listener = window.naver.maps.Event.addListener(map, 'idle', handleMapIdle);

    return () => {
      window.naver.maps.Event.removeListener(listener);
    };
  }, [map, isLoaded, fetchLocationsWithBounds]);

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    onLocationSelect?.(location);
    logger.userAction('Location marker clicked', { locationId: location.id });
  };

  return (
    <Container className={className}>
      <MapDiv ref={mapRef} />

      {!isLoaded && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>지도를 로드하는 중...</LoadingText>
        </LoadingOverlay>
      )}

      {isMapLoaded && map && locations && locations.map(location => (
        <LocationMarker
          key={location.id}
          map={map}
          location={location}
          onClick={handleLocationClick}
        />
      ))}

      <MapControls>
        <LocationCount>
          📍 {locations?.length || 0}개 위치
          {isLoadingLocations && ' (로딩 중...)'}
        </LocationCount>
      </MapControls>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f0f0f0;
`;

const MapDiv = styled.div`
  width: 100%;
  height: 100%;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const LoadingSpinner = styled.div`
  width: 3rem;
  height: 3rem;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #3182ce;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #4a5568;
  font-size: 1rem;
  text-align: center;
  margin: 0;
`;

const MapControls = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1001;
`;

const LocationCount = styled.div`
  background: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #2d3748;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
`;