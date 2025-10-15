import { Buffer } from 'buffer';

// 기본 마커 SVG 생성 함수
const createSvgMarker = (color: string): string => `
  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="10" fill="${color}" stroke="#FFFFFF" stroke-width="2"/>
    <circle cx="16" cy="16" r="4" fill="#FFFFFF"/>
  </svg>
`;

// SVG를 Base64 데이터 URI로 인코딩하는 함수
export const getMarkerIcon = (color: string): string => {
  const svg = createSvgMarker(color);
  const encodedSvg = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${encodedSvg}`;
};
