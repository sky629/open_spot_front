// Location Item Component

import React, { useState } from 'react';
import styled from 'styled-components';
import type { LocationResponse, UpdateLocationRequest } from '../../types';
import { MARKER_ICONS } from '../../constants/map';
import { colors, transitions } from '../../styles';
import { useLocationStore } from '../../stores/location';
import { useCategories } from '../../stores/category';
import { useGroups, useGroupStore } from '../../stores/group';
import { AddToGroupModal } from './AddToGroupModal';
import { EditLocationModal } from './EditLocationModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface LocationItemProps {
  location: LocationResponse;
}

export const LocationItem: React.FC<LocationItemProps> = ({ location }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRemoveGroupConfirm, setShowRemoveGroupConfirm] = useState(false);

  const selectedLocation = useLocationStore((state) => state.selectedLocation);
  const focusLocationOnMap = useLocationStore((state) => state.focusLocationOnMap);
  const updateLocation = useLocationStore((state) => state.updateLocation);
  const deleteLocation = useLocationStore((state) => state.deleteLocation);
  const removeLocationFromGroup = useLocationStore((state) => state.removeLocationFromGroup);
  const categories = useCategories();
  const groups = useGroups();

  // 현재 장소가 선택되었는지 확인
  const isHighlighted = selectedLocation?.id === location.id;

  // 카테고리 displayName 가져오기
  const category = categories.find(cat => cat.id === location.category);
  const categoryDisplayName = category?.displayName || '기타';

  // 속한 그룹 찾기
  const belongingGroup = location.groupId
    ? groups.find(g => g.id === location.groupId)
    : null;

  const handleClick = () => {
    setShowDetails(!showDetails);
  };

  const handleFocusOnMap = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    focusLocationOnMap(location); // 지도 이동 포함
  };

  const handleAddToGroup = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setShowAddToGroupModal(true);
  };

  const handleRemoveFromGroup = (e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 방지
    setShowRemoveGroupConfirm(true);
  };

  const confirmRemoveFromGroup = async () => {
    if (!location.groupId) return;

    try {
      const previousGroupId = location.groupId;

      await removeLocationFromGroup({
        id: location.id,
        groupId: undefined
      });

      // 그룹 동기화
      const { updateGroupLocationIds } = useGroupStore.getState();
      await updateGroupLocationIds(previousGroupId);

      setShowRemoveGroupConfirm(false);
    } catch (error) {
      console.error('Failed to remove from group', error);
    }
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
    <Container onClick={handleClick} $isExpanded={showDetails} $isHighlighted={isHighlighted}>
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

        <RightSection>
          {belongingGroup && (
            <GroupBadge $color={belongingGroup.color || '#8B7FD6'}>
              {belongingGroup.name}
              <RemoveIcon
                onClick={handleRemoveFromGroup}
                title="그룹에서 제거"
              >
                ×
              </RemoveIcon>
            </GroupBadge>
          )}

          <ExpandIcon $isExpanded={showDetails}>
            ▼
          </ExpandIcon>
        </RightSection>
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
              setShowEditModal(true);
            }}>
              수정
            </ActionButton>
            <ActionButton $delete onClick={(e) => {
              e.stopPropagation();
              setShowDeleteModal(true);
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

      <EditLocationModal
        location={location}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={async (requestData: UpdateLocationRequest) => {
          await updateLocation(requestData);
        }}
      />

      <DeleteConfirmModal
        locationId={location.id}
        locationName={location.name}
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async (id: string) => {
          await deleteLocation(id);
        }}
      />

      {/* 그룹 제거 확인 모달 */}
      {showRemoveGroupConfirm && belongingGroup && (
        <Overlay onClick={() => setShowRemoveGroupConfirm(false)}>
          <ConfirmModal onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>그룹에서 제거</ModalTitle>
              <CloseButton onClick={() => setShowRemoveGroupConfirm(false)}>✕</CloseButton>
            </ModalHeader>
            <ModalBody>
              <ConfirmMessage>
                <strong>{location.name}</strong>를<br />
                <strong style={{ color: belongingGroup.color }}>{belongingGroup.name}</strong> 그룹에서 제거하시겠습니까?
              </ConfirmMessage>
            </ModalBody>
            <ModalFooter>
              <CancelButton onClick={() => setShowRemoveGroupConfirm(false)}>
                취소
              </CancelButton>
              <ConfirmButton onClick={confirmRemoveFromGroup}>
                제거
              </ConfirmButton>
            </ModalFooter>
          </ConfirmModal>
        </Overlay>
      )}
    </Container>
  );
};

const Container = styled.div<{ $isExpanded: boolean; $isHighlighted: boolean }>`
  background-color: ${props => props.$isHighlighted ? colors.primary.subtle : 'white'};
  border: 2px solid ${props => props.$isHighlighted ? colors.primary.main : colors.border.secondary};
  border-radius: 8px;
  margin: 0 1rem 0.5rem;
  cursor: pointer;
  transition: ${transitions.fast};
  overflow: hidden;

  &:hover {
    border-color: ${props => props.$isHighlighted ? colors.primary.dark : colors.primary.light};
    box-shadow: ${colors.shadow.sm};
  }

  ${props => props.$isExpanded && `
    border-color: ${props.$isHighlighted ? colors.primary.dark : colors.status.info};
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

const RightSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
  font-size: 0.75rem;
  color: ${colors.text.tertiary};
  transition: ${transitions.fast};
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
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

const GroupBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  background-color: ${props => props.$color};
  color: white;
  border-radius: 10px;
  font-size: 0.6875rem;
  font-weight: 500;
  max-width: fit-content;
  white-space: nowrap;
`;

const RemoveIcon = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
  line-height: 1;
  cursor: pointer;
  transition: ${transitions.fast};
  padding: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ConfirmModal = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: ${colors.shadow.lg};
  max-width: 400px;
  width: 100%;
  overflow: hidden;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const ModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.25rem;
  color: ${colors.text.tertiary};
  cursor: pointer;
  padding: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
    color: ${colors.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const ConfirmMessage = styled.p`
  font-size: 0.9375rem;
  color: ${colors.text.primary};
  line-height: 1.6;
  margin: 0;

  strong {
    font-weight: 600;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const CancelButton = styled.button`
  padding: 0.5rem 1rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 4px;
  background-color: white;
  color: ${colors.text.primary};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
    border-color: ${colors.text.tertiary};
  }
`;

const ConfirmButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: ${colors.status.error};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: #E53E3E;
  }
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