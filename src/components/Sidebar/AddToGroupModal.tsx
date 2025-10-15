// Add To Group Modal Component

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGroupStore } from '../../stores/group';
import { useLocationStore } from '../../stores/location';
import { colors, transitions } from '../../styles';
import { logger } from '../../utils/logger';
import type { UpdateLocationRequest } from '../../types';

interface AddToGroupModalProps {
  locationId: string;
  locationName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AddToGroupModal: React.FC<AddToGroupModalProps> = ({
  locationId,
  locationName,
  isOpen,
  onClose,
}) => {
  const groups = useGroupStore((state) => state.groups);
  const getGroupsWithLocation = useGroupStore((state) => state.getGroupsWithLocation);
  const isLoading = useGroupStore((state) => state.isLoading);
  const { addLocationToGroup } = useLocationStore();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 상태만 초기화 (fetchGroups 호출 안함 - locationIds 유지)
      setSelectedGroupId(null);
      setError(null);
    }
  }, [isOpen]);

  // groups가 변경될 때마다 다시 계산
  const groupsWithLocation = getGroupsWithLocation(locationId);
  const groupsWithLocationIds = new Set(groupsWithLocation.map(g => g.id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGroupId) {
      setError('그룹을 선택해주세요');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      logger.info('Adding location to group', { locationId, groupId: selectedGroupId });

      const requestData: UpdateLocationRequest = {
        id: locationId,
        groupId: selectedGroupId,
      };

      await addLocationToGroup(requestData);

      // 백엔드에서 최신 장소 개수 조회 및 업데이트
      const { updateGroupLocationIds } = useGroupStore.getState();
      await updateGroupLocationIds(selectedGroupId);

      logger.userAction('Location added to group successfully', { locationId, groupId: selectedGroupId });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add location to group';
      setError(errorMessage);
      logger.error('Failed to add location to group', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGroupSelect = (groupId: string) => {
    // 이미 추가된 그룹인지 확인
    if (groupsWithLocationIds.has(groupId)) {
      setError('이미 이 그룹에 추가된 장소입니다');
      return;
    }
    setSelectedGroupId(groupId);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <Title>그룹에 추가</Title>
          <CloseButton onClick={onClose}>✕</CloseButton>
        </ModalHeader>

        <ModalBody>
          <LocationInfo>
            <LocationLabel>장소:</LocationLabel>
            <LocationValue>{locationName}</LocationValue>
          </LocationInfo>

          {isLoading ? (
            <LoadingMessage>그룹 목록을 불러오는 중...</LoadingMessage>
          ) : groups.length === 0 ? (
            <EmptyMessage>
              <EmptyIcon>📂</EmptyIcon>
              <EmptyText>생성된 그룹이 없습니다</EmptyText>
              <EmptyHint>먼저 그룹을 생성해주세요</EmptyHint>
            </EmptyMessage>
          ) : (
            <Form onSubmit={handleSubmit}>
              <GroupList>
                <GroupListLabel>그룹 선택</GroupListLabel>
                {groups.map((group) => {
                  const isInGroup = groupsWithLocationIds.has(group.id);
                  return (
                    <GroupItem
                      key={group.id}
                      onClick={() => !isInGroup && handleGroupSelect(group.id)}
                      $isSelected={selectedGroupId === group.id}
                      $isDisabled={isInGroup}
                    >
                      <GroupColor $color={group.color || '#8B7FD6'} />
                      <GroupName $isDisabled={isInGroup}>
                        {group.name}
                        {isInGroup && <AlreadyAddedBadge>✓ 추가됨</AlreadyAddedBadge>}
                      </GroupName>
                      {selectedGroupId === group.id && !isInGroup && (
                        <SelectedIcon>✓</SelectedIcon>
                      )}
                    </GroupItem>
                  );
                })}
              </GroupList>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <ModalFooter>
                <CancelButton type="button" onClick={onClose}>
                  취소
                </CancelButton>
                <SubmitButton
                  type="submit"
                  disabled={!selectedGroupId || isSubmitting}
                >
                  {isSubmitting ? '추가 중...' : '추가하기'}
                </SubmitButton>
              </ModalFooter>
            </Form>
          )}
        </ModalBody>
      </Modal>
    </Overlay>
  );
};

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

const Modal = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: ${colors.shadow.lg};
  max-width: 400px;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
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

const Title = styled.h3`
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
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
`;

const LocationInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: ${colors.surface.hover};
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const LocationLabel = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${colors.text.secondary};
`;

const LocationValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.text.primary};
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${colors.text.secondary};
  font-size: 0.875rem;
`;

const EmptyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 0.5rem;
  opacity: 0.5;
`;

const EmptyText = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.text.secondary};
  margin-bottom: 0.25rem;
`;

const EmptyHint = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.tertiary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const GroupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const GroupListLabel = styled.div`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${colors.text.secondary};
  margin-bottom: 0.25rem;
`;

const GroupItem = styled.div<{ $isSelected: boolean; $isDisabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 2px solid ${props =>
    props.$isDisabled
      ? colors.border.secondary
      : props.$isSelected
      ? colors.primary.main
      : colors.border.primary};
  border-radius: 6px;
  cursor: ${props => (props.$isDisabled ? 'not-allowed' : 'pointer')};
  transition: ${transitions.fast};
  background-color: ${props =>
    props.$isDisabled
      ? colors.surface.hover
      : props.$isSelected
      ? colors.primary.subtle
      : 'white'};
  opacity: ${props => (props.$isDisabled ? 0.6 : 1)};

  &:hover {
    ${props =>
      !props.$isDisabled &&
      `
      border-color: ${props.$isSelected ? colors.primary.dark : colors.text.tertiary};
      box-shadow: ${colors.shadow.sm};
    `}
  }
`;

const GroupColor = styled.div<{ $color: string }>`
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: ${props => props.$color};
  flex-shrink: 0;
`;

const GroupName = styled.div<{ $isDisabled?: boolean }>`
  flex: 1;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${props => (props.$isDisabled ? colors.text.tertiary : colors.text.primary)};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AlreadyAddedBadge = styled.span`
  font-size: 0.75rem;
  color: ${colors.status.success};
  font-weight: 600;
`;

const SelectedIcon = styled.div`
  font-size: 1.25rem;
  color: ${colors.primary.main};
  font-weight: bold;
`;

const ErrorMessage = styled.div`
  padding: 0.75rem;
  background-color: #FFF5F5;
  border: 1px solid ${colors.status.error};
  border-radius: 4px;
  color: ${colors.status.error};
  font-size: 0.8125rem;
  margin-bottom: 1rem;
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid ${colors.border.secondary};
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

const SubmitButton = styled.button`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: ${colors.primary.main};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover:not(:disabled) {
    background-color: ${colors.primary.dark};
  }

  &:disabled {
    background-color: ${colors.border.primary};
    cursor: not-allowed;
  }
`;
