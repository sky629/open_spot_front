// 지도 관련 상수

export const MAP_CONFIG = {
  DEFAULT_CENTER: {
    lat: 37.5665, // 서울 시청
    lng: 126.9780
  },
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 6,
  MAX_ZOOM: 21,
} as const;

export const MARKER_ICONS = {
  DEFAULT: '/icons/marker-default.png',
  RESTAURANT: '/icons/marker-restaurant.png',
  CAFE: '/icons/marker-cafe.png',
  SHOPPING: '/icons/marker-shopping.png',
  PARK: '/icons/marker-park.png',
} as const;

export const MAP_CATEGORIES = {
  ALL: 'all',
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  SHOPPING: 'shopping',
  PARK: 'park',
} as const;