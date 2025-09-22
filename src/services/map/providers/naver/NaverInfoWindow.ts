import {
  IInfoWindow,
  IMapService,
  IMapMarker,
  MapCoordinate,
  InfoWindowOptions,
} from '../../../../core/interfaces/IMapService';

export class NaverInfoWindow implements IInfoWindow {
  private naverInfoWindow: any;
  private options: InfoWindowOptions;

  constructor(options: InfoWindowOptions) {
    this.options = options;

    const naverOptions: any = {
      content: options.content,
    };

    if (options.maxWidth) {
      naverOptions.maxWidth = options.maxWidth;
    }

    if (options.pixelOffset) {
      naverOptions.pixelOffset = new window.naver.maps.Point(
        options.pixelOffset.x,
        options.pixelOffset.y
      );
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
      naverOptions.anchorSize = new window.naver.maps.Size(
        options.anchorSize.width,
        options.anchorSize.height
      );
    }

    if (options.anchorColor) {
      naverOptions.anchorColor = options.anchorColor;
    }

    this.naverInfoWindow = new window.naver.maps.InfoWindow(naverOptions);
  }

  open(map: IMapService, marker?: IMapMarker): void {
    if (marker && 'getNaverMarker' in marker) {
      // Open info window on marker
      this.naverInfoWindow.open((marker as any).getNaverMarker().getMap(), (marker as any).getNaverMarker());
    } else if (map && 'getNaverMap' in map) {
      // Open info window on map
      this.naverInfoWindow.open((map as any).getNaverMap());
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
  getNaverInfoWindow(): any {
    return this.naverInfoWindow;
  }
}