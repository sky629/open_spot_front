// Location Section Component

import React from 'react';
import styled from 'styled-components';
import { useLocationStore } from '../../stores/location';
import { useLocationFilters, useFilteredLocations } from '../../stores/location';
import { useCategories } from '../../stores/category';
import { colors } from '../../styles';
import { LocationList } from './LocationList';

export const LocationSection: React.FC = () => {
  const { currentCategory } = useLocationFilters();
  // 검색 쿼리 확인
  const searchQuery = useLocationStore((state) => state.searchQuery);
  // 스토어의 원본 locations 사용
  const locations = useLocationStore((state) => state.locations);
  // 검색이 활성화되었으면 필터링된 결과 사용, 아니면 원본 사용
  const displayLocations = useFilteredLocations();
  const categories = useCategories();

  const getCurrentCategoryDisplay = () => {
    if (currentCategory === null) {
      return '전체';
    }
    const category = categories.find(cat => cat.id === currentCategory);
    return category?.displayName || currentCategory;
  };

  // 스토어의 원본 locations가 없으면 섹션 렌더링하지 않음
  if (!locations || locations.length === 0) {
    return null;
  }

  return (
    <Container>
      <Header>
        <TitleWithCount>
          <Title>내 장소들</Title>
          <Count>({locations.length})</Count>
        </TitleWithCount>
        <CategoryLabel>
          {getCurrentCategoryDisplay()}
        </CategoryLabel>
      </Header>

      <LocationList />
    </Container>
  );
};

const Container = styled.div`
  padding: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0 1rem;
`;

const TitleWithCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const Count = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.text.secondary};
`;

const CategoryLabel = styled.span`
  font-size: 0.8125rem;
  color: ${colors.primary.dark};
  font-weight: 500;
  background-color: ${colors.primary.subtle};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;