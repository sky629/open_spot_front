import {
  IInfoWindow,
  IMapService,
  IMapMarker,
  MapCoordinate,
  InfoWindowOptions,
} from '../../../../core/interfaces/IMapService';

// Naver Maps InfoWindow 타입 정의
interface NaverMapInfoWindow {
  setContent: (content: string) => void;
  open: (map: unknown, anchor: unknown) => void;
  close: () => void;
  setPosition: (position: { lat: number; lng: number }) => void;
  getPosition: () => { lat: () => number; lng: () => number } | null;
  setMap: (map: unknown | null) => void;
  getMap: () => unknown | null;
}

interface NaverInfoWindowOptions {
  content: string;
  maxWidth?: number;
  pixelOffset?: { x: number; y: number };
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  zIndex?: number;
  anchorSize?: { width: number; height: number };
  anchorSkew?: boolean;
  anchorColor?: string;
  disableAnchor?: boolean;
  disableAutoPan?: boolean;
}

export class NaverInfoWindow implements IInfoWindow {
  private naverInfoWindow: NaverMapInfoWindow;
  private options: InfoWindowOptions;

  constructor(options: InfoWindowOptions) {
    this.options = options;

    const naverOptions: NaverInfoWindowOptions = {
      content: options.content,
    };

    if (options.maxWidth) {
      naverOptions.maxWidth = options.maxWidth;
    }

    if (options.pixelOffset) {
      naverOptions.pixelOffset = new (window.naver.maps as { Point: new (x: number, y: number) => unknown }).Point(
        options.pixelOffset.x,
        options.pixelOffset.y
      ) as { x: number; y: number };
    }

    if (options.zIndex) {
      naverOptions.zIndex = options.zIndex;
    }

    if (options.borderColor) {
      naverOptions.borderColor = options.borderColor;
    }

    if (options.borderWidth) {
      naverOptions.borderWidth = options.borderWidth;
    }

    if (options.backgroundColor) {
      naverOptions.backgroundColor = options.backgroundColor;
    }

    if (options.borderRadius) {
      naverOptions.borderRadius = options.borderRadius;
    }

    if (options.anchorSkew !== undefined) {
      naverOptions.anchorSkew = options.anchorSkew;
    }

    if (options.anchorSize) {
      naverOptions.anchorSize = new (window.naver.maps as { Size: new (width: number, height: number) => unknown }).Size(
        options.anchorSize.width,
        options.anchorSize.height
      ) as { width: number; height: number };
    }

    if (options.anchorColor) {
      naverOptions.anchorColor = options.anchorColor;
    }

    this.naverInfoWindow = new (window.naver.maps as { InfoWindow: new (options: NaverInfoWindowOptions) => NaverMapInfoWindow }).InfoWindow(naverOptions);
  }

  open(map: IMapService, marker?: IMapMarker): void {
    if (marker && 'getNaverMarker' in marker) {
      // Open info window on marker
      const naverMarker = (marker as { getNaverMarker: () => { getMap: () => unknown } }).getNaverMarker();
      this.naverInfoWindow.open(naverMarker.getMap(), naverMarker);
    } else if (map && 'getNaverMap' in map) {
      // Open info window on map
      const naverMap = (map as { getNaverMap: () => unknown }).getNaverMap();
      this.naverInfoWindow.open(naverMap, null as unknown);
    }
  }

  close(): void {
    this.naverInfoWindow.close();
  }

  setContent(content: string): void {
    this.options.content = content;
    this.naverInfoWindow.setContent(content);
  }

  setPosition(position: MapCoordinate): void {
    this.options.position = position;
    const naverLatLng = new window.naver.maps.LatLng(position.lat, position.lng);
    this.naverInfoWindow.setPosition(naverLatLng);
  }

  getPosition(): MapCoordinate | undefined {
    const position = this.naverInfoWindow.getPosition();
    if (position) {
      return {
        lat: typeof position.lat === 'function' ? position.lat() : position.lat,
        lng: typeof position.lng === 'function' ? position.lng() : position.lng,
      };
    }
    return this.options.position;
  }

  destroy(): void {
    this.close();
    // Naver InfoWindow doesn't have explicit destroy method
    // The close() method handles cleanup
  }

  // Internal method to access the underlying Naver info window
  getNaverInfoWindow(): NaverMapInfoWindow {
    return this.naverInfoWindow;
  }
}