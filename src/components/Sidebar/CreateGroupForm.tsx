// Create Group Form Component

import React, { useState } from 'react';
import styled from 'styled-components';
import { useGroupStore } from '../../stores/group';
import { GROUP_COLORS } from '../../types/group';
import { colors, transitions } from '../../styles';

export const CreateGroupForm: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(GROUP_COLORS[0]);
  const { createGroup, setUIState } = useGroupStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) return;

    createGroup({
      name: groupName.trim(),
      color: selectedColor
    });

    // Reset form
    setGroupName('');
    setSelectedColor(GROUP_COLORS[0] as string);
  };

  const handleCancel = () => {
    setUIState({ isCreating: false });
    setGroupName('');
    setSelectedColor(GROUP_COLORS[0] as string);
  };

  return (
    <Container>
      <Form onSubmit={handleSubmit}>
        <FormHeader>
          <Title>새 그룹 만들기</Title>
        </FormHeader>

        <FormBody>
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
        </FormBody>

        <FormFooter>
          <CancelButton type="button" onClick={handleCancel}>
            취소
          </CancelButton>
          <SubmitButton type="submit" disabled={!groupName.trim()}>
            만들기
          </SubmitButton>
        </FormFooter>
      </Form>
    </Container>
  );
};

const Container = styled.div`
  padding: 0 1rem;
  margin-top: 0.5rem;
`;

const Form = styled.form`
  background-color: white;
  border: 1px solid ${colors.border.secondary};
  border-radius: 8px;
  box-shadow: ${colors.shadow.sm};
  overflow: hidden;
`;

const FormHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid ${colors.border.secondary};
  background-color: ${colors.surface.hover};
`;

const Title = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const FormBody = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.8125rem;
  font-weight: 500;
  color: ${colors.text.primary};
`;

const Input = styled.input`
  padding: 0.5rem;
  border: 1px solid ${colors.border.primary};
  border-radius: 4px;
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
  width: 2rem;
  height: 2rem;
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
      font-size: 0.875rem;
      font-weight: bold;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }
  `}
`;

const FormFooter = styled.div`
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