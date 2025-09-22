// 네이버맵 스타일 UI 테마 시스템

import { colors } from './colors';

export const theme = {
  colors,

  // 타이포그래피
  typography: {
    fontFamily: {
      primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },

  // 스페이싱
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // 브레이크포인트
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },

  // 컴포넌트별 스타일
  components: {
    // 사이드바
    sidebar: {
      width: '320px',
      background: colors.surface.primary,
      borderRadius: '0',
      boxShadow: colors.shadow.lg,
      padding: '1rem',
    },

    // 버튼
    button: {
      primary: {
        background: colors.gradients.button,
        color: colors.text.inverse,
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '14px',
        fontWeight: 500,
        boxShadow: colors.shadow.sm,
        border: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          background: colors.gradients.hover,
          boxShadow: colors.shadow.md,
          transform: 'translateY(-1px)',
        },
        '&:active': {
          transform: 'translateY(0)',
          boxShadow: colors.shadow.sm,
        },
      },
      secondary: {
        background: 'transparent',
        color: colors.primary.main,
        border: `1px solid ${colors.border.purple}`,
        borderRadius: '8px',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          background: colors.surface.hover,
          borderColor: colors.primary.dark,
        },
      },
      ghost: {
        background: 'transparent',
        color: colors.text.secondary,
        border: 'none',
        borderRadius: '8px',
        padding: '0.5rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          background: colors.surface.hover,
          color: colors.primary.main,
        },
      },
    },

    // 카드
    card: {
      background: colors.surface.primary,
      borderRadius: '12px',
      boxShadow: colors.shadow.purple,
      padding: '1rem',
      border: `1px solid ${colors.border.light}`,
      transition: 'all 0.2s ease-in-out',
      '&:hover': {
        boxShadow: colors.shadow.lg,
        transform: 'translateY(-2px)',
      },
    },

    // 사이드바 아이템
    sidebarItem: {
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      margin: '0.25rem 0',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      fontSize: '0.875rem',
      fontWeight: 500,
      color: colors.text.secondary,
      '&:hover': {
        background: colors.surface.hover,
        color: colors.primary.main,
      },
      '&.active': {
        background: colors.primary.subtle,
        color: colors.primary.main,
        borderLeft: `3px solid ${colors.primary.main}`,
        fontWeight: 600,
      },
    },

    // 헤더
    header: {
      background: colors.gradients.header,
      color: colors.text.inverse,
      padding: '1rem 1.5rem',
      borderRadius: '0',
      boxShadow: colors.shadow.md,
    },

    // 토글 버튼
    toggle: {
      background: colors.primary.main,
      color: colors.text.inverse,
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      boxShadow: colors.shadow.md,
      '&:hover': {
        background: colors.primary.dark,
        boxShadow: colors.shadow.lg,
        transform: 'scale(1.05)',
      },
    },
  },

  // 애니메이션
  animation: {
    duration: {
      fast: '0.15s',
      normal: '0.2s',
      slow: '0.3s',
    },
    easing: {
      default: 'ease-in-out',
      spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },

  // Z-인덱스
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },
} as const;

// 타입 정의
export type Theme = typeof theme;
export type ThemeColors = typeof theme.colors;
export type ThemeSpacing = keyof typeof theme.spacing;
export type ThemeBreakpoint = keyof typeof theme.breakpoints;

// 기본 내보내기
export default theme;