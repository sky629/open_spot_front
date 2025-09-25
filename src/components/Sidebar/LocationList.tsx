// Location List Component

import React from 'react';
import styled from 'styled-components';
import { useLocations, useLocationLoading, useLocationError, useLocationFilters } from '../../stores/location';
import { colors } from '../../styles';
import { LocationItem } from './LocationItem';

export const LocationList: React.FC = () => {
  const locations = useLocations();
  const loading = useLocationLoading();
  const error = useLocationError();
  const { currentCategory } = useLocationFilters();

  // Filter locations by current category
  const filteredLocations = React.useMemo(() => {
    if (!currentCategory) return locations;
    return locations.filter(location => location.category === currentCategory);
  }, [locations, currentCategory]);

  if (loading) {
    return (
      <Container>
        <LoadingState>
          <LoadingIcon>⏳</LoadingIcon>
          <LoadingText>장소를 불러오는 중...</LoadingText>
        </LoadingState>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorState>
          <ErrorIcon>❌</ErrorIcon>
          <ErrorText>장소를 불러오는 중 오류가 발생했습니다</ErrorText>
          <ErrorSubText>{error}</ErrorSubText>
        </ErrorState>
      </Container>
    );
  }

  if (filteredLocations.length === 0) {
    return (
      <Container>
        <EmptyState>
          <EmptyIcon>📍</EmptyIcon>
          <EmptyText>해당 카테고리에 장소가 없습니다</EmptyText>
          <EmptySubText>다른 카테고리를 선택해보세요</EmptySubText>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <List>
        {filteredLocations.map((location) => (
          <LocationItem
            key={location.id}
            location={location}
          />
        ))}
      </List>
    </Container>
  );
};

const Container = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const LoadingState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
`;

const LoadingIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  animation: pulse 1.5s infinite;

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const LoadingText = styled.div`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
`;

const ErrorIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 0.5rem;
`;

const ErrorText = styled.div`
  font-size: 0.875rem;
  color: ${colors.status.error};
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ErrorSubText = styled.div`
  font-size: 0.8125rem;
  color: ${colors.status.error};
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  margin-bottom: 0.25rem;
`;

const EmptySubText = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.tertiary};
`;