// Map Container Component

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

import styled from 'styled-components';

import { useLocations, useLocationStore } from '../../../stores/location';

import { LocationMarker } from './LocationMarker';

import { CreateLocationModal } from './CreateLocationModal';

import { useNaverMap } from '../../../hooks/useNaverMap';

import { logger } from '../../../utils/logger';

import type { LocationResponse } from '../../../types';



interface MapContainerProps {

  onLocationSelect?: (location: LocationResponse) => void;

  className?: string;

}



export interface MapContainerRef {

  panToLocation: (lat: number, lng: number, zoom?: number) => void;

}



export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(({

  onLocationSelect,

  className

}, ref) => {

  logger.info('🚀 MapContainer component rendering...');



  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [clickedPosition, setClickedPosition] = useState<{

    lat: number;

    lng: number;

    address?: string;

  } | undefined>(undefined);

  // 모바일 롱프레스 감지를 위한 상태
  const [touchStartTime, setTouchStartTime] = useState<number>(0);

  const [touchStartPos, setTouchStartPos] = useState<{x: number, y: number} | null>(null);

  const lastBoundsRef = useRef<{ne: {lat: number, lng: number}, sw: {lat: number, lng: number}} | null>(null);



  const locations = useLocations();

  const selectedLocation = useLocationStore((state) => state.selectedLocation);

  const shouldFocusOnMap = useLocationStore((state) => state.shouldFocusOnMap);



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



  // Expose map control methods via ref

  useImperativeHandle(ref, () => ({

    panToLocation: (lat: number, lng: number, zoom?: number) => {

      if (!map || !isLoaded) {

        logger.warn('Map not loaded yet');

        return;

      }



      const newCenter = new window.naver.maps.LatLng(lat, lng);



      // 줌 레벨이 지정된 경우, 먼저 줌을 설정하고 애니메이션 없이 이동

      if (zoom !== undefined) {

        map.setZoom(zoom);

      }



      // 그 다음 부드럽게 중심 이동

      setTimeout(() => {

        map.panTo(newCenter, { duration: 500 });

      }, 100);



      logger.info('Map panned to location', { lat, lng, zoom });

    }

  }), [map, isLoaded]);



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

      const currentGroupId = useLocationStore.getState().currentGroupId;



      await fetchLocationsByBounds(bounds.ne, bounds.sw, undefined, currentGroupId || undefined);

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

                // Fallback for unknown bounds structure

                northEast = (bounds as unknown as Record<string, unknown>).northEast as { lat: number; lng: number };

                southWest = (bounds as unknown as Record<string, unknown>).southWest as { lat: number; lng: number };

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

              // Fallback for unknown bounds structure

              northEast = (bounds as unknown as Record<string, unknown>).northEast as { lat: number; lng: number };

              southWest = (bounds as unknown as Record<string, unknown>).southWest as { lat: number; lng: number };

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



  const handleLocationClick = (location: LocationResponse) => {

    onLocationSelect?.(location);

    logger.userAction('Location marker clicked', { locationId: location.id });

  };



  // 우클릭 이벤트 핸들러

  const handleRightClick = useCallback((e: { coord: { lat: () => number; lng: () => number } }) => {

    const lat = e.coord.lat();

    const lng = e.coord.lng();



    logger.info('Map right-clicked', { lat, lng });



    // TODO: 백엔드 Reverse Geocoding API 연동 후 주소 자동 조회 구현

    setClickedPosition({ lat, lng });

    setIsModalOpen(true);

  }, []);



  // 모바일 롱프레스 핸들러
  const handleTouchStart = useCallback((e: any) => {
    const coord = e.coord;
    if (coord && typeof coord.x === 'function' && typeof coord.y === 'function') {
      setTouchStartTime(Date.now());
      setTouchStartPos({ x: coord.x(), y: coord.y() });
    }
  }, []);

  const handleTouchEnd = useCallback((e: any) => {
    const touchDuration = Date.now() - touchStartTime;
    const LONG_PRESS_DURATION = 500; // 500ms 이상 누르기

    if (touchDuration >= LONG_PRESS_DURATION && touchStartPos) {
      const coord = e.coord;
      if (coord && typeof coord.x === 'function' && typeof coord.y === 'function') {
        const deltaX = Math.abs(coord.x() - touchStartPos.x);
        const deltaY = Math.abs(coord.y() - touchStartPos.y);

        // 이동이 10px 미만이면 롱프레스로 인식
        if (deltaX < 10 && deltaY < 10) {
          const lat = e.coord.lat();
          const lng = e.coord.lng();

          logger.info('Map long-pressed (mobile)', { lat, lng, duration: touchDuration });
          setClickedPosition({ lat, lng });
          setIsModalOpen(true);
        }
      }
    }

    setTouchStartTime(0);
    setTouchStartPos(null);
  }, [touchStartTime, touchStartPos]);



  // 우클릭 이벤트 등록

  useEffect(() => {

    if (!map || !isLoaded) return;



    const listener = window.naver.maps.Event.addListener(map, 'rightclick', handleRightClick);



    return () => {

      window.naver.maps.Event.removeListener(listener);

    };

  }, [map, isLoaded, handleRightClick]);



  // 모바일 롱프레스 이벤트 등록
  useEffect(() => {
    if (!map || !isLoaded) return;

    const touchStartListener = window.naver.maps.Event.addListener(map, 'touchstart', handleTouchStart);
    const touchEndListener = window.naver.maps.Event.addListener(map, 'touchend', handleTouchEnd);

    return () => {
      window.naver.maps.Event.removeListener(touchStartListener);
      window.naver.maps.Event.removeListener(touchEndListener);
    };
  }, [map, isLoaded, handleTouchStart, handleTouchEnd]);



  // "지도에서 보기" 버튼 클릭 시에만 지도 중심 이동

  useEffect(() => {

    if (!map || !isLoaded || !selectedLocation || !shouldFocusOnMap) return;



    const { latitude, longitude } = selectedLocation;

    if (!latitude || !longitude) return;



    // 지도 중심을 선택된 위치로 부드럽게 이동

    const newCenter = new window.naver.maps.LatLng(latitude, longitude);

    map.panTo(newCenter, { duration: 500 }); // 500ms 애니메이션



    // 줌 레벨을 15로 설정 (상세 보기)

    if (map.getZoom() < 15) {

      map.setZoom(15, true); // true는 애니메이션 활성화

    }



    logger.info('Map centered on selected location', { latitude, longitude });

  }, [map, isLoaded, selectedLocation, shouldFocusOnMap]);



  const handleModalClose = () => {

    setIsModalOpen(false);

    setClickedPosition(undefined);

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

          📍 {locations?.length || 0}개 저장

          {isLoadingLocations && ' (로딩 중...)'}

        </LocationCount>

      </MapControls>



      <CreateLocationModal

        isOpen={isModalOpen}

        onClose={handleModalClose}

        initialPosition={clickedPosition}

      />

    </Container>

  );

});



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

  left: 50%;

  transform: translateX(-50%);

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


