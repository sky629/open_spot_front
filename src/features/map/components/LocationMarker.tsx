// Location Marker Component
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef } from 'react';
import type { LocationResponse, NaverMap } from '../../../types';
import { MAP_CATEGORIES, MARKER_ICONS } from '../../../constants/map';

// Naver Maps API 타입 정의 (전역 타입 사용)
type NaverMarker = {
  setMap: (map: NaverMap | null) => void;
  getPosition: () => { lat: () => number; lng: () => number };
  setTitle: (title: string) => void;
  addListener: (event: string, callback: () => void) => void;
};
type NaverInfoWindow = {
  setContent: (content: string) => void;
  open: (map: NaverMap, marker: NaverMarker) => void;
  close: () => void;
};

interface LocationMarkerProps {
  map: NaverMap;
  location: LocationResponse;
  onClick?: (location: LocationResponse) => void;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  map,
  location,
  onClick
}) => {
  const markerRef = useRef<NaverMarker | null>(null);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);

  useEffect(() => {
    if (!map || !location.latitude || !location.longitude) return;

    // 마커 생성
    const position = new window.naver.maps.LatLng(location.latitude, location.longitude);

    // 카테고리에 따른 아이콘 선택
    const iconUrl = location.category && location.category in MARKER_ICONS
      ? MARKER_ICONS[location.category as keyof typeof MARKER_ICONS]
      : MARKER_ICONS.DEFAULT;

    const marker = new window.naver.maps.Marker({
      position,
      map,
      title: location.name,
      icon: {
        url: iconUrl,
        size: new window.naver.maps.Size(32, 32),
        scaledSize: new window.naver.maps.Size(32, 32),
        origin: new window.naver.maps.Point(0, 0),
        anchor: new window.naver.maps.Point(16, 32)
      },
      zIndex: 100
    });

    markerRef.current = marker as any;

    // 정보창 생성
    const infoWindow = new window.naver.maps.InfoWindow({
      content: createInfoWindowContent(location),
      maxWidth: 300,
      anchorSize: new window.naver.maps.Size(20, 10),
      anchorSkew: true,
      borderColor: '#cecdc7',
      borderWidth: 2,
      backgroundColor: 'white'
    });

    infoWindowRef.current = infoWindow as any;

    // 마커 클릭 이벤트
    const clickListener = window.naver.maps.Event.addListener(marker, 'click', () => {
      // 다른 정보창들 닫기
      if ((infoWindow as any).getMap()) {
        (infoWindow as any).close();
      } else {
        (infoWindow as any).open(map, marker);
      }

      onClick?.(location);
    });

    // 정보창 닫기 버튼 이벤트 (동적으로 추가됨)
    const setupInfoWindowEvents = () => {
      const closeButton = document.querySelector(`[data-location-id="${location.id}"] .close-btn`);
      if (closeButton) {
        closeButton.addEventListener('click', () => {
          (infoWindow as any).close();
        });
      }
    };

    // 정보창이 열릴 때 이벤트 설정
    const domReadyListener = window.naver.maps.Event.addListener(infoWindow as any, 'domready', setupInfoWindowEvents);

    // 클린업
    return () => {
      window.naver.maps.Event.removeListener(clickListener);
      window.naver.maps.Event.removeListener(domReadyListener);

      if ((infoWindow as any).getMap()) {
        (infoWindow as any).close();
      }
      marker.setMap(null);
    };
  }, [map, location, onClick]);

  // 위치 업데이트
  useEffect(() => {
    if (markerRef.current && location.latitude && location.longitude) {
      const newPosition = new window.naver.maps.LatLng(location.latitude, location.longitude);
      (markerRef.current as any).setPosition(newPosition);
    }
  }, [location.latitude, location.longitude]);

  // 이 컴포넌트는 실제로 렌더링되지 않음 (마커는 지도에 직접 추가됨)
  return null;
};

// 정보창 HTML 생성 함수
const createInfoWindowContent = (location: LocationResponse): string => {
  const categoryName = location.category && location.category in MAP_CATEGORIES
    ? MAP_CATEGORIES[location.category as keyof typeof MAP_CATEGORIES]
    : '기타';

  const imageSection = location.iconUrl
    ? `<div class="info-image">
         <img src="${location.iconUrl}" alt="${location.name}"
              style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" />
       </div>`
    : '';

  return `
    <div data-location-id="${location.id}" style="padding: 16px; min-width: 250px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #2d3748; line-height: 1.4;">
          ${location.name || '위치 정보'}
        </h3>
        <button class="close-btn" style="background: none; border: none; font-size: 18px; color: #a0aec0; cursor: pointer; padding: 0; margin-left: 8px;">
          ×
        </button>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="background-color: #edf2f7; color: #4a5568; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
          ${categoryName}
        </span>
      </div>

      ${imageSection}

      ${location.description ? `
        <p style="margin: 8px 0 0 0; font-size: 14px; color: #718096; line-height: 1.5;">
          ${location.description}
        </p>
      ` : ''}

      <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #a0aec0;">
        위치: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}
      </div>
    </div>
  `;
};