import {
  IMapMarker,
  MapCoordinate,
  MarkerIcon,
  InfoWindowOptions,
  MapEvent,
} from '../../../../core/interfaces/IMapService';
import { NaverInfoWindow } from './NaverInfoWindow';

export class NaverMarker implements IMapMarker {
  private naverMarker: any;
  private id: string;
  private infoWindow: NaverInfoWindow | null = null;
  private listeners: Map<string, ((event: MapEvent) => void)[]> = new Map();

  constructor(naverMarker: any, id: string) {
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
      lng: typeof position.lng === 'function' ? position.lng() : position.lng,
    };
  }

  setPosition(position: MapCoordinate): void {
    const naverLatLng = new window.naver.maps.LatLng(position.lat, position.lng);
    this.naverMarker.setPosition(naverLatLng);
  }

  getTitle(): string | undefined {
    return this.naverMarker.getTitle();
  }

  setTitle(title: string): void {
    this.naverMarker.setTitle(title);
  }

  getVisible(): boolean {
    return this.naverMarker.getVisible();
  }

  setVisible(visible: boolean): void {
    this.naverMarker.setVisible(visible);
  }

  getZIndex(): number {
    return this.naverMarker.getZIndex();
  }

  setZIndex(zIndex: number): void {
    this.naverMarker.setZIndex(zIndex);
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
    this.infoWindow.open(null as any, this); // Map service will be passed properly
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
    window.naver.maps.Event.addListener(this.naverMarker, eventName, listener);
  }

  removeListener(eventName: string, listener: (event: MapEvent) => void): void {
    const eventListeners = this.listeners.get(eventName);
    if (eventListeners) {
      const index = eventListeners.indexOf(listener);
      if (index !== -1) {
        eventListeners.splice(index, 1);
        // Remove listener from the actual Naver marker
        window.naver.maps.Event.removeListener(this.naverMarker, eventName, listener);
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
    this.listeners.forEach((listeners, eventName) => {
      listeners.forEach(listener => {
        window.naver.maps.Event.removeListener(this.naverMarker, eventName, listener);
      });
    });
    this.listeners.clear();

    // Remove marker from map
    this.naverMarker.setMap(null);
  }

  // Internal method to access the underlying Naver marker
  getNaverMarker(): any {
    return this.naverMarker;
  }
}