// Category Service Interface

import type { CategoryResponse } from '../../types';

/**
 * 카테고리 서비스 인터페이스
 * 장소 카테고리 관련 비즈니스 로직을 정의합니다.
 */
export interface ICategoryService {
  /**
   * 모든 카테고리 목록을 조회합니다.
   * @returns 카테고리 목록 (displayOrder로 정렬됨)
   */
  getCategories(): Promise<CategoryResponse[]>;
}
