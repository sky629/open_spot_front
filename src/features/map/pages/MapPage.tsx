// Map Page Component with New Layout

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { MapContainer } from '../components';
import { UserProfile } from '../../auth/components';
import { CategoryDropdown } from '../../../components/common/CategoryDropdown';
import { GroupSection } from '../../../components/Sidebar/GroupSection';
import { LocationSection } from '../../../components/Sidebar/LocationSection';
import { useUser } from '../../../stores/auth';
import { useSelectedLocation } from '../../../stores/location';
import { logger } from '../../../utils/logger';
import { colors, media, transitions, shadows } from '../../../styles';

export const MapPage: React.FC = () => {
  console.log('🚀 MapPage component rendering...');

  const navigate = useNavigate();
  const user = useUser(); 
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const selectedLocation = useSelectedLocation();

  useEffect(() => {
    // 만약 사용자 정보가 없다면 (로그인되지 않은 상태라면)
    if (!user) {
      logger.info('User not authenticated, redirecting to login page.');
      // /login 페이지로 리디렉션시킵니다.
      navigate('/login');
    }
  }, [user, navigate]); 

  console.log('🚀 MapPage - selectedLocation:', selectedLocation);

  const handleLocationSelect = (location: any) => {
    logger.userAction('Location selected from map', { locationId: location.id });
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      logger.userAction('Search performed', { query: searchQuery });
      // 검색 로직 구현
    }
  };

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
    logger.userAction('Sidebar toggled', { isOpen: !isSidebarOpen });
  };

  const handleHomeClick = () => {
    navigate('/');
    logger.userAction('Home button clicked');
  };

  return (
    <PageContainer>
      {/* 상단 네비게이션 바 */}
      <TopNavBar>
        <NavLeft>
          <SidebarToggleButton onClick={handleSidebarToggle}>
            ☰
          </SidebarToggleButton>

          <HomeLogoButton onClick={handleHomeClick}>
            <LogoIcon>OS</LogoIcon>
            <LogoText>Open Spot</LogoText>
          </HomeLogoButton>

          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="장소, 주소 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <SearchButton onClick={handleSearch}>
              🔍
            </SearchButton>
          </SearchContainer>
        </NavLeft>

        <NavRight>
          <CategoryDropdown />
          <UserProfile />
        </NavRight>
      </TopNavBar>

      {/* 모바일 오버레이 */}
      <MobileOverlay $isOpen={isSidebarOpen} onClick={handleSidebarToggle} />

      {/* 메인 레이아웃 */}
      <MainLayout>
        {/* 왼쪽 사이드바 */}
        <SidebarWrapper className={isSidebarOpen ? 'open' : ''}>
          <SidebarHeader>
            <AppTitle>🗺️ Open Spot</AppTitle>
          </SidebarHeader>

          <SidebarContent>
            {/* 그룹 관리 섹션 */}
            <GroupSection />

            <Divider />

            {/* 장소 리스트 섹션 */}
            <LocationSection />

            {/* 선택된 위치 정보 */}
            {selectedLocation && (
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
            )}
          </SidebarContent>
        </SidebarWrapper>

        {/* 메인 콘텐츠 영역 */}
        <MainContent>
          <ContentArea>
            <MapContainer onLocationSelect={handleLocationSelect} />

            <MapControls>
              <ControlButton title="현재 위치">
                📍
              </ControlButton>
              <ControlButton title="길찾기">
                🧭
              </ControlButton>
              <ControlButton title="즐겨찾기">
                ⭐
              </ControlButton>
            </MapControls>
          </ContentArea>
        </MainContent>
      </MainLayout>
    </PageContainer>
  );
};

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: ${colors.background.primary};
`;

const TopNavBar = styled.nav`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  background: ${colors.gradients.header};
  border-bottom: 1px solid ${colors.border.light};
  box-shadow: ${shadows.card};
  z-index: 1001;
  padding: 0 24px;
  position: relative;

  ${media.mobile} {
    height: 56px;
    padding: 0 16px;
  }
`;

const NavLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const NavRight = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const MainLayout = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const SidebarWrapper = styled.div`
  width: 320px;
  flex-shrink: 0;
  background: ${colors.surface.primary};
  border-right: 1px solid ${colors.border.light};
  box-shadow: ${shadows.card};
  overflow-y: auto;

  ${media.mobile} {
    position: fixed;
    top: 56px;
    left: 0;
    bottom: 0;
    width: 280px;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s ease;

    &.open {
      transform: translateX(0);
    }
  }
`;

const MobileOverlay = styled.div<{ $isOpen: boolean }>`
  display: none;

  ${media.mobile} {
    display: block;
    position: fixed;
    top: 56px;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    opacity: ${props => props.$isOpen ? 1 : 0};
    visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
    transition: all 0.3s ease;
    backdrop-filter: blur(2px);
  }
`;

const SidebarToggleButton = styled.button`
  display: none;

  ${media.mobile} {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    transition: ${transitions.default};
    backdrop-filter: blur(10px);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`;

const ContentArea = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`;

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 500px;
  position: relative;

  ${media.mobile} {
    max-width: none;
  }
`;

const HomeLogoButton = styled.button`
  display: flex;
  align-items: center;
  gap: 12px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 12px;
  transition: ${transitions.default};
  color: white;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
  background: ${colors.surface.primary};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${colors.primary.main};
  font-weight: bold;
  font-size: 18px;
  box-shadow: ${colors.shadow.sm};
`;

const LogoText = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  ${media.mobile} {
    font-size: 18px;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 48px 0 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  backdrop-filter: blur(10px);
  transition: ${transitions.default};

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  ${media.mobile} {
    height: 36px;
    font-size: 13px;
    padding: 0 40px 0 14px;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: ${transitions.default};
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-50%) scale(1.05);
  }

  &:active {
    transform: translateY(-50%) scale(0.95);
  }

  ${media.mobile} {
    width: 24px;
    height: 24px;
    right: 6px;
  }
`;

const MapControls = styled.div`
  position: absolute;
  bottom: 20px;
  left: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 1001;

  @media (max-width: 768px) {
    bottom: 16px;
    left: 16px;
  }
`;

const ControlButton = styled.button`
  width: 48px;
  height: 48px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  font-size: 18px;
  color: #666;

  &:hover {
    background: #f8f9fa;
    border-color: #03C75A;
    color: #03C75A;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 16px;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
`;

const AppTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: white;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
`;

const Divider = styled.div`
  height: 1px;
  background-color: ${colors.border.secondary};
  margin: 0.5rem 1rem;
`;

const LocationDetails = styled.div`
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: ${colors.shadow.sm};
  border: 1px solid ${colors.border.purple};
  margin: 1rem;
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