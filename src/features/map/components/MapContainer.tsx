// Map Container Component

import React, { useEffect, useRef, useState } from 'react';
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
  const mapRef = useRef<HTMLDivElement>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const locations = useLocations();
  const setSelectedLocation = useLocationStore((state) => state.setSelectedLocation);

  const { map, isLoaded } = useNaverMap({
    center: { lat: 37.5665, lng: 126.9780 }, // 서울 시청
    zoom: 13,
    options: {
      scaleControl: true,
      logoControl: true,
      mapDataControl: true,
      zoomControl: true,
    }
  });

  // 지도 로드 완료 처리
  useEffect(() => {
    if (map && isLoaded) {
      setIsMapLoaded(true);
      logger.info('Map loaded successfully');

      // 초기 위치 데이터 로드
      const bounds = map.getBounds && map.getBounds();
      if (bounds) {
        const ne = (bounds as any).northEast || (bounds as any).getNorthEast();
        const sw = (bounds as any).southWest || (bounds as any).getSouthWest();

        // 스토어에서 직접 함수를 가져와서 호출하여 의존성 문제 해결
        const fetchLocationsByBounds = useLocationStore.getState().fetchLocationsByBounds;
        fetchLocationsByBounds(
          { lat: ne.lat || ne.lat(), lng: ne.lng || ne.lng() },
          { lat: sw.lat || sw.lat(), lng: sw.lng || sw.lng() }
        ).catch(error => {
          logger.error('Failed to load initial locations', error);
        });
      }
    }
  }, [map, isLoaded]); // fetchLocationsByBounds 의존성 제거

  // 지도 이동 시 위치 데이터 업데이트
  useEffect(() => {
    if (!map) return;

    const handleBoundsChanged = () => {
      const bounds = map.getBounds();
      if (bounds) {
        const ne = (bounds as any).northEast || (bounds as any).getNorthEast();
        const sw = (bounds as any).southWest || (bounds as any).getSouthWest();

        // 스토어에서 직접 함수를 가져와서 호출하여 의존성 문제 해결
        const fetchLocationsByBounds = useLocationStore.getState().fetchLocationsByBounds;
        fetchLocationsByBounds(
          { lat: ne.lat || ne.lat(), lng: ne.lng || ne.lng() },
          { lat: sw.lat || sw.lat(), lng: sw.lng || sw.lng() }
        ).catch(error => {
          logger.error('Failed to update locations on bounds change', error);
        });
      }
    };

    // 디바운스된 이벤트 핸들러
    let timeoutId: NodeJS.Timeout;
    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleBoundsChanged, 500);
    };

    const listener = window.naver.maps.Event.addListener(map, 'bounds_changed', debouncedHandler);

    return () => {
      window.naver.maps.Event.removeListener(listener);
      clearTimeout(timeoutId);
    };
  }, [map]); // fetchLocationsByBounds 의존성 제거

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    onLocationSelect?.(location);
    logger.userAction('Location marker clicked', { locationId: location.id });
  };

  // 지도 에러 처리는 useNaverMap 훅에서 처리

  return (
    <Container className={className}>
      <MapDiv ref={mapRef} />

      {!isLoaded && (
        <LoadingOverlay>
          <LoadingSpinner />
          <LoadingText>지도를 로드하는 중...</LoadingText>
        </LoadingOverlay>
      )}

      {isMapLoaded && map && locations.map(location => (
        <LocationMarker
          key={location.id}
          map={map}
          location={location}
          onClick={handleLocationClick}
        />
      ))}

      <MapControls>
        <LocationCount>
          📍 {locations.length}개 위치
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

// Error handling components removed - errors are handled in the hook

const MapControls = styled.div`
  position: absolute;
  top: 1rem;
  right: 1rem;
  z-index: 100;
`;

const LocationCount = styled.div`
  background-color: rgba(255, 255, 255, 0.95);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px);
`;