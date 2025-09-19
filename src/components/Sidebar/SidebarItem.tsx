import React from 'react';
import styled from 'styled-components';

interface SidebarItemProps {
  icon: string;
  label: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
}

const ItemContainer = styled.div<{ $isActive?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.$isActive ? '#E3F2FD' : 'transparent'};
  border: 1px solid ${props => props.$isActive ? '#2196F3' : 'transparent'};

  &:hover {
    background: ${props => props.$isActive ? '#E3F2FD' : '#f5f5f5'};
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`;

const Label = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #333;
`;

const CountBadge = styled.span<{ $isActive?: boolean }>`
  background: ${props => props.$isActive ? '#2196F3' : '#e0e0e0'};
  color: ${props => props.$isActive ? 'white' : '#666'};
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
`;

export const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  label,
  count,
  isActive = false,
  onClick
}) => {
  return (
    <ItemContainer $isActive={isActive} onClick={onClick}>
      <LeftSection>
        <IconWrapper>{icon}</IconWrapper>
        <Label>{label}</Label>
      </LeftSection>
      <CountBadge $isActive={isActive}>({count})</CountBadge>
    </ItemContainer>
  );
};