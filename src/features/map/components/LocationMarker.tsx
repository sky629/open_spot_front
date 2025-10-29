// Location Marker Component
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from 'react';
import type { LocationResponse, NaverMap } from '../../../types';
import { MARKER_ICONS } from '../../../constants/map';
import { useCategories } from '../../../stores/category';
import { useLocationStore } from '../../../stores/location';
import { useGroupStore } from '../../../stores/group';
import { getMarkerIcon } from '../../../utils/mapIcon';

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

export const LocationMarker: React.FC<LocationMarkerProps> = React.memo(({
  map,
  location,
  onClick
}) => {
  const markerRef = useRef<NaverMarker | null>(null);
  const infoWindowRef = useRef<NaverInfoWindow | null>(null);
  const categories = useCategories();
  const getGroupById = useGroupStore((state) => state.getGroupById);

  useEffect(() => {
    if (!map || !location.latitude || !location.longitude) {
      console.log('❌ LocationMarker: Missing requirements', {
        hasMap: !!map,
        lat: location.latitude,
        lng: location.longitude,
        locationName: location.name
      });
      return;
    }

    console.log('✅ Creating marker for:', location.name);

    // 마커 생성
    const position = new window.naver.maps.LatLng(location.latitude, location.longitude);

    // 그룹 색상 또는 카테고리에 따른 아이콘 선택
    const group = location.groupId ? getGroupById(location.groupId) : undefined;
    const iconUrl = group && group.color
      ? getMarkerIcon(group.color)
      : location.category && location.category in MARKER_ICONS
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

    console.log('✅ Marker created successfully for:', location.name);

    markerRef.current = marker as any;

    // 카테고리 displayName 찾기
    const category = categories.find(cat => cat.id === location.category);
    const categoryDisplayName = category?.displayName || '기타';

    console.log('📝 Creating info window content for:', location.name);
    const content = createInfoWindowContent(location, categoryDisplayName);
    console.log('📝 Content created, length:', content.length);

    // 정보창 생성
    let infoWindow;
    try {
      infoWindow = new window.naver.maps.InfoWindow({
        content: content,
        maxWidth: 350,
        anchorSize: new window.naver.maps.Size(20, 10),
        anchorSkew: true,
        borderColor: '#cecdc7',
        borderWidth: 2,
        backgroundColor: 'white',
        pixelOffset: new window.naver.maps.Point(0, -10)
      });

      console.log('✅ InfoWindow created successfully');

      infoWindowRef.current = infoWindow as any;
    } catch (error) {
      console.error('❌ Failed to create InfoWindow:', error);
      return;
    }

    // 마커 클릭 이벤트
    const clickListener = window.naver.maps.Event.addListener(marker, 'click', () => {
      console.log('🎯 MARKER CLICKED!', location.name);
      console.log('InfoWindow exists:', !!infoWindow);
      console.log('Map exists:', !!map);
      console.log('Marker exists:', !!marker);

      const { setSelectedLocation, setOpenInfoWindow } = useLocationStore.getState();

      // 사이드바 하이라이트 설정
      setSelectedLocation(location);
      console.log('✅ Selected location set:', location.name);

      // 정보창 열기 전에 이전 정보창 닫기 (store에서 자동 처리)
      setOpenInfoWindow(infoWindow as any);

      // 정보창 열기
      console.log('Opening InfoWindow...');
      try {
        (infoWindow as any).open(map, marker);
        console.log('✅ InfoWindow.open() called successfully');

        // 정보창이 열린 후 이벤트 리스너 설정
        setTimeout(() => {
          const isOpen = (infoWindow as any).getMap();
          console.log('InfoWindow is now open?', !!isOpen);

          if (isOpen) {
            setupInfoWindowEvents();
          }
        }, 100);
      } catch (error) {
        console.error('❌ Failed to open InfoWindow:', error);
      }

      onClick?.(location);
    });

    // 정보창 버튼 이벤트 (동적으로 추가됨)
    const setupInfoWindowEvents = () => {
      const closeButton = document.querySelector(`[data-location-id="${location.id}"] .close-btn`);

      console.log('Setting up info window events for location:', location.id);
      console.log('Close button found:', !!closeButton);
      console.log('Location data:', {
        description: location.description,
        review: location.review,
        rating: location.rating,
        address: location.address
      });

      if (closeButton) {
        closeButton.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          console.log('Close button clicked');
          (infoWindow as any).close();

          // 하이라이트 및 정보창 참조 제거
          const { setSelectedLocation, setOpenInfoWindow } = useLocationStore.getState();
          setSelectedLocation(null);
          setOpenInfoWindow(null);
          console.log('✅ Selected location cleared');
        }, { once: false }); // Allow multiple clicks
      }
    };

    // InfoWindow가 닫힐 때 하이라이트 제거 (외부 클릭 등)
    const closeclickListener = window.naver.maps.Event.addListener(infoWindow as any, 'closeclick', () => {
      console.log('InfoWindow closeclick event');
      const { setSelectedLocation, setOpenInfoWindow } = useLocationStore.getState();
      setSelectedLocation(null);
      setOpenInfoWindow(null);
      console.log('✅ Selected location cleared (closeclick)');
    });

    // 정보창이 열릴 때 이벤트 설정
    const domReadyListener = window.naver.maps.Event.addListener(infoWindow as any, 'domready', setupInfoWindowEvents);

    // 지도 이동 시 정보창이 자동으로 닫히는 것을 감지하여 하이라이트 제거
    // Naver Maps는 지도 이동 시 정보창을 자동으로 닫지만 이벤트를 발생시키지 않음
    let checkInterval: NodeJS.Timeout | null = null;
    let wasOpen = !!(infoWindow as any).getMap(); // 초기 상태 확인

    const startCheckingInfoWindow = () => {
      checkInterval = setInterval(() => {
        const isCurrentlyOpen = !!(infoWindow as any).getMap();

        // 이전에 열려있었는데 지금 닫혀있으면 → 자동으로 닫힌 것
        if (wasOpen && !isCurrentlyOpen) {
          console.log('🔍 InfoWindow auto-closed detected (map moved)');
          const { selectedLocation, setSelectedLocation, setOpenInfoWindow } = useLocationStore.getState();

          // 현재 선택된 위치가 이 마커의 위치인 경우에만 하이라이트 제거
          if (selectedLocation?.id === location.id) {
            setSelectedLocation(null);
            setOpenInfoWindow(null);
            console.log('✅ Selected location cleared (auto-close)');
          }
          wasOpen = false;
        } else if (isCurrentlyOpen) {
          wasOpen = true;
        }
      }, 200); // 200ms마다 체크
    };

    startCheckingInfoWindow();

    // 클린업
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      window.naver.maps.Event.removeListener(clickListener);
      window.naver.maps.Event.removeListener(domReadyListener);
      window.naver.maps.Event.removeListener(closeclickListener);

      if ((infoWindow as any).getMap()) {
        (infoWindow as any).close();
      }
      marker.setMap(null);
    };
  }, [map, location.id, location.latitude, location.longitude, location.category, location.groupId]);

  // 위치 업데이트
  useEffect(() => {
    if (markerRef.current && location.latitude && location.longitude) {
      const newPosition = new window.naver.maps.LatLng(location.latitude, location.longitude);
      (markerRef.current as any).setPosition(newPosition);
    }
  }, [location.latitude, location.longitude]);

  // 이 컴포넌트는 실제로 렌더링되지 않음 (마커는 지도에 직접 추가됨)
  return null;
}, (prevProps, nextProps) => {
  // location.id, groupId가 같고 map이 같으면 리렌더링 방지
  return prevProps.location.id === nextProps.location.id &&
         prevProps.location.groupId === nextProps.location.groupId &&
         prevProps.map === nextProps.map;
});

// 별점을 HTML로 변환하는 헬퍼 함수 (정보창용)
const formatStarRatingHTML = (rating: number): string => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHTML = '';

  // 꽉 찬 별
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<span style="color: #FFD700;">★</span>';
  }

  // 반 별 (CSS로 반만 채우기)
  if (hasHalfStar) {
    starsHTML += '<span style="position: relative; display: inline-block;">' +
                 '<span style="color: #E0E0E0;">★</span>' +
                 '<span style="position: absolute; left: 0; top: 0; overflow: hidden; width: 50%; color: #FFD700;">★</span>' +
                 '</span>';
  }

  // 빈 별
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<span style="color: #E0E0E0;">★</span>';
  }

  return starsHTML;
};

// 정보창 HTML 생성 함수
const createInfoWindowContent = (location: LocationResponse, categoryDisplayName: string): string => {
  const categoryName = categoryDisplayName;

  // 이름 옆에 표시할 평점
  const ratingInTitle = location.rating && location.rating > 0
    ? `<span style="margin-left: 8px; font-size: 14px; display: inline-flex; align-items: center;">${formatStarRatingHTML(location.rating)}</span>`
    : '';

  const imageSection = location.iconUrl
    ? `<div class="info-image" style="margin-bottom: 12px;">
         <img src="${location.iconUrl}" alt="${location.name}"
              style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px;" />
       </div>`
    : '';

  const addressSection = location.address
    ? `<div style="margin-bottom: 10px;">
         <div style="font-size: 12px; color: #718096; font-weight: 500; margin-bottom: 4px;">📍 주소</div>
         <div style="font-size: 13px; color: #4a5568; line-height: 1.4;">
           ${location.address}
         </div>
       </div>`
    : '';

  const descriptionSection = location.description && location.description.trim()
    ? `<div style="margin-bottom: 10px;">
         <div style="font-size: 12px; color: #718096; font-weight: 500; margin-bottom: 4px;">📝 설명</div>
         <div style="font-size: 13px; color: #4a5568; line-height: 1.5;">
           ${location.description}
         </div>
       </div>`
    : '';

  const reviewSection = location.review
    ? `<div style="margin-bottom: 10px;">
         <div style="font-size: 12px; color: #718096; font-weight: 500; margin-bottom: 4px;">💭 내 리뷰</div>
         <div style="font-size: 13px; color: #4a5568; line-height: 1.5; padding: 8px; background-color: #f7fafc; border-radius: 6px;">
           ${location.review}
         </div>
       </div>`
    : '';

  return `
    <div data-location-id="${location.id}" style="padding: 16px; min-width: 280px; max-width: 350px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
        <div style="flex: 1; display: flex; align-items: center; flex-wrap: wrap;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #2d3748; line-height: 1.4;">
            ${location.name || '위치 정보'}
          </h3>
          ${ratingInTitle}
        </div>
        <button class="close-btn" style="background: none; border: none; font-size: 24px; color: #a0aec0; cursor: pointer; padding: 0 0 0 8px; line-height: 1; flex-shrink: 0;">
          ×
        </button>
      </div>

      <div style="display: flex; align-items: center; margin-bottom: 12px;">
        <span style="background-color: #edf2f7; color: #4a5568; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;">
          ${categoryName}
        </span>
      </div>

      ${imageSection}
      ${addressSection}
      ${descriptionSection}
      ${reviewSection}
    </div>
  `;
};