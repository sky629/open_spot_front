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
  ENTERTAINMENT: 'entertainment',
  ACCOMMODATION: 'accommodation',
} as const;

export const CATEGORY_LABELS = {
  all: '전체',
  restaurant: '음식점',
  cafe: '카페',
  shopping: '쇼핑',
  park: '공원',
  entertainment: '놀거리',
  accommodation: '숙소',
} as const;

export const CATEGORY_ICONS = {
  restaurant: '🍽️',
  cafe: '☕',
  shopping: '🛍️',
  park: '🌳',
  entertainment: '🎭',
  accommodation: '🏨',
  all: '🗺️'
} as const;