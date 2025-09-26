// 네이버 지도 컨테이너 컴포넌트

import React, { useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useNaverMap } from '../../hooks';
import { LocationMarker } from './LocationMarker';
import type { NaverLatLng, LocationResponse } from '../../types';

interface MapContainerProps {
  center?: NaverLatLng;
  zoom?: number;
  locations?: LocationResponse[];
  onMapLoad?: () => void;
  onBoundsChanged?: (bounds: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  }) => void;
  onLocationClick?: (location: LocationResponse) => void;
}

const MapWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
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
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #333;
  z-index: 1000;
`;


export const MapContainer: React.FC<MapContainerProps> = ({
  center,
  zoom,
  locations = [],
  onMapLoad,
  onBoundsChanged,
  onLocationClick,
}) => {
  const { mapRef, map, isLoaded } = useNaverMap({ center, zoom });
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && onMapLoad) {
      onMapLoad();
    }
  }, [isLoaded, onMapLoad]);

  // 디바운스된 bounds 변경 핸들러
  const debouncedBoundsChanged = useCallback((boundsData: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  }) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      if (onBoundsChanged) {
        onBoundsChanged(boundsData);
      }
    }, 500); // 500ms 디바운스
  }, [onBoundsChanged]);

  useEffect(() => {
    if (map && onBoundsChanged) {
      const boundsChangedListener = window.naver.maps.Event.addListener(
        map,
        'bounds_changed',
        () => {
          try {
            const bounds = map.getBounds();
            let northEast, southWest;

            // 안전한 bounds 접근 방법
            try {
              // 방법 1: getNorthEast, getSouthWest 메서드 시도
              northEast = bounds.getNorthEast();
              southWest = bounds.getSouthWest();
            } catch (e) {
              // 방법 2: getMax, getMin 메서드 시도
              try {
                northEast = bounds.getMax();
                southWest = bounds.getMin();
              } catch (e2) {
                console.error('Failed to get bounds coordinates:', e2);
                return; // 실패 시 조기 종료
              }
            }

            const northEastLat = typeof northEast.lat === 'function' ? northEast.lat() : northEast.lat;
            const northEastLng = typeof northEast.lng === 'function' ? northEast.lng() : northEast.lng;
            const southWestLat = typeof southWest.lat === 'function' ? southWest.lat() : southWest.lat;
            const southWestLng = typeof southWest.lng === 'function' ? southWest.lng() : southWest.lng;

            const boundsData = {
              northEast: {
                lat: typeof northEastLat === 'function' ? northEastLat() : northEastLat,
                lng: typeof northEastLng === 'function' ? northEastLng() : northEastLng,
              },
              southWest: {
                lat: typeof southWestLat === 'function' ? southWestLat() : southWestLat,
                lng: typeof southWestLng === 'function' ? southWestLng() : southWestLng,
              },
            };

            debouncedBoundsChanged(boundsData);
          } catch (error) {
            console.error('Error in bounds_changed event:', error);
          }
        }
      );

      return () => {
        window.naver.maps.Event.removeListener(boundsChangedListener);
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }
  }, [map, debouncedBoundsChanged, onBoundsChanged]);

  return (
    <MapWrapper>
      <MapDiv ref={mapRef} />

      {!isLoaded && (
        <LoadingOverlay>
          지도를 로드하는 중...
        </LoadingOverlay>
      )}

      {/* 지도가 로드된 후 마커들을 렌더링 */}
      {isLoaded && map && locations.map((location) => (
        <LocationMarker
          key={location.id}
          map={map}
          location={location}
          onClick={onLocationClick}
        />
      ))}
    </MapWrapper>
  );
};