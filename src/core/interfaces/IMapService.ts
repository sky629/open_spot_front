export interface MapCoordinate {
  lat: number;
  lon: number;
}

export interface MapEvent {
  target?: unknown;
  coord?: MapCoordinate;
  point?: { x: number; y: number };
  originalEvent?: Event;
  type?: string;
}

export interface MapProjection {
  fromCoordToOffset(coord: MapCoordinate): { x: number; y: number };
  fromOffsetToCoord(point: { x: number; y: number }): MapCoordinate;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapViewport {
  center: MapCoordinate;
  zoom: number;
  bounds?: MapBounds;
}

export interface MapOptions {
  center: MapCoordinate;
  zoom: number;
  minZoom?: number;
  maxZoom?: number;
  draggable?: boolean;
  scrollable?: boolean;
  pinchable?: boolean;
  clickable?: boolean;
  keyboardShortcuts?: boolean;
  disableDoubleClickZoom?: boolean;
  disableKineticPan?: boolean;
  tileTransition?: boolean;
}

export interface MarkerOptions {
  position: MapCoordinate;
  title?: string;
  content?: string;
  icon?: string | MarkerIcon;
  zIndex?: number;
  clickable?: boolean;
  draggable?: boolean;
  visible?: boolean;
}

export interface MarkerIcon {
  url: string;
  size?: { width: number; height: number };
  anchor?: { x: number; y: number };
  origin?: { x: number; y: number };
}

export interface InfoWindowOptions {
  content: string;
  position?: MapCoordinate;
  maxWidth?: number;
  pixelOffset?: { x: number; y: number };
  zIndex?: number;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  borderRadius?: number;
  anchorSkew?: boolean;
  anchorSize?: { width: number; height: number };
  anchorColor?: string;
}

export interface IMapMarker {
  getId(): string;
  getPosition(): MapCoordinate;
  setPosition(position: MapCoordinate): void;
  getTitle(): string | undefined;
  setTitle(title: string): void;
  getVisible(): boolean;
  setVisible(visible: boolean): void;
  getZIndex(): number;
  setZIndex(zIndex: number): void;
  setIcon(icon: string | MarkerIcon): void;
  openInfoWindow(options: InfoWindowOptions): void;
  closeInfoWindow(): void;
  addListener(eventName: string, listener: (event: MapEvent) => void): void;
  removeListener(eventName: string, listener: (event: MapEvent) => void): void;
  destroy(): void;
}

export interface IInfoWindow {
  open(map: IMapService, marker?: IMapMarker): void;
  close(): void;
  setContent(content: string): void;
  setPosition(position: MapCoordinate): void;
  getPosition(): MapCoordinate | undefined;
  destroy(): void;
}

export interface IMapService {
  initialize(container: HTMLElement, options: MapOptions): Promise<void>;
  destroy(): void;

  // Map control methods
  getCenter(): MapCoordinate;
  setCenter(center: MapCoordinate): void;
  getZoom(): number;
  setZoom(zoom: number): void;
  getBounds(): MapBounds;
  setBounds(bounds: MapBounds): void;
  fitBounds(bounds: MapBounds, padding?: number): void;
  panTo(position: MapCoordinate): void;
  panBy(x: number, y: number): void;

  // Marker management
  createMarker(options: MarkerOptions): IMapMarker;
  addMarker(marker: IMapMarker): void;
  removeMarker(marker: IMapMarker): void;
  clearMarkers(): void;
  getMarkers(): IMapMarker[];

  // Info window management
  createInfoWindow(options: InfoWindowOptions): IInfoWindow;

  // Event handling
  addListener(eventName: string, listener: (event: MapEvent) => void): void;
  removeListener(eventName: string, listener: (event: MapEvent) => void): void;

  // Utility methods
  getProjection(): MapProjection;
  refresh(): void;
  resize(): void;

  // Map state
  getMapTypeId(): string;
  setMapTypeId(mapTypeId: string): void;

  // Conversion utilities
  coordToPixel(coord: MapCoordinate): { x: number; y: number };
  pixelToCoord(pixel: { x: number; y: number }): MapCoordinate;
}

export enum MapProvider {
  NAVER = 'naver',
  KAKAO = 'kakao',
  GOOGLE = 'google'
}

export interface IMapLoader {
  loadMapAPI(): Promise<void>;
  isLoaded(): boolean;
  getProvider(): MapProvider;
}

export interface IMapServiceFactory {
  createMapService(provider: MapProvider): IMapService;
  createMapLoader(provider: MapProvider): IMapLoader;
  getSupportedProviders(): MapProvider[];
}