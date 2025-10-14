// Location Item Component

import React, { useState } from 'react';
import styled from 'styled-components';
import type { LocationResponse } from '../../types';
import { MARKER_ICONS } from '../../constants/map';
import { colors, transitions } from '../../styles';
import { useLocationStore } from '../../stores/location';
import { useCategories } from '../../stores/category';
import { AddToGroupModal } from './AddToGroupModal';

interface LocationItemProps {
  location: LocationResponse;
}

export const LocationItem: React.FC<LocationItemProps> = ({ location }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const setSelectedLocation = useLocationStore((state) => state.setSelectedLocation);
  const categories = useCategories();

  // 카테고리 displayName 가져오기
  const category = categories.find(cat => cat.id === location.category);
  const categoryDisplayName = category?.displayName || '기타';

  const handleClick = () => {
    setShowDetails(!showDetails);
  };

  const handleFocusOnMap = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setSelectedLocation(location);
  };

  const handleAddToGroup = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setShowAddToGroupModal(true);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const formatRating = (rating?: number) => {
    if (!rating) return null;
    return rating.toFixed(1);
  };

  const renderStarRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <>
        {/* 꽉 찬 별 */}
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star key={`full-${i}`} $filled>★</Star>
        ))}

        {/* 반 별 */}
        {hasHalfStar && (
          <HalfStarWrapper key="half">
            <Star $empty>★</Star>
            <HalfStar $filled>★</HalfStar>
          </HalfStarWrapper>
        )}

        {/* 빈 별 */}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star key={`empty-${i}`} $empty>★</Star>
        ))}
      </>
    );
  };

  return (
    <Container onClick={handleClick} $isExpanded={showDetails}>
      <MainContent>
        <LocationIcon>
          {MARKER_ICONS[location.category as keyof typeof MARKER_ICONS] || '📍'}
        </LocationIcon>

        <LocationInfo>
          <LocationName>{location.name}</LocationName>
          <LocationAddress>{location.address || '주소 정보 없음'}</LocationAddress>

          <LocationMeta>
            {location.rating && (
              <MetaItem>
                <StarIcon>⭐</StarIcon>
                <MetaText>{formatRating(location.rating)}</MetaText>
              </MetaItem>
            )}

            {location.distance && (
              <MetaItem>
                <MetaText>{formatDistance(location.distance)}</MetaText>
              </MetaItem>
            )}
          </LocationMeta>
        </LocationInfo>

        <ExpandIcon $isExpanded={showDetails}>
          ▼
        </ExpandIcon>
      </MainContent>

      {showDetails && (
        <DetailsContent>
          <DetailRow>
            <DetailLabel>카테고리:</DetailLabel>
            <DetailValue>{categoryDisplayName}</DetailValue>
          </DetailRow>

          {location.address && (
            <DetailRow>
              <DetailLabel>주소:</DetailLabel>
              <DetailValue>{location.address}</DetailValue>
            </DetailRow>
          )}

          {location.description && (
            <DetailRow>
              <DetailLabel>설명:</DetailLabel>
              <DetailValue>{location.description}</DetailValue>
            </DetailRow>
          )}

          {location.rating && location.rating > 0 && (
            <DetailRow>
              <DetailLabel>내 평점:</DetailLabel>
              <DetailValue>
                <RatingStars>
                  {renderStarRating(location.rating)}
                </RatingStars>
              </DetailValue>
            </DetailRow>
          )}

          {location.review && (
            <DetailRow>
              <DetailLabel>내 리뷰:</DetailLabel>
              <DetailValue>{location.review}</DetailValue>
            </DetailRow>
          )}


          {location.iconUrl && (
            <DetailRow>
              <DetailLabel>이미지:</DetailLabel>
              <DetailValue>
                <LocationImage src={location.iconUrl} alt={location.name} />
              </DetailValue>
            </DetailRow>
          )}

          <ActionButtons>
            <ActionButton $primary onClick={handleFocusOnMap}>
              지도에서 보기
            </ActionButton>
            <ActionButton onClick={handleAddToGroup}>
              그룹에 추가
            </ActionButton>
            <ActionButton $edit onClick={(e) => {
              e.stopPropagation();
              // TODO: 수정 모달 열기
              console.log('Edit location:', location.id);
            }}>
              수정
            </ActionButton>
            <ActionButton $delete onClick={(e) => {
              e.stopPropagation();
              // TODO: 삭제 확인 모달 열기
              console.log('Delete location:', location.id);
            }}>
              삭제
            </ActionButton>
          </ActionButtons>
        </DetailsContent>
      )}

      <AddToGroupModal
        locationId={location.id}
        locationName={location.name}
        isOpen={showAddToGroupModal}
        onClose={() => setShowAddToGroupModal(false)}
      />
    </Container>
  );
};

const Container = styled.div<{ $isExpanded: boolean }>`
  background-color: white;
  border: 1px solid ${colors.border.secondary};
  border-radius: 8px;
  margin: 0 1rem 0.5rem;
  cursor: pointer;
  transition: ${transitions.fast};
  overflow: hidden;

  &:hover {
    border-color: ${colors.primary.light};
    box-shadow: ${colors.shadow.sm};
  }

  ${props => props.$isExpanded && `
    border-color: ${colors.status.info};
    box-shadow: ${colors.shadow.md};
  `}
`;

const MainContent = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  gap: 0.75rem;
`;

const LocationIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const LocationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LocationName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 0.25rem;
  line-height: 1.4;
`;

const LocationAddress = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
  margin-bottom: 0.5rem;
  line-height: 1.3;
`;

const LocationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StarIcon = styled.span`
  font-size: 0.75rem;
`;

const MetaText = styled.span`
  font-size: 0.75rem;
  color: ${colors.text.secondary};
`;

const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
  font-size: 0.75rem;
  color: ${colors.text.tertiary};
  transition: ${transitions.fast};
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const DetailsContent = styled.div`
  border-top: 1px solid ${colors.border.secondary};
  padding: 0.75rem;
  background-color: ${colors.surface.hover};
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  gap: 0.5rem;

  &:last-of-type {
    margin-bottom: 0.75rem;
  }
`;

const DetailLabel = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
  font-weight: 500;
  min-width: 4rem;
  flex-shrink: 0;
`;

const DetailValue = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.primary};
  flex: 1;
  line-height: 1.4;
`;

const RatingStars = styled.span`
  font-size: 1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
`;

const Star = styled.span<{ $filled?: boolean; $empty?: boolean }>`
  color: ${props => props.$filled ? '#FFD700' : props.$empty ? '#E0E0E0' : 'inherit'};
`;

const HalfStarWrapper = styled.span`
  position: relative;
  display: inline-block;
`;

const HalfStar = styled.span<{ $filled?: boolean }>`
  position: absolute;
  left: 0;
  top: 0;
  overflow: hidden;
  width: 50%;
  color: ${props => props.$filled ? '#FFD700' : 'inherit'};
`;

const LocationImage = styled.img`
  width: 100%;
  max-height: 150px;
  object-fit: cover;
  border-radius: 6px;
  margin-top: 0.25rem;
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button<{ $primary?: boolean; $edit?: boolean; $delete?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props =>
    props.$primary
      ? colors.primary.main
      : props.$edit
      ? colors.primary.main
      : props.$delete
      ? colors.status.error
      : colors.border.primary};
  border-radius: 4px;
  background-color: ${props =>
    props.$primary
      ? colors.primary.main
      : props.$edit
      ? 'white'
      : props.$delete
      ? 'white'
      : 'white'};
  color: ${props =>
    props.$primary
      ? 'white'
      : props.$edit
      ? colors.primary.main
      : props.$delete
      ? colors.status.error
      : colors.text.primary};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${props =>
      props.$primary
        ? colors.primary.dark
        : props.$edit
        ? colors.primary.subtle
        : props.$delete
        ? '#FFF5F5'
        : colors.surface.hover};
    border-color: ${props =>
      props.$primary
        ? colors.primary.dark
        : props.$edit
        ? colors.primary.dark
        : props.$delete
        ? colors.status.error
        : colors.text.tertiary};
  }
`;