// 위치 마커 컴포넌트

import React, { useEffect, useRef } from 'react';
import { MARKER_ICONS } from '../../constants';
import type { NaverMap, NaverMarker, LocationResponse } from '../../types';

interface LocationMarkerProps {
  map: NaverMap;
  location: LocationResponse;
  onClick?: (location: LocationResponse) => void;
}

export const LocationMarker: React.FC<LocationMarkerProps> = ({
  map,
  location,
  onClick,
}) => {
  const markerRef = useRef<NaverMarker | null>(null);

  useEffect(() => {
    if (!map || !window.naver) return;

    // 카테고리에 따른 아이콘 선택
    const getIconUrl = (category?: string) => {
      switch (category) {
        case 'restaurant':
          return MARKER_ICONS.RESTAURANT;
        case 'cafe':
          return MARKER_ICONS.CAFE;
        case 'shopping':
          return MARKER_ICONS.SHOPPING;
        case 'park':
          return MARKER_ICONS.PARK;
        default:
          return MARKER_ICONS.DEFAULT;
      }
    };

    // 마커 생성
    const marker = new window.naver.maps.Marker({
      position: new window.naver.maps.LatLng(location.latitude, location.longitude),
      map: map,
      title: location.name,
      icon: {
        url: location.iconUrl || getIconUrl(location.category),
        size: new window.naver.maps.Size(32, 32),
        scaledSize: new window.naver.maps.Size(32, 32),
        origin: new window.naver.maps.Point(0, 0),
        anchor: new window.naver.maps.Point(16, 32),
      },
      zIndex: 100,
    });

    markerRef.current = marker;

    // 클릭 이벤트 리스너
    const clickListener = window.naver.maps.Event.addListener(
      marker,
      'click',
      () => {
        if (onClick) {
          onClick(location);
        }
      }
    );

    // 정보창 생성
    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="
          padding: 10px;
          min-width: 200px;
          font-family: Arial, sans-serif;
        ">
          <h4 style="margin: 0 0 8px 0; font-size: 16px;">${location.name}</h4>
          ${location.description ? `<p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">${location.description}</p>` : ''}
          ${location.category ? `<span style="
            background: #f0f0f0;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 12px;
            color: #333;
          ">${location.category}</span>` : ''}
        </div>
      `,
      borderWidth: 0,
      anchorSize: new window.naver.maps.Size(0, 0),
      pixelOffset: new window.naver.maps.Point(0, -10),
    });

    // 마커 클릭 시 정보창 토글
    window.naver.maps.Event.addListener(marker, 'click', () => {
      if ((infoWindow as any).getMap()) {
        (infoWindow as any).close();
      } else {
        (infoWindow as any).open(map, marker);
      }
    });

    // 정리 함수
    return () => {
      window.naver.maps.Event.removeListener(clickListener);
      if ((infoWindow as any).getMap()) {
        (infoWindow as any).close();
      }
      marker.setMap(null);
    };
  }, [map, location, onClick]);

  // 위치가 변경된 경우 마커 위치 업데이트
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setPosition(
        new window.naver.maps.LatLng(location.latitude, location.longitude)
      );
    }
  }, [location.latitude, location.longitude]);

  return null; // 이 컴포넌트는 DOM을 렌더링하지 않음
};