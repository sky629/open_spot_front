import {
  IMapService,
  IMapMarker,
  IInfoWindow,
  MapCoordinate,
  MapBounds,
  MapOptions,
  MarkerOptions,
  InfoWindowOptions,
  MapEvent,
  MapProjection,
} from '../../../../core/interfaces/IMapService';
import { NaverMarker } from './NaverMarker';
import { NaverInfoWindow } from './NaverInfoWindow';
import { logger } from '../../../../utils/logger';

// Naver Maps API 맵 타입 정의
interface NaverMapInstance {
  setCenter: (center: { lat: number; lng: number }) => void;
  getCenter: () => { lat: () => number; lng: () => number };
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  getBounds: () => {
    getMax: () => { lat: () => number; lng: () => number };
    getMin: () => { lat: () => number; lng: () => number };
    getNorthEast: () => { lat: () => number; lng: () => number };
    getSouthWest: () => { lat: () => number; lng: () => number };
  };
  addListener: (event: string, callback: () => void) => void;
  removeListener: (event: string, callback: () => void) => void;
  destroy?: () => void;
}

interface NaverMapOptions {
  center: { lat: number; lng: number };
  zoom: number;
  mapTypeId?: string;
  mapDataControl?: boolean;
  scaleControl?: boolean;
  logoControl?: boolean;
  mapTypeControl?: boolean;
  zoomControl?: boolean;
}

interface NaverMarkerOptions {
  position: { lat: number; lng: number };
  map: NaverMapInstance;
  title?: string;
  icon?: string | { url: string };
  animation?: string;
  clickable?: boolean;
  cursor?: string;
  draggable?: boolean;
  visible?: boolean;
  zIndex?: number;
}

export class NaverMapService implements IMapService {
  private naverMap: NaverMapInstance;
  private markers: Map<string, NaverMarker> = new Map();
  private listeners: Map<string, ((event: MapEvent) => void)[]> = new Map();
  private markerIdCounter = 0;

  async initialize(container: HTMLElement, options: MapOptions): Promise<void> {
    if (!window.naver || !window.naver.maps) {
      throw new Error('Naver Maps API is not loaded');
    }

    try {
      const naverOptions: NaverMapOptions & {
        draggable?: boolean;
        scrollWheel?: boolean;
        keyboardShortcuts?: boolean;
        disableDoubleClickZoom?: boolean;
        disableDoubleTapZoom?: boolean;
        disableTwoFingerTapZoom?: boolean;
      } = {
        center: new window.naver.maps.LatLng(options.center.lat, options.center.lng),
        zoom: options.zoom,
        mapTypeId: window.naver.maps.MapTypeId.NORMAL,
        mapDataControl: false,
        scaleControl: true,
        logoControl: true,
        mapTypeControl: true,
        zoomControl: true,
        draggable: options.draggable !== false,
        scrollWheel: options.scrollable !== false,
        keyboardShortcuts: options.keyboardShortcuts !== false,
        disableDoubleClickZoom: options.disableDoubleClickZoom === true,
        disableKineticPan: options.disableKineticPan === true,
        pinchZoom: options.pinchable !== false,
        tileTransition: options.tileTransition !== false,
      };

      if (options.minZoom !== undefined) {
        naverOptions.minZoom = options.minZoom;
      }

      if (options.maxZoom !== undefined) {
        naverOptions.maxZoom = options.maxZoom;
      }

      this.naverMap = new (window.naver.maps as { Map: new (element: HTMLElement, options: unknown) => NaverMapInstance }).Map(container, naverOptions);
      logger.info('Naver Map service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Naver Map service', error);
      throw error;
    }
  }

  destroy(): void {
    // Clear all markers
    this.clearMarkers();

    // Remove all listeners
    this.listeners.forEach((listeners, eventName) => {
      listeners.forEach(listener => {
        window.naver.maps.Event.removeListener(this.naverMap, eventName, listener);
      });
    });
    this.listeners.clear();

    // Destroy the map
    if (this.naverMap && this.naverMap.destroy) {
      this.naverMap.destroy();
    }
    this.naverMap = null;
  }

  getCenter(): MapCoordinate {
    const center = this.naverMap.getCenter();
    return {
      lat: typeof center.lat === 'function' ? center.lat() : center.lat,
      lng: typeof center.lng === 'function' ? center.lng() : center.lng,
    };
  }

  setCenter(center: MapCoordinate): void {
    const naverLatLng = new window.naver.maps.LatLng(center.lat, center.lng);
    this.naverMap.setCenter(naverLatLng);
  }

  getZoom(): number {
    return this.naverMap.getZoom();
  }

  setZoom(zoom: number): void {
    this.naverMap.setZoom(zoom);
  }

  getBounds(): MapBounds {
    const bounds = this.naverMap.getBounds();

    let northEast, southWest;
    try {
      northEast = bounds.getNorthEast();
      southWest = bounds.getSouthWest();
    } catch (e) {
      try {
        northEast = bounds.getMax();
        southWest = bounds.getMin();
      } catch (e2) {
        throw new Error('Failed to get map bounds');
      }
    }

    return {
      north: typeof northEast.lat === 'function' ? northEast.lat() : northEast.lat,
      south: typeof southWest.lat === 'function' ? southWest.lat() : southWest.lat,
      east: typeof northEast.lng === 'function' ? northEast.lng() : northEast.lng,
      west: typeof southWest.lng === 'function' ? southWest.lng() : southWest.lng,
    };
  }

  setBounds(bounds: MapBounds): void {
    const naverBounds = new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(bounds.south, bounds.west),
      new window.naver.maps.LatLng(bounds.north, bounds.east)
    );
    this.naverMap.fitBounds(naverBounds);
  }

  fitBounds(bounds: MapBounds, padding: number = 0): void {
    const naverBounds = new window.naver.maps.LatLngBounds(
      new window.naver.maps.LatLng(bounds.south, bounds.west),
      new window.naver.maps.LatLng(bounds.north, bounds.east)
    );

    if (padding > 0) {
      this.naverMap.fitBounds(naverBounds, { top: padding, right: padding, bottom: padding, left: padding });
    } else {
      this.naverMap.fitBounds(naverBounds);
    }
  }

  panTo(position: MapCoordinate): void {
    const naverLatLng = new window.naver.maps.LatLng(position.lat, position.lng);
    this.naverMap.panTo(naverLatLng);
  }

  panBy(x: number, y: number): void {
    this.naverMap.panBy(new window.naver.maps.Point(x, y));
  }

  createMarker(options: MarkerOptions): IMapMarker {
    const markerId = `marker_${++this.markerIdCounter}`;

    const naverMarkerOptions: NaverMarkerOptions = {
      position: new window.naver.maps.LatLng(options.position.lat, options.position.lng),
      map: this.naverMap,
      title: options.title,
      clickable: options.clickable !== false,
      draggable: options.draggable === true,
      visible: options.visible !== false,
      zIndex: options.zIndex || 0,
    };

    if (options.icon) {
      if (typeof options.icon === 'string') {
        naverMarkerOptions.icon = options.icon;
      } else {
        naverMarkerOptions.icon = {
          url: options.icon.url,
          size: options.icon.size ? new window.naver.maps.Size(options.icon.size.width, options.icon.size.height) : undefined,
          anchor: options.icon.anchor ? new window.naver.maps.Point(options.icon.anchor.x, options.icon.anchor.y) : undefined,
          origin: options.icon.origin ? new window.naver.maps.Point(options.icon.origin.x, options.icon.origin.y) : undefined,
        };
      }
    }

    const naverMarker = new window.naver.maps.Marker(naverMarkerOptions);
    const marker = new NaverMarker(naverMarker, markerId);

    this.markers.set(markerId, marker);
    return marker;
  }

  addMarker(marker: IMapMarker): void {
    if (marker instanceof NaverMarker) {
      marker.getNaverMarker().setMap(this.naverMap);
      this.markers.set(marker.getId(), marker);
    }
  }

  removeMarker(marker: IMapMarker): void {
    if (marker instanceof NaverMarker) {
      marker.getNaverMarker().setMap(null);
      this.markers.delete(marker.getId());
    }
  }

  clearMarkers(): void {
    this.markers.forEach(marker => {
      marker.destroy();
    });
    this.markers.clear();
  }

  getMarkers(): IMapMarker[] {
    return Array.from(this.markers.values());
  }

  createInfoWindow(options: InfoWindowOptions): IInfoWindow {
    return new NaverInfoWindow(options);
  }

  addListener(eventName: string, listener: (event: MapEvent) => void): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);

    window.naver.maps.Event.addListener(this.naverMap, eventName, listener);
  }

  removeListener(eventName: string, listener: (event: MapEvent) => void): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
        window.naver.maps.Event.removeListener(this.naverMap, eventName, listener);
      }
    }
  }

  getProjection(): MapProjection {
    return this.naverMap.getProjection();
  }

  refresh(): void {
    // Trigger a resize/refresh of the map
    window.naver.maps.Event.trigger(this.naverMap, 'resize');
  }

  resize(): void {
    this.refresh();
  }

  getMapTypeId(): string {
    return this.naverMap.getMapTypeId();
  }

  setMapTypeId(mapTypeId: string): void {
    this.naverMap.setMapTypeId(mapTypeId);
  }

  coordToPixel(coord: MapCoordinate): { x: number; y: number } {
    const projection = this.naverMap.getProjection();
    const naverLatLng = new window.naver.maps.LatLng(coord.lat, coord.lng);
    const point = projection.fromCoordToOffset(naverLatLng);
    return { x: point.x, y: point.y };
  }

  pixelToCoord(pixel: { x: number; y: number }): MapCoordinate {
    const projection = this.naverMap.getProjection();
    const point = new window.naver.maps.Point(pixel.x, pixel.y);
    const naverLatLng = projection.fromOffsetToCoord(point);
    return {
      lat: typeof naverLatLng.lat === 'function' ? naverLatLng.lat() : naverLatLng.lat,
      lng: typeof naverLatLng.lng === 'function' ? naverLatLng.lng() : naverLatLng.lng,
    };
  }

  // Internal method to access the underlying Naver map
  getNaverMap(): NaverMapInstance {
    return this.naverMap;
  }
}