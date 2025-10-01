/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IMapMarker,
  IMapService,
  MapCoordinate,
  MarkerIcon,
  InfoWindowOptions,
  MapEvent,
} from '../../../../core/interfaces/IMapService';
import { NaverInfoWindow } from './NaverInfoWindow';

// Naver Maps API 마커 타입 (최소한의 인터페이스 정의)
interface NaverMapMarker {
  setPosition: (position: { lat: number; lng: number }) => void;
  getPosition: () => { lat: () => number; lng: () => number };
  setMap: (map: unknown | null) => void;
  setIcon: (icon: unknown) => void;
  setVisible: (visible: boolean) => void;
  getVisible: () => boolean;
  addListener: (event: string, callback: () => void) => void;
  removeListener: (event: string, callback: () => void) => void;
  destroy?: () => void;
  // 누락된 메서드들 추가
  getTitle?: () => string;
  setTitle?: (title: string) => void;
  getZIndex?: () => number;
  setZIndex?: (zIndex: number) => void;
}

export class NaverMarker implements IMapMarker {
  private naverMarker: NaverMapMarker;
  private id: string;
  private infoWindow: NaverInfoWindow | null = null;
  private listeners: Map<string, ((event: MapEvent) => void)[]> = new Map();

  constructor(naverMarker: NaverMapMarker, id: string) {
    this.naverMarker = naverMarker;
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  getPosition(): MapCoordinate {
    const position = this.naverMarker.getPosition();
    return {
      lat: typeof position.lat === 'function' ? position.lat() : position.lat,
      lon: typeof position.lng === 'function' ? position.lng() : position.lng,
    };
  }

  setPosition(position: MapCoordinate): void {
    const naverLatLng = new window.naver.maps.LatLng(position.lat, position.lon);
    this.naverMarker.setPosition(naverLatLng);
  }

  getTitle(): string | undefined {
    return this.naverMarker.getTitle ? this.naverMarker.getTitle() : undefined;
  }

  setTitle(title: string): void {
    if (this.naverMarker.setTitle) {
      this.naverMarker.setTitle(title);
    }
  }

  getVisible(): boolean {
    return this.naverMarker.getVisible();
  }

  setVisible(visible: boolean): void {
    this.naverMarker.setVisible(visible);
  }

  getZIndex(): number {
    return this.naverMarker.getZIndex ? this.naverMarker.getZIndex() : 0;
  }

  setZIndex(zIndex: number): void {
    if (this.naverMarker.setZIndex) {
      this.naverMarker.setZIndex(zIndex);
    }
  }

  setIcon(icon: string | MarkerIcon): void {
    if (typeof icon === 'string') {
      this.naverMarker.setIcon(icon);
    } else {
      const naverIcon = {
        url: icon.url,
        size: icon.size ? new window.naver.maps.Size(icon.size.width, icon.size.height) : undefined,
        anchor: icon.anchor ? new window.naver.maps.Point(icon.anchor.x, icon.anchor.y) : undefined,
        origin: icon.origin ? new window.naver.maps.Point(icon.origin.x, icon.origin.y) : undefined,
      };
      this.naverMarker.setIcon(naverIcon);
    }
  }

  openInfoWindow(options: InfoWindowOptions): void {
    if (this.infoWindow) {
      this.infoWindow.close();
    }

    this.infoWindow = new NaverInfoWindow(options);
    this.infoWindow.open(null as unknown as IMapService, this); // Map service will be passed properly
  }

  closeInfoWindow(): void {
    if (this.infoWindow) {
      this.infoWindow.close();
      this.infoWindow = null;
    }
  }

  addListener(eventName: string, listener: (event: MapEvent) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);

    // Add listener to the actual Naver marker
    window.naver.maps.Event.addListener(this.naverMarker, eventName, listener as any);
  }

  removeListener(eventName: string, listener: (event: MapEvent) => void): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
        // Remove listener from the actual Naver marker
        window.naver.maps.Event.removeListener(listener as any);
      }
    }
  }

  destroy(): void {
    // Close info window if open
    if (this.infoWindow) {
      this.infoWindow.close();
      this.infoWindow = null;
    }

    // Remove all listeners
    this.listeners.forEach((listeners) => {
      listeners.forEach(listener => {
        window.naver.maps.Event.removeListener(listener as any);
      });
    });
    this.listeners.clear();

    // Remove marker from map
    this.naverMarker.setMap(null);
  }

  // Internal method to access the underlying Naver marker
  getNaverMarker(): NaverMapMarker {
    return this.naverMarker;
  }
}