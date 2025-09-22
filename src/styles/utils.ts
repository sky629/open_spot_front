// 스타일링 유틸리티 함수

import { theme } from './theme';

// 미디어 쿼리 헬퍼
export const media = {
  sm: `@media (min-width: ${theme.breakpoints.sm})`,
  md: `@media (min-width: ${theme.breakpoints.md})`,
  lg: `@media (min-width: ${theme.breakpoints.lg})`,
  xl: `@media (min-width: ${theme.breakpoints.xl})`,
  mobile: `@media (max-width: ${theme.breakpoints.md})`,
  tablet: `@media (min-width: ${theme.breakpoints.md}) and (max-width: ${theme.breakpoints.lg})`,
  desktop: `@media (min-width: ${theme.breakpoints.lg})`,
};

// 공통 트랜지션
export const transitions = {
  default: `all ${theme.animation.duration.normal} ${theme.animation.easing.default}`,
  fast: `all ${theme.animation.duration.fast} ${theme.animation.easing.default}`,
  slow: `all ${theme.animation.duration.slow} ${theme.animation.easing.default}`,
  spring: `all ${theme.animation.duration.normal} ${theme.animation.easing.spring}`,
  smooth: `all ${theme.animation.duration.normal} ${theme.animation.easing.smooth}`,
};

// Flexbox 유틸리티
export const flex = {
  center: `
    display: flex;
    align-items: center;
    justify-content: center;
  `,
  centerY: `
    display: flex;
    align-items: center;
  `,
  centerX: `
    display: flex;
    justify-content: center;
  `,
  between: `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `,
  column: `
    display: flex;
    flex-direction: column;
  `,
  columnCenter: `
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  `,
};

// 텍스트 유틸리티
export const text = {
  truncate: `
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  multilineTruncate: (lines: number) => `
    display: -webkit-box;
    -webkit-line-clamp: ${lines};
    -webkit-box-orient: vertical;
    overflow: hidden;
  `,
  noSelect: `
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  `,
};

// 스크롤 유틸리티
export const scroll = {
  hidden: `
    overflow: hidden;
  `,
  auto: `
    overflow: auto;
  `,
  customScrollbar: `
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-track {
      background: ${theme.colors.surface.secondary};
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.colors.primary.light};
      border-radius: 3px;
    }
    &::-webkit-scrollbar-thumb:hover {
      background: ${theme.colors.primary.main};
    }
  `,
};

// 포지션 유틸리티
export const position = {
  absolute: (top?: string, right?: string, bottom?: string, left?: string) => `
    position: absolute;
    ${top ? `top: ${top};` : ''}
    ${right ? `right: ${right};` : ''}
    ${bottom ? `bottom: ${bottom};` : ''}
    ${left ? `left: ${left};` : ''}
  `,
  fixed: (top?: string, right?: string, bottom?: string, left?: string) => `
    position: fixed;
    ${top ? `top: ${top};` : ''}
    ${right ? `right: ${right};` : ''}
    ${bottom ? `bottom: ${bottom};` : ''}
    ${left ? `left: ${left};` : ''}
  `,
  relative: `
    position: relative;
  `,
  sticky: (top?: string) => `
    position: sticky;
    ${top ? `top: ${top};` : 'top: 0;'}
  `,
};

// 그림자 유틸리티
export const shadows = {
  card: theme.colors.shadow.purple,
  hover: theme.colors.shadow.lg,
  focus: `0 0 0 3px ${theme.colors.primary.subtle}`,
  inner: `inset 0 2px 4px 0 rgba(139, 127, 214, 0.06)`,
};

// 애니메이션 키프레임
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,
  slideLeft: `
    @keyframes slideLeft {
      from {
        opacity: 0;
        transform: translateX(10px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%, 20%, 53%, 80%, 100% {
        transform: translate3d(0, 0, 0);
      }
      40%, 43% {
        transform: translate3d(0, -5px, 0);
      }
      70% {
        transform: translate3d(0, -3px, 0);
      }
      90% {
        transform: translate3d(0, -1px, 0);
      }
    }
  `,
};

// 호버 효과 유틸리티
export const hover = {
  lift: `
    transition: ${transitions.default};
    &:hover {
      transform: translateY(-2px);
      box-shadow: ${shadows.hover};
    }
  `,
  scale: `
    transition: ${transitions.default};
    &:hover {
      transform: scale(1.05);
    }
  `,
  glow: `
    transition: ${transitions.default};
    &:hover {
      box-shadow: ${theme.colors.shadow.glow};
    }
  `,
  fade: `
    transition: ${transitions.default};
    &:hover {
      opacity: 0.8;
    }
  `,
};