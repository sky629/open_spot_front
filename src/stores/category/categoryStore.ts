// Category Store Implementation with Zustand

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CategoryResponse } from '../../types';
import type { ICategoryService } from '../../core/interfaces';
import { logger } from '../../utils/logger';

// 의존성 주입을 위한 서비스 참조
let categoryService: ICategoryService | null = null;

export const setCategoryServiceForStore = (service: ICategoryService) => {
  categoryService = service;
  logger.info('Category service injected into store');
};

interface CategoryState {
  categories: CategoryResponse[];
  isLoading: boolean;
  error: string | null;

  // 액션들
  fetchCategories: () => Promise<void>;
  reset: () => void;
}

const initialState = {
  categories: [],
  isLoading: false,
  error: null,
};

export const useCategoryStore = create<CategoryState>()(
  devtools(
    (set) => ({
      ...initialState,

      fetchCategories: async () => {
        if (!categoryService) {
          throw new Error('Category service not initialized');
        }

        set({ isLoading: true, error: null });

        try {
          const categories = await categoryService.getCategories();

          set({
            categories,
            isLoading: false,
          });

          logger.info('Categories fetched successfully', { count: categories.length });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch categories';
          set({ error: errorMessage, isLoading: false });
          logger.error('Failed to fetch categories', error);
          throw error;
        }
      },

      reset: () => {
        set(initialState);
        logger.info('Category store reset');
      },
    }),
    { name: 'CategoryStore' }
  )
);

// Selectors
export const useCategories = () => useCategoryStore((state) => state.categories);
export const useCategoriesLoading = () => useCategoryStore((state) => state.isLoading);
export const useCategoriesError = () => useCategoryStore((state) => state.error);
