// Category Filter Component

import React from 'react';
import styled from 'styled-components';
import { useLocationFilters, useLocationActions, useLocationCounts } from '../../../stores/location';
import { MAP_CATEGORIES } from '../../../constants/map';

export const CategoryFilter: React.FC = () => {
  const { currentCategory } = useLocationFilters();
  const { setCurrentCategory, refreshLocations } = useLocationActions();
  const locationCounts = useLocationCounts();

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
      <Title>카테고리 필터</Title>

      <FilterList>
        {/* 전체 보기 */}
        <FilterItem
          $isActive={currentCategory === null}
          onClick={() => handleCategoryChange(null)}
        >
          <CategoryIcon>🗺️</CategoryIcon>
          <CategoryInfo>
            <CategoryName>전체</CategoryName>
            <CategoryCount>{totalCount}</CategoryCount>
          </CategoryInfo>
        </FilterItem>

        {/* 각 카테고리별 필터 */}
        {Object.entries(MAP_CATEGORIES).map(([key, name]) => {
          const count = locationCounts[key] || 0;

          return (
            <FilterItem
              key={key}
              $isActive={currentCategory === key}
              onClick={() => handleCategoryChange(key)}
              disabled={count === 0}
            >
              <CategoryIcon>{getCategoryIcon(key)}</CategoryIcon>
              <CategoryInfo>
                <CategoryName>{name}</CategoryName>
                <CategoryCount>{count}</CategoryCount>
              </CategoryInfo>
            </FilterItem>
          );
        })}
      </FilterList>
    </Container>
  );
};

// 카테고리별 아이콘 반환
const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    shopping: '🛍️',
    park: '🌳',
    entertainment: '🎭',
    accommodation: '🏨',
    default: '📍'
  };

  return icons[category] || icons.default;
};

const Container = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 1rem 0;
`;

const FilterList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const FilterItem = styled.button<{ $isActive: boolean; disabled?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.75rem;
  background-color: ${props => {
    if (props.disabled) return '#f7fafc';
    if (props.$isActive) return '#ebf8ff';
    return 'transparent';
  }};
  border: 2px solid ${props => {
    if (props.$isActive) return '#3182ce';
    return 'transparent';
  }};
  border-radius: 8px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  transition: all 0.2s ease;
  opacity: ${props => props.disabled ? 0.5 : 1};

  &:hover:not(:disabled) {
    background-color: ${props => props.$isActive ? '#ebf8ff' : '#f7fafc'};
  }
`;

const CategoryIcon = styled.span`
  font-size: 1.25rem;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const CategoryInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
`;

const CategoryName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: #2d3748;
  text-align: left;
`;

const CategoryCount = styled.span`
  font-size: 0.75rem;
  color: #718096;
  margin-top: 0.125rem;
`;