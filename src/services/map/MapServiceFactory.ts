import {
  IMapService,
  IMapLoader,
  IMapServiceFactory,
  MapProvider
} from '../../core/interfaces/IMapService';
import { NaverMapService } from './providers/naver/NaverMapService';
import { NaverMapLoader } from './providers/naver/NaverMapLoader';

export class MapServiceFactory implements IMapServiceFactory {
  private static instance: MapServiceFactory;

  private constructor() {}

  public static getInstance(): MapServiceFactory {
    if (!MapServiceFactory.instance) {
      MapServiceFactory.instance = new MapServiceFactory();
    }
    return MapServiceFactory.instance;
  }

  createMapService(provider: MapProvider): IMapService {
    switch (provider) {
      case MapProvider.NAVER:
        return new NaverMapService();
      case MapProvider.KAKAO:
        // TODO: Implement KakaoMapService
        throw new Error('KakaoMapService not implemented yet');
      case MapProvider.GOOGLE:
        // TODO: Implement GoogleMapService
        throw new Error('GoogleMapService not implemented yet');
      default:
        throw new Error(`Unsupported map provider: ${provider}`);
    }
  }

  createMapLoader(provider: MapProvider): IMapLoader {
    switch (provider) {
      case MapProvider.NAVER:
        return new NaverMapLoader();
      case MapProvider.KAKAO:
        // TODO: Implement KakaoMapLoader
        throw new Error('KakaoMapLoader not implemented yet');
      case MapProvider.GOOGLE:
        // TODO: Implement GoogleMapLoader
        throw new Error('GoogleMapLoader not implemented yet');
      default:
        throw new Error(`Unsupported map loader for provider: ${provider}`);
    }
  }

  getSupportedProviders(): MapProvider[] {
    // For now, only return the providers we plan to support
    // Will expand as implementations are added
    return [MapProvider.NAVER, MapProvider.KAKAO, MapProvider.GOOGLE];
  }

  /**
   * Get the default map provider based on environment or configuration
   */
  getDefaultProvider(): MapProvider {
    // For now, default to Naver Maps as it's currently implemented
    // This could be configurable via environment variables in the future
    return MapProvider.NAVER;
  }

  /**
   * Check if a provider is supported
   */
  isProviderSupported(provider: MapProvider): boolean {
    return this.getSupportedProviders().includes(provider);
  }
}