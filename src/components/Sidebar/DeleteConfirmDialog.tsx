// Delete Confirm Dialog Component

import React from 'react';
import styled from 'styled-components';
import { useGroupStore, useGroupUIState } from '../../stores/group';
import { colors, transitions } from '../../styles';

export const DeleteConfirmDialog: React.FC = () => {
  const { showDeleteConfirm } = useGroupUIState();
  const { getGroupById, deleteGroup, setUIState } = useGroupStore();
  const group = showDeleteConfirm ? getGroupById(showDeleteConfirm) : null;

  const handleConfirm = () => {
    if (!group) return;

    deleteGroup(group.id);
  };

  const handleCancel = () => {
    setUIState({ showDeleteConfirm: null });
  };

  if (!group) return null;

  return (
    <Backdrop onClick={handleCancel}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <WarningIcon>⚠️</WarningIcon>
          <Title>그룹 삭제</Title>
        </DialogHeader>

        <DialogBody>
          <Message>
            정말로 <GroupName>"{group.name}"</GroupName> 그룹을 삭제하시겠습니까?
          </Message>

          {(group.locationIds?.length ?? 0) > 0 && (
            <WarningSection>
              <WarningText>
                이 그룹에는 <LocationCount>{group.locationIds?.length ?? 0}개</LocationCount>의 장소가 포함되어 있습니다.
              </WarningText>
              <WarningSubText>
                그룹을 삭제해도 장소는 삭제되지 않으며, 다른 그룹에서 계속 확인할 수 있습니다.
              </WarningSubText>
            </WarningSection>
          )}

          <AlertText>이 작업은 되돌릴 수 없습니다.</AlertText>
        </DialogBody>

        <DialogFooter>
          <CancelButton onClick={handleCancel}>
            취소
          </CancelButton>
          <DeleteButton onClick={handleConfirm}>
            삭제
          </DeleteButton>
        </DialogFooter>
      </Dialog>
    </Backdrop>
  );
};

const Backdrop = styled.div`
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

const Dialog = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: ${colors.shadow.lg};
  width: 100%;
  max-width: 20rem;
  overflow: hidden;
`;

const DialogHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-bottom: 1px solid ${colors.border.secondary};
`;

const WarningIcon = styled.span`
  font-size: 1.5rem;
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const DialogBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Message = styled.p`
  font-size: 0.875rem;
  color: ${colors.text.primary};
  margin: 0;
  line-height: 1.5;
`;

const GroupName = styled.span`
  font-weight: 600;
  color: ${colors.text.primary};
`;

const WarningSection = styled.div`
  padding: 0.75rem;
  background-color: ${colors.surface.hover};
  border: 1px solid ${colors.border.secondary};
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const WarningText = styled.p`
  font-size: 0.8125rem;
  color: ${colors.status.warning};
  margin: 0;
  line-height: 1.4;
`;

const LocationCount = styled.span`
  font-weight: 600;
  color: ${colors.text.primary};
`;

const WarningSubText = styled.p`
  font-size: 0.75rem;
  color: ${colors.text.secondary};
  margin: 0;
  line-height: 1.4;
`;

const AlertText = styled.p`
  font-size: 0.8125rem;
  color: ${colors.status.error};
  font-weight: 500;
  margin: 0;
  text-align: center;
`;

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 1.25rem;
  border-top: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const CancelButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 6px;
  background-color: white;
  color: ${colors.text.primary};
  font-size: 0.875rem;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
    border-color: ${colors.text.tertiary};
  }
`;

const DeleteButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  background-color: ${colors.status.error};
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.status.error};
  }

  &:active {
    background-color: ${colors.status.error};
  }
`;