import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { SidebarItem } from './SidebarItem';
import { MAP_CATEGORIES } from '../../constants';
import { colors, media, transitions, flex, shadows, keyframes } from '../../styles';

interface SidebarProps {
  isOpen: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onToggle: () => void;
  locationCounts?: Record<string, number>;
}

// Mobile overlay backdrop
const Overlay = styled.div<{ $isOpen: boolean; $isMobile: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${colors.background.overlay};
  z-index: 1500;
  opacity: ${props => (props.$isOpen && props.$isMobile) ? 1 : 0};
  visibility: ${props => (props.$isOpen && props.$isMobile) ? 'visible' : 'hidden'};
  transition: ${transitions.smooth};
  backdrop-filter: blur(2px);
`;

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  position: relative;
  width: ${props => props.$isOpen ? '320px' : '0'};
  height: 100%;
  background: ${colors.surface.primary};
  border-right: 1px solid ${colors.border.light};
  box-shadow: ${props => props.$isOpen ? shadows.card : 'none'};
  transition: ${transitions.smooth};
  overflow: hidden;
  flex-shrink: 0;
  z-index: 1002;

  ${keyframes.slideLeft}
  animation: ${props => props.$isOpen ? 'slideLeft 0.3s ease-out' : 'none'};

  ${media.mobile} {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: ${props => props.$isOpen ? '85vw' : '0'};
    max-width: 320px;
    z-index: 1600;
    box-shadow: ${props => props.$isOpen ? colors.shadow.xl : 'none'};
  }
`;

const SidebarHeader = styled.div`
  ${flex.between}
  padding: 24px 20px;
  border-bottom: 1px solid ${colors.border.light};
  background: ${colors.gradients.header};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    opacity: 0.5;
  }
`;

const HeaderLeft = styled.div`
  ${flex.centerY}
  gap: 12px;
  position: relative;
  z-index: 1;
`;

const SidebarIcon = styled.div`
  width: 44px;
  height: 44px;
  background: ${colors.surface.primary};
  border-radius: 12px;
  ${flex.center}
  color: ${colors.primary.main};
  font-size: 20px;
  box-shadow: ${colors.shadow.sm};
  position: relative;
  z-index: 1;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${colors.primary.subtle};
    border-radius: 12px;
    opacity: 0.3;
  }
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: ${colors.text.inverse};
  position: relative;
  z-index: 1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const CloseButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  ${flex.center}
  color: ${colors.text.inverse};
  font-size: 18px;
  transition: ${transitions.default};
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  ${media.desktop} {
    display: none;
  }

  &:focus {
    outline: 2px solid rgba(255, 255, 255, 0.5);
    outline-offset: 2px;
  }
`;

const CategorySection = styled.div`
  padding: 20px 0 16px 0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 20px;
  font-size: 14px;
  font-weight: 600;
  color: ${colors.text.secondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CategoryList = styled.div`
  ${flex.column}
  gap: 4px;
  padding: 0 16px;
`;

const PlacesSection = styled.div`
  padding: 20px 0;
  border-top: 1px solid ${colors.border.light};
  margin-top: 16px;
`;

const EmptyState = styled.div`
  ${flex.columnCenter}
  padding: 40px 20px;
  color: ${colors.text.tertiary};
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 72px;
  height: 72px;
  background: ${colors.gradients.card};
  border-radius: 50%;
  ${flex.center}
  font-size: 28px;
  margin-bottom: 20px;
  color: ${colors.primary.light};
  box-shadow: ${colors.shadow.sm};
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${colors.primary.subtle};
    border-radius: 50%;
    opacity: 0.3;
  }
`;

const EmptyText = styled.p`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: ${colors.text.secondary};
`;

const EmptySubtext = styled.p`
  margin: 0;
  font-size: 14px;
  color: ${colors.text.tertiary};
  line-height: 1.5;
`;


const categories = [
  { key: MAP_CATEGORIES.ALL, label: '전체', icon: '📍' },
  { key: MAP_CATEGORIES.RESTAURANT, label: '음식점', icon: '🍽️' },
  { key: MAP_CATEGORIES.CAFE, label: '카페', icon: '☕' },
  { key: MAP_CATEGORIES.SHOPPING, label: '쇼핑', icon: '🛍️' },
  { key: MAP_CATEGORIES.PARK, label: '공원', icon: '🌳' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  selectedCategory,
  onCategoryChange,
  onToggle,
  locationCounts = {}
}) => {
  const [isMobile, setIsMobile] = React.useState(false);

  // Check if it's mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle overlay click to close sidebar on mobile
  const handleOverlayClick = useCallback(() => {
    if (isMobile && isOpen) {
      onToggle();
    }
  }, [isMobile, isOpen, onToggle]);

  const getLocationCount = (categoryKey: string): number => {
    if (categoryKey === MAP_CATEGORIES.ALL) {
      return Object.values(locationCounts).reduce((sum, count) => sum + count, 0);
    }
    return locationCounts[categoryKey] || 0;
  };

  return (
    <>
      <Overlay
        $isOpen={isOpen}
        $isMobile={isMobile}
        onClick={handleOverlayClick}
      />

      <SidebarContainer $isOpen={isOpen}>
        <SidebarHeader>
          <HeaderLeft>
            <SidebarIcon>📍</SidebarIcon>
            <SidebarTitle>Places Memory</SidebarTitle>
          </HeaderLeft>
          <CloseButton onClick={onToggle}>✕</CloseButton>
        </SidebarHeader>

        <CategorySection>
          <SectionTitle>카테고리</SectionTitle>
          <CategoryList>
            {categories.map((category) => (
              <SidebarItem
                key={category.key}
                icon={category.icon}
                label={category.label}
                count={getLocationCount(category.key)}
                isActive={selectedCategory === category.key}
                onClick={() => onCategoryChange(category.key)}
              />
            ))}
          </CategoryList>
        </CategorySection>

        <PlacesSection>
          <SectionTitle>내 장소들</SectionTitle>
          <EmptyState>
            <EmptyIcon>📍</EmptyIcon>
            <EmptyText>아직 기록된 장소가 없습니다</EmptyText>
            <EmptySubtext>지도를 클릭해서 장소를 추가해보세요</EmptySubtext>
          </EmptyState>
        </PlacesSection>
      </SidebarContainer>
    </>
  );
};