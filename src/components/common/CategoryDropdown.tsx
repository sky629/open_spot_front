// Category Dropdown Component

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { useLocationFilters, useLocationActions, useLocationCounts } from '../../stores/location';
import { useCategories } from '../../stores/category';
import { CATEGORY_ICONS } from '../../constants/map';
import { colors, transitions } from '../../styles';

export const CategoryDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { currentCategory } = useLocationFilters();
  const { setCurrentCategory, refreshLocations } = useLocationActions();
  const locationCounts = useLocationCounts();
  const categories = useCategories();


  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCategoryChange = async (category: string | null) => {
    setCurrentCategory(category);
    setIsOpen(false);

    try {
      await refreshLocations();
    } catch (error) {
      console.error('Failed to refresh locations after category change:', error);
    }
  };

  const getCurrentCategoryDisplay = () => {
    if (currentCategory === null) {
      const totalCount = Object.values(locationCounts).reduce((sum, count) => sum + count, 0);
      return {
        icon: CATEGORY_ICONS.all,
        name: '전체',
        count: totalCount
      };
    }

    // 카테고리 ID로 실제 카테고리 찾기
    const category = categories.find(cat => cat.id === currentCategory);
    const categoryKey = category?.code?.toUpperCase() as keyof typeof CATEGORY_ICONS;

    // icon이 이모지인지 확인 (길이가 1-2자이고 특수문자가 아닌 경우)
    const isEmoji = category?.icon && category.icon.length <= 2 && /[\p{Emoji}]/u.test(category.icon);

    return {
      // 이모지인 경우만 백엔드 icon 사용, 아니면 프론트엔드 매핑
      icon: isEmoji ? category.icon : (CATEGORY_ICONS[categoryKey] || '📍'),
      name: category?.displayName || currentCategory,
      count: locationCounts[currentCategory] || 0
    };
  };

  const currentDisplay = getCurrentCategoryDisplay();
  const totalCount = Object.values(locationCounts).reduce((sum, count) => sum + count, 0);

  return (
    <Container ref={dropdownRef}>
      <DropdownButton onClick={() => setIsOpen(!isOpen)} $isOpen={isOpen}>
        <ButtonContent>
          <CategoryIcon>{currentDisplay.icon}</CategoryIcon>
          <CategoryName>{currentDisplay.name}</CategoryName>
          <CategoryCount>({currentDisplay.count})</CategoryCount>
        </ButtonContent>
        <ArrowIcon $isOpen={isOpen}>▼</ArrowIcon>
      </DropdownButton>

      {isOpen && (
        <DropdownMenu>
          {/* 전체 보기 */}
          <DropdownItem
            onClick={() => handleCategoryChange(null)}
            $isSelected={currentCategory === null}
          >
            <ItemContent>
              <ItemInfo>
                <ItemIcon>{CATEGORY_ICONS.all}</ItemIcon>
                <ItemName>전체</ItemName>
              </ItemInfo>
              <ItemCount>({totalCount})</ItemCount>
            </ItemContent>
          </DropdownItem>

          <Divider />

          {/* 각 카테고리별 옵션 */}
          {categories.map((category) => {
            const count = locationCounts[category.id] || 0;
            const categoryKey = category.code?.toUpperCase() as keyof typeof CATEGORY_ICONS;

            // icon이 이모지인지 확인 (길이가 1-2자이고 특수문자가 아닌 경우)
            const isEmoji = category.icon && category.icon.length <= 2 && /[\p{Emoji}]/u.test(category.icon);
            // 이모지인 경우만 백엔드 icon 사용, 아니면 프론트엔드 매핑
            const icon = isEmoji ? category.icon : (CATEGORY_ICONS[categoryKey] || '📍');

            return (
              <DropdownItem
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                $isSelected={currentCategory === category.id}
                $disabled={count === 0}
              >
                <ItemContent>
                  <ItemInfo>
                    <ItemIcon>{icon}</ItemIcon>
                    <ItemName>{category.displayName}</ItemName>
                  </ItemInfo>
                  <ItemCount>({count})</ItemCount>
                </ItemContent>
              </DropdownItem>
            );
          })}
        </DropdownMenu>
      )}
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: inline-block;
  min-width: 180px;
`;

const DropdownButton = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.5rem 0.75rem;
  background-color: white;
  border: 1px solid ${colors.border.primary};
  border-radius: 6px;
  cursor: pointer;
  transition: ${transitions.fast};
  font-size: 0.875rem;

  &:hover {
    border-color: ${colors.status.info};
    box-shadow: ${colors.shadow.sm};
  }

  &:focus {
    outline: none;
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 3px ${colors.primary.subtle};
  }

  ${props => props.$isOpen && `
    border-color: ${colors.primary.main};
    box-shadow: 0 0 0 3px ${colors.primary.subtle};
  `}
`;

const ButtonContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CategoryIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const CategoryName = styled.span`
  font-weight: 500;
  color: ${colors.text.primary};
`;

const CategoryCount = styled.span`
  color: ${colors.text.secondary};
  font-size: 0.8125rem;
`;

const ArrowIcon = styled.span<{ $isOpen: boolean }>`
  font-size: 0.75rem;
  color: ${colors.text.tertiary};
  transition: ${transitions.fast};
  transform: ${props => props.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)'};
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 50;
  margin-top: 0.25rem;
  background-color: white;
  border: 1px solid ${colors.border.secondary};
  border-radius: 6px;
  box-shadow: ${colors.shadow.md};
  overflow: hidden;
  max-height: 300px;
  overflow-y: auto;
`;

const DropdownItem = styled.button<{ $isSelected?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.625rem 0.75rem;
  background-color: ${props => {
    if (props.$isSelected) return colors.primary.subtle;
    return 'transparent';
  }};
  border: none;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  transition: ${transitions.fast};
  opacity: ${props => props.$disabled ? 0.5 : 1};
  text-align: left;

  &:hover:not(:disabled) {
    background-color: ${props => props.$isSelected ? colors.primary.subtle : colors.surface.hover};
  }
`;

const ItemContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const ItemInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ItemIcon = styled.span`
  font-size: 1rem;
  flex-shrink: 0;
`;

const ItemName = styled.span`
  font-size: 0.875rem;
  font-weight: 400;
  color: ${colors.text.primary};
`;

const ItemCount = styled.span`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border.secondary};
  margin: 0.25rem 0;
`;