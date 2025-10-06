// Edit Group Modal Component

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useGroupStore, useGroupUIState } from '../../stores/group';
import { GROUP_COLORS } from '../../types/group';
import { colors, transitions } from '../../styles';

export const EditGroupModal: React.FC = () => {
  const { editingGroupId } = useGroupUIState();
  const { getGroupById, updateGroup, setUIState } = useGroupStore();
  const group = editingGroupId ? getGroupById(editingGroupId) : null;

  const [groupName, setGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(GROUP_COLORS[0]);

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setSelectedColor((group.color || GROUP_COLORS[0]) as string);
    }
  }, [group]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!group || !groupName.trim()) return;

    updateGroup(group.id, {
      name: groupName.trim(),
      color: selectedColor
    });
  };

  const handleCancel = () => {
    setUIState({ editingGroupId: null });
  };

  if (!group) return null;

  return (
    <Backdrop onClick={handleCancel}>
      <Modal onClick={(e) => e.stopPropagation()}>
        <Form onSubmit={handleSubmit}>
          <ModalHeader>
            <Title>그룹 수정</Title>
            <CloseButton type="button" onClick={handleCancel}>
              ×
            </CloseButton>
          </ModalHeader>

          <ModalBody>
            <InputGroup>
              <Label>그룹 이름</Label>
              <Input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="그룹 이름을 입력하세요"
                maxLength={20}
                autoFocus
              />
            </InputGroup>

            <InputGroup>
              <Label>색상</Label>
              <ColorGrid>
                {GROUP_COLORS.map((color) => (
                  <ColorOption
                    key={color}
                    type="button"
                    $color={color}
                    $isSelected={selectedColor === color}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </ColorGrid>
            </InputGroup>

            <InfoSection>
              <InfoItem>
                <InfoLabel>포함된 장소:</InfoLabel>
                <InfoValue>{group.locationIds?.length ?? 0}개</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel>생성일:</InfoLabel>
                <InfoValue>
                  {new Date(group.createdAt).toLocaleDateString('ko-KR')}
                </InfoValue>
              </InfoItem>
            </InfoSection>
          </ModalBody>

          <ModalFooter>
            <CancelButton type="button" onClick={handleCancel}>
              취소
            </CancelButton>
            <SubmitButton type="submit" disabled={!groupName.trim()}>
              수정 완료
            </SubmitButton>
          </ModalFooter>
        </Form>
      </Modal>
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

const Modal = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: ${colors.shadow.lg};
  width: 100%;
  max-width: 24rem;
  max-height: 90vh;
  overflow: hidden;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const Title = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: none;
  color: ${colors.text.secondary};
  font-size: 1.5rem;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
    color: ${colors.text.primary};
  }
`;

const ModalBody = styled.div`
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  flex: 1;
  overflow-y: auto;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.text.primary};
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 6px;
  font-size: 0.875rem;
  transition: ${transitions.fast};

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 3px ${colors.primary.subtle};
  }

  &::placeholder {
    color: ${colors.text.tertiary};
  }
`;

const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
`;

const ColorOption = styled.button<{ $color: string; $isSelected: boolean }>`
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid ${props => props.$isSelected ? colors.text.secondary : colors.border.primary};
  border-radius: 50%;
  background-color: ${props => props.$color};
  cursor: pointer;
  transition: ${transitions.fast};
  position: relative;

  &:hover {
    transform: scale(1.1);
    border-color: ${colors.text.secondary};
  }

  &:active {
    transform: scale(0.95);
  }

  ${props => props.$isSelected && `
    &::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 1rem;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  `}
`;

const InfoSection = styled.div`
  padding: 1rem;
  background-color: ${colors.surface.hover};
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const InfoItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const InfoLabel = styled.span`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
`;

const InfoValue = styled.span`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${colors.text.primary};
`;

const ModalFooter = styled.div`
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

const SubmitButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
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