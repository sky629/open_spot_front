// Map Page Component

import React, { useState } from 'react';
import styled from 'styled-components';
import { MapContainer, CategoryFilter } from '../components';
import { UserProfile } from '../../auth/components';
import { useSelectedLocation } from '../../../stores/location';
import { logger } from '../../../utils/logger';

export const MapPage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const selectedLocation = useSelectedLocation();

  const handleLocationSelect = (location: any) => {
    logger.userAction('Location selected from map', { locationId: location.id });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
    logger.userAction('Sidebar toggled', { isOpen: !isSidebarOpen });
  };

  return (
    <Container>
      {/* 메인 지도 영역 */}
      <MapArea>
        <MapContainer onLocationSelect={handleLocationSelect} />

        {/* 지도 위 컨트롤들 */}
        <MapControls>
          <SidebarToggle onClick={toggleSidebar}>
            {isSidebarOpen ? '◀' : '▶'}
          </SidebarToggle>
        </MapControls>
      </MapArea>

      {/* 사이드바 */}
      <Sidebar $isOpen={isSidebarOpen}>
        <SidebarHeader>
          <AppTitle>🗺️ Open Spot</AppTitle>
        </SidebarHeader>

        <SidebarContent>
          {/* 사용자 프로필 */}
          <Section>
            <UserProfile />
          </Section>

          {/* 카테고리 필터 */}
          <Section>
            <CategoryFilter />
          </Section>

          {/* 선택된 위치 정보 */}
          {selectedLocation && (
            <Section>
              <LocationDetails>
                <LocationTitle>{selectedLocation.name}</LocationTitle>
                {selectedLocation.description && (
                  <LocationDescription>
                    {selectedLocation.description}
                  </LocationDescription>
                )}
                <LocationMeta>
                  <MetaItem>
                    📍 {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                  </MetaItem>
                  {selectedLocation.category && (
                    <MetaItem>
                      🏷️ {selectedLocation.category}
                    </MetaItem>
                  )}
                </LocationMeta>
              </LocationDetails>
            </Section>
          )}
        </SidebarContent>
      </Sidebar>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: #f7fafc;
`;

const MapArea = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

const MapControls = styled.div`
  position: absolute;
  top: 1rem;
  left: 1rem;
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const SidebarToggle = styled.button`
  width: 3rem;
  height: 3rem;
  background-color: white;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 600;
  color: #4a5568;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background-color: #f7fafc;
    border-color: #cbd5e0;
  }
`;

const Sidebar = styled.aside<{ $isOpen: boolean }>`
  width: ${props => props.$isOpen ? '320px' : '0'};
  height: 100%;
  background-color: white;
  border-left: 1px solid #e2e8f0;
  overflow: hidden;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const AppTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Section = styled.div`
  /* 각 섹션 스타일링은 컴포넌트 내부에서 처리 */
`;

const LocationDetails = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #3182ce;
`;

const LocationTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 0.5rem 0;
`;

const LocationDescription = styled.p`
  font-size: 0.875rem;
  color: #718096;
  line-height: 1.5;
  margin: 0 0 1rem 0;
`;

const LocationMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const MetaItem = styled.div`
  font-size: 0.75rem;
  color: #a0aec0;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

// 반응형 디자인은 기본 스타일에 포함됨