// Category Filter Component

import React from 'react';
import styled from 'styled-components';
import { useLocationFilters, useLocationActions, useLocationCounts } from '../../../stores/location';
import { useCategories } from '../../../stores/category';
import { CATEGORY_ICONS } from '../../../constants/map';

export const CategoryFilter: React.FC = () => {
  const { currentCategory } = useLocationFilters();
  const { setCurrentCategory, refreshLocations } = useLocationActions();
  const locationCounts = useLocationCounts();
  const categories = useCategories();

  const handleCategoryChange = async (category: string | null) => {
    setCurrentCategory(category);

    // 카테고리 변경 시 위치 데이터 새로고침
    try {
      await refreshLocations();
    } catch (error) {
      console.error('Failed to refresh locations after category change:', error);
    }
  };

  const totalCount = Object.values(locationCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Container>
      <SectionTitle>카테고리</SectionTitle>

      <CategoryList>
        {/* 전체 보기 */}
        <CategoryItem
          $isActive={currentCategory === null}
          onClick={() => handleCategoryChange(null)}
        >
          <CategoryRow>
            <CategoryInfo>
              <CategoryIcon>{CATEGORY_ICONS.all}</CategoryIcon>
              <CategoryName>전체</CategoryName>
            </CategoryInfo>
            <CategoryCount>({totalCount})</CategoryCount>
          </CategoryRow>
        </CategoryItem>

        {/* 각 카테고리별 필터 */}
        {categories.map((category) => {
          const count = locationCounts[category.id] || 0;
          const categoryKey = category.code?.toUpperCase() as keyof typeof CATEGORY_ICONS;

          // icon이 이모지인지 확인 (길이가 1-2자이고 특수문자가 아닌 경우)
          const isEmoji = category.icon && category.icon.length <= 2 && /[\p{Emoji}]/u.test(category.icon);
          // 이모지인 경우만 백엔드 icon 사용, 아니면 프론트엔드 매핑
          const icon = isEmoji ? category.icon : (CATEGORY_ICONS[categoryKey] || '📍');

          return (
            <CategoryItem
              key={category.id}
              $isActive={currentCategory === category.id}
              onClick={() => handleCategoryChange(category.id)}
              disabled={count === 0}
            >
              <CategoryRow>
                <CategoryInfo>
                  <CategoryIcon>{icon}</CategoryIcon>
                  <CategoryName>{category.displayName}</CategoryName>
                </CategoryInfo>
                <CategoryCount>({count})</CategoryCount>
              </CategoryRow>
            </CategoryItem>
          );
        })}
      </CategoryList>

      <Divider />

      <SectionTitle>내 장소들</SectionTitle>
      <EmptyState>
        <EmptyIcon>📍</EmptyIcon>
        <EmptyText>아직 기록된 장소가 없습니다.</EmptyText>
        <EmptySubtext>지도를 클릭해서 장소를 추가해보세요</EmptySubtext>
      </EmptyState>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const SectionTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
  padding: 0 0.25rem;
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1.5rem;
`;

const CategoryItem = styled.button<{ $isActive: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: ${props => {
    if (props.$isActive) return '#f3e8ff';
    return 'transparent';
  }};
  border: none;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.15s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};
  text-align: left;

  &:hover:not(:disabled) {
    background-color: ${props => props.$isActive ? '#f3e8ff' : '#f7fafc'};
  }
`;

const CategoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const CategoryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CategoryIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const CategoryName = styled.span`
  font-size: 0.875rem;
  font-weight: 400;
  color: #374151;
`;

const CategoryCount = styled.span`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
`;

const Divider = styled.div`
  height: 1px;
  background-color: #e5e7eb;
  margin: 1rem 0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1rem;
  color: #6b7280;
`;

const EmptyIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.75rem;
  opacity: 0.6;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0 0 0.25rem 0;
  color: #374151;
`;

const EmptySubtext = styled.p`
  font-size: 0.75rem;
  margin: 0;
  color: #9ca3af;
  line-height: 1.4;
`;