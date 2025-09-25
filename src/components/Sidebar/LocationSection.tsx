// Location Section Component

import React from 'react';
import styled from 'styled-components';
import { useLocationFilters } from '../../stores/location';
import { MAP_CATEGORIES } from '../../constants/map';
import { colors } from '../../styles';
import { LocationList } from './LocationList';

export const LocationSection: React.FC = () => {
  const { currentCategory } = useLocationFilters();

  const getCurrentCategoryDisplay = () => {
    if (currentCategory === null) {
      return '전체';
    }
    return MAP_CATEGORIES[currentCategory as keyof typeof MAP_CATEGORIES] || currentCategory;
  };

  return (
    <Container>
      <Header>
        <Title>내 장소들</Title>
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

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const CategoryLabel = styled.span`
  font-size: 0.8125rem;
  color: ${colors.primary.dark};
  font-weight: 500;
  background-color: ${colors.primary.subtle};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
`;