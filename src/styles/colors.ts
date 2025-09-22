// 네이버맵 스타일 연보라색 컬러 시스템

export const colors = {
  // 메인 연보라색 계열
  primary: {
    main: '#8B7FD6',        // 메인 브랜드 컬러
    dark: '#6B5FB0',        // 호버, 액티브 상태
    light: '#A394E8',       // 하이라이트, 보조 요소
    subtle: '#F5F3FF',      // 서브틀 배경
    ultraLight: '#FEFBFF',  // 매우 연한 배경
  },

  // 그라데이션
  gradients: {
    primary: 'linear-gradient(135deg, #8B7FD6 0%, #A394E8 100%)',
    header: 'linear-gradient(135deg, #8B7FD6 0%, #A394E8 100%)',
    card: 'linear-gradient(145deg, #F5F3FF 0%, #FFFFFF 100%)',
    button: 'linear-gradient(135deg, #8B7FD6 0%, #6B5FB0 100%)',
    hover: 'linear-gradient(135deg, #6B5FB0 0%, #8B7FD6 100%)',
  },

  // 텍스트 컬러
  text: {
    primary: '#2D3748',     // 메인 텍스트 (다크 그레이)
    secondary: '#718096',   // 보조 텍스트 (미디엄 그레이)
    tertiary: '#A0AEC0',    // 삼차 텍스트 (라이트 그레이)
    inverse: '#FFFFFF',     // 반전 텍스트 (흰색)
    purple: '#8B7FD6',      // 강조 텍스트 (연보라)
    muted: '#9CA3AF',       // 음소거된 텍스트
  },

  // 배경 컬러
  background: {
    primary: '#FAFAFA',     // 전체 페이지 배경
    secondary: '#F7FAFC',   // 보조 배경
    paper: '#FFFFFF',       // 카드, 모달 배경
    elevated: '#FFFFFF',    // 상승된 요소 배경
    overlay: 'rgba(45, 55, 72, 0.4)', // 오버레이 배경
  },

  // 표면 컬러 (카드, 사이드바 등)
  surface: {
    primary: '#FFFFFF',     // 메인 표면
    secondary: '#F7FAFC',   // 보조 표면
    elevated: '#FFFFFF',    // 상승된 표면
    hover: '#F5F3FF',       // 호버 상태
    selected: '#F5F3FF',    // 선택된 상태
  },

  // 보더 컬러
  border: {
    primary: '#E2E8F0',     // 메인 보더
    secondary: '#EDF2F7',   // 보조 보더
    light: '#F7FAFC',       // 연한 보더
    purple: '#A394E8',      // 연보라 보더
    focus: '#8B7FD6',       // 포커스 보더
  },

  // 그림자
  shadow: {
    sm: '0 1px 3px rgba(139, 127, 214, 0.12), 0 1px 2px rgba(139, 127, 214, 0.08)',
    md: '0 4px 6px rgba(139, 127, 214, 0.12), 0 2px 4px rgba(139, 127, 214, 0.08)',
    lg: '0 10px 15px rgba(139, 127, 214, 0.15), 0 4px 6px rgba(139, 127, 214, 0.1)',
    xl: '0 20px 25px rgba(139, 127, 214, 0.15), 0 10px 10px rgba(139, 127, 214, 0.08)',
    purple: '0 4px 12px rgba(139, 127, 214, 0.15)',
    glow: '0 0 20px rgba(139, 127, 214, 0.3)',
  },

  // 상태 컬러
  status: {
    success: '#48BB78',     // 성공
    warning: '#ED8936',     // 경고
    error: '#F56565',       // 에러
    info: '#4299E1',        // 정보
  },

  // 카테고리별 컬러 (지도 마커용)
  category: {
    all: '#8B7FD6',         // 전체
    restaurant: '#F56565',  // 음식점 (빨강)
    cafe: '#ED8936',        // 카페 (주황)
    shopping: '#4299E1',    // 쇼핑 (파랑)
    park: '#48BB78',        // 공원 (초록)
  },

  // 네이버맵 스타일 컬러
  naver: {
    blue: '#03C75A',        // 네이버 대표 색상
    lightBlue: '#E3F2FD',   // 연한 파랑
    darkBlue: '#1976D2',    // 진한 파랑
  },
} as const;

// 타입 정의
export type ColorKey = keyof typeof colors;
export type PrimaryColorKey = keyof typeof colors.primary;
export type TextColorKey = keyof typeof colors.text;
export type BackgroundColorKey = keyof typeof colors.background;
export type SurfaceColorKey = keyof typeof colors.surface;
export type BorderColorKey = keyof typeof colors.border;
export type ShadowColorKey = keyof typeof colors.shadow;
export type StatusColorKey = keyof typeof colors.status;
export type CategoryColorKey = keyof typeof colors.category;