// Category Service Implementation

import { getCategories as getCategoriesFactory } from '../api/generated/categories/categories';
import type { ICategoryService } from '../core/interfaces';
import type { CategoryResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * 카테고리 서비스 구현체
 * 백엔드 API를 통해 카테고리 데이터를 조회합니다.
 */
export class CategoryService implements ICategoryService {
  private categoriesApi = getCategoriesFactory();

  /**
   * 모든 카테고리 목록을 조회합니다.
   * @returns 카테고리 목록 (displayOrder로 정렬됨)
   */
  async getCategories(): Promise<CategoryResponse[]> {
    logger.info('Fetching categories from API');

    try {
      const response = await this.categoriesApi.getCategories();

      if (response.success && response.data) {
        // API 응답을 CategoryResponse 배열로 변환
        const categories = response.data as unknown as CategoryResponse[];

        // displayOrder로 정렬
        const sortedCategories = categories.sort((a, b) => a.displayOrder - b.displayOrder);

        logger.info(`Successfully fetched ${sortedCategories.length} categories`);
        return sortedCategories;
      }

      throw new Error('Failed to fetch categories: No data returned');
    } catch (error) {
      logger.error('Error fetching categories', error);
      throw error;
    }
  }
}
