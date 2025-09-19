import React, { useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { SidebarItem } from './SidebarItem';
import { MAP_CATEGORIES } from '../../constants';

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
  background: rgba(0, 0, 0, 0.5);
  z-index: 1500;
  opacity: ${props => (props.$isOpen && props.$isMobile) ? 1 : 0};
  visibility: ${props => (props.$isOpen && props.$isMobile) ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
`;

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  position: relative;
  width: ${props => props.$isOpen ? '320px' : '0'};
  height: 100%;
  background: white;
  border-right: 1px solid #e8e8e8;
  box-shadow: ${props => props.$isOpen ? '2px 0 10px rgba(0, 0, 0, 0.1)' : 'none'};
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  overflow: hidden;
  flex-shrink: 0;
  z-index: 1002;

  @media (max-width: 768px) {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: ${props => props.$isOpen ? '85vw' : '0'};
    max-width: 320px;
    z-index: 1600;
    box-shadow: ${props => props.$isOpen ? '2px 0 20px rgba(0, 0, 0, 0.2)' : 'none'};
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SidebarIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #333;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 20px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }

  @media (min-width: 769px) {
    display: none;
  }

  &:focus {
    outline: 2px solid #03C75A;
    outline-offset: 2px;
  }
`;

const CategorySection = styled.div`
  padding: 16px 0;
`;

const SectionTitle = styled.h3`
  margin: 0 0 12px 16px;
  font-size: 16px;
  font-weight: 600;
  color: #666;
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const PlacesSection = styled.div`
  padding: 16px 0;
  border-top: 1px solid #f0f0f0;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 60px;
  height: 60px;
  background: #f5f5f5;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 16px;
  color: #ccc;
`;

const EmptyText = styled.p`
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 500;
  color: #666;
`;

const EmptySubtext = styled.p`
  margin: 0;
  font-size: 14px;
  color: #999;
  line-height: 1.4;
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