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
  DEFAULT: '/icons/marker-default.svg',
  RESTAURANT: '/icons/marker-restaurant.svg',
  CAFE: '/icons/marker-cafe.svg',
  SHOPPING: '/icons/marker-shopping.svg',
  PARK: '/icons/marker-park.svg',
} as const;

export const CATEGORY_ICONS = {
  RESTAURANT: '🍽️',
  CAFE: '☕',
  SHOPPING: '🛍️',
  PARK: '🌳',
  ENTERTAINMENT: '🎬',
  ACCOMMODATION: '🏨',
  HOSPITAL: '🏥',
  EDUCATION: '📚',
  BEAUTY: '💅',
  FITNESS: '💪',
  ETC: '📍',
  all: '🗺️'
} as const;