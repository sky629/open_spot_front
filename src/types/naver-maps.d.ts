// 네이버 지도 API 타입 정의

declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options: NaverMapOptions) => NaverMap;
        LatLng: new (lat: number, lng: number) => NaverLatLng;
        Marker: new (options: NaverMarkerOptions) => NaverMarker;
        InfoWindow: new (options: unknown) => unknown;
        Point: new (x: number, y: number) => { x: number; y: number };
        Size: new (width: number, height: number) => { width: number; height: number };
        Event: {
          addListener: (target: object, eventType: string, listener: () => void) => object;
          removeListener: (listener: object) => void;
        };
        MapTypeId: Record<string, string>;
      };
    };
  }
}

export interface NaverMapOptions {
  center: NaverLatLng;
  zoom: number;
  mapTypeId?: string;
  mapDataControl?: boolean;
  scaleControl?: boolean;
  logoControl?: boolean;
  mapTypeControl?: boolean;
  zoomControl?: boolean;
}

export interface NaverLatLng {
  lat: number;
  lng: number;
}

export interface NaverMap {
  setCenter(latLng: NaverLatLng): void;
  setZoom(zoom: number): void;
  getCenter(): { lat(): number; lng(): number };
  getZoom(): number;
  getBounds(): NaverLatLngBounds;
  destroy(): void;
}

export interface NaverLatLngBounds {
  hasLatLng(latLng: { lat(): number; lng(): number } | NaverLatLng): boolean;
  // 실제 네이버 지도 API v3에서는 다른 방법으로 좌표에 접근
  // API 내부에서 사용하는 좌표 접근 방법들
  getMax(): { lat(): number; lng(): number };
  getMin(): { lat(): number; lng(): number };
  getNorthEast(): { lat(): number; lng(): number };
  getSouthWest(): { lat(): number; lng(): number };
  // 안전한 접근을 위한 추가 메서드
  toString(): string;
}

export interface NaverMarkerOptions {
  position: NaverLatLng;
  map: NaverMap;
  title?: string;
  icon?: string | NaverIcon;
  animation?: string;
  clickable?: boolean;
  cursor?: string;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export interface NaverMarker {
  setPosition(latLng: NaverLatLng): void;
  getPosition(): NaverLatLng;
  setMap(map: NaverMap | null): void;
  getMap(): NaverMap;
  setTitle(title: string): void;
  getTitle(): string;
  setIcon(icon: string | NaverIcon): void;
  getIcon(): string | NaverIcon;
  setVisible(visible: boolean): void;
  getVisible(): boolean;
  destroy(): void;
}

export interface NaverIcon {
  url: string;
  size?: { width: number; height: number };
  scaledSize?: { width: number; height: number };
  origin?: { x: number; y: number };
  anchor?: { x: number; y: number };
}

export interface LocationData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  category?: string;
  iconUrl?: string;
}