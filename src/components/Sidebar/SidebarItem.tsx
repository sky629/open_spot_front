import React from 'react';
import styled from 'styled-components';
import { colors, transitions, flex } from '../../styles';

interface SidebarItemProps {
  icon: string;
  label: string;
  count: number;
  isActive?: boolean;
  onClick?: () => void;
}

const ItemContainer = styled.div<{ $isActive?: boolean }>`
  ${flex.between}
  padding: 14px 16px;
  margin: 2px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: ${transitions.default};
  background: ${props => props.$isActive ? colors.primary.subtle : 'transparent'};
  border: 1px solid ${props => props.$isActive ? colors.primary.light : 'transparent'};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${props => props.$isActive ? '3px' : '0'};
    background: ${colors.primary.main};
    transition: ${transitions.default};
  }

  &:hover {
    background: ${props => props.$isActive ? colors.primary.subtle : colors.surface.hover};
    transform: translateX(2px);
    box-shadow: ${colors.shadow.sm};
  }

  &:active {
    transform: translateX(0);
  }
`;

const LeftSection = styled.div`
  ${flex.centerY}
  gap: 14px;
`;

const IconWrapper = styled.div`
  width: 28px;
  height: 28px;
  ${flex.center}
  font-size: 18px;
  color: ${colors.primary.main};
  background: ${colors.primary.ultraLight};
  border-radius: 8px;
  transition: ${transitions.default};
`;

const Label = styled.span<{ $isActive?: boolean }>`
  font-size: 15px;
  font-weight: ${props => props.$isActive ? 600 : 500};
  color: ${props => props.$isActive ? colors.primary.main : colors.text.primary};
  transition: ${transitions.default};
`;

const CountBadge = styled.span<{ $isActive?: boolean }>`
  background: ${props => props.$isActive ? colors.primary.main : colors.surface.secondary};
  color: ${props => props.$isActive ? colors.text.inverse : colors.text.secondary};
  font-size: 13px;
  font-weight: 600;
  padding: 6px 10px;
  border-radius: 16px;
  min-width: 24px;
  text-align: center;
  transition: ${transitions.default};
  box-shadow: ${props => props.$isActive ? colors.shadow.sm : 'none'};
  border: 1px solid ${props => props.$isActive ? colors.primary.main : colors.border.secondary};
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
        <Label $isActive={isActive}>{label}</Label>
      </LeftSection>
      <CountBadge $isActive={isActive}>{count}</CountBadge>
    </ItemContainer>
  );
};