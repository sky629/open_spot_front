// 네이버 지도 관리 커스텀 훅

import { useEffect, useRef, useState } from 'react';
import { MAP_CONFIG } from '../constants';
import { loadNaverMaps } from '../utils';
import { logger } from '../utils/logger';
import type { NaverMap, NaverMapOptions, NaverLatLng } from '../types';

interface UseNaverMapProps {
  center?: NaverLatLng;
  zoom?: number;
  options?: Partial<NaverMapOptions>;
}

export const useNaverMap = ({
  center = MAP_CONFIG.DEFAULT_CENTER,
  zoom = MAP_CONFIG.DEFAULT_ZOOM,
  options = {},
}: UseNaverMapProps = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<NaverMap | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  logger.info('🗺️ useNaverMap hook initialized', { center, zoom });
  logger.info('🗺️ useNaverMap hook - mapRef.current:', mapRef.current);

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) {
        logger.warn('Map container not found, retrying...');
        return;
      }

      try {
        logger.info('Initializing Naver Map...');

        // 네이버 지도 API 동적 로드
        await loadNaverMaps();

        logger.info('Naver Maps API loaded, creating map instance...');

        const mapOptions: NaverMapOptions = {
          center: new window.naver.maps.LatLng(center.lat, center.lng),
          zoom,
          mapTypeId: window.naver.maps.MapTypeId.NORMAL,
          mapDataControl: false,
          scaleControl: true,
          logoControl: true,
          mapTypeControl: true,
          zoomControl: true,
          ...options,
        };

        const naverMap = new window.naver.maps.Map(mapRef.current, mapOptions);

        logger.info('Naver Map instance created successfully');

        setMap(naverMap);
        setIsLoaded(true);
      } catch (error) {
        logger.error('Failed to initialize Naver Map', error);
        setIsLoaded(false);
      }
    };

    // 이미 지도가 생성된 경우 다시 생성하지 않음
    if (!map) {
      const timeoutId = setTimeout(initializeMap, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [center.lat, center.lng, zoom, map, options]);

  const setCenter = (newCenter: NaverLatLng) => {
    if (map) {
      map.setCenter(new window.naver.maps.LatLng(newCenter.lat, newCenter.lng));
    }
  };

  const setZoom = (newZoom: number) => {
    if (map) {
      map.setZoom(newZoom);
    }
  };

  const getCenter = (): NaverLatLng | null => {
    if (map) {
      const center = map.getCenter();
      return {
        lat: center.lat(),
        lng: center.lng(),
      };
    }
    return null;
  };

  const getBounds = () => {
    if (map) {
      try {
        const bounds = map.getBounds();

        // 네이버 지도 API v3에서 bounds 접근 방법 시도
        let northEast, southWest;

        // 방법 1: getNorthEast, getSouthWest 메서드 시도
        try {
          northEast = bounds.getNorthEast();
          southWest = bounds.getSouthWest();
        } catch (e) {
          // 방법 2: getMax, getMin 메서드 시도
          try {
            northEast = bounds.getMax();
            southWest = bounds.getMin();
          } catch (e2) {
            logger.error('Failed to get bounds coordinates', e2);
            return null;
          }
        }

        return {
          northEast: {
            lat: typeof northEast.lat === 'function' ? northEast.lat() : northEast.lat,
            lng: typeof northEast.lng === 'function' ? northEast.lng() : northEast.lng,
          },
          southWest: {
            lat: typeof southWest.lat === 'function' ? southWest.lat() : southWest.lat,
            lng: typeof southWest.lng === 'function' ? southWest.lng() : southWest.lng,
          },
        };
      } catch (error) {
        logger.error('Failed to get map bounds', error);
        return null;
      }
    }
    return null;
  };

  return {
    mapRef,
    map,
    isLoaded,
    setCenter,
    setZoom,
    getCenter,
    getBounds,
  };
};