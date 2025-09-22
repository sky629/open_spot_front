// 지도 페이지 컴포넌트 (인증 후 접근 가능)

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { MapContainer } from '../components/Map';
import { Sidebar } from '../components/Sidebar';
import { UserProfile } from '../features/auth/components/UserProfile';
import { MAP_CONFIG, MAP_CATEGORIES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useLocations } from '../hooks';
import { logger } from '../utils/logger';
import { colors, media, transitions, shadows } from '../styles';
import type { LocationResponse } from '../types';

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

const InfoPanel = styled.div`
  position: absolute;
  top: 24px;
  right: 24px;
  background: ${colors.surface.primary};
  padding: 24px;
  border-radius: 20px;
  box-shadow: ${colors.shadow.xl};
  max-width: 340px;
  z-index: 1001;
  border: 1px solid ${colors.border.light};

  ${media.tablet} {
    top: 20px;
    right: 20px;
    left: 20px;
    max-width: none;
    padding: 20px;
  }

  ${media.mobile} {
    position: fixed;
    bottom: 24px;
    top: auto;
    left: 20px;
    right: 20px;
    border-radius: 24px;
    box-shadow: ${colors.shadow.xl};
    padding: 24px;
  }
`;

const LocationInfo = styled.div`
  margin-bottom: 16px;
`;

const LocationTitle = styled.h3`
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #2d2d2d;
  font-weight: 600;
  letter-spacing: -0.3px;
`;

const LocationDescription = styled.p`
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  line-height: 1.5;
`;

const LocationCategory = styled.span`
  background: #f0f7ff;
  color: #0066cc;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #e1efff;
`;

const CloseButton = styled.button`
  background: #f8f9fa;
  border: 1px solid #e8e8e8;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: #e9ecef;
    border-color: #ddd;
    color: #333;
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

export const MapPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>(MAP_CATEGORIES.ALL);
  const [selectedLocation, setSelectedLocation] = useState<LocationResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // 사용자 정보 로드 확인
  React.useEffect(() => {
    console.log('🗺️ MapPage loaded with user:', user ? { id: user.id, name: user.name } : null);
  }, [user]);

  // 위치 데이터와 카테고리별 개수 가져오기
  const { locations, locationCounts } = useLocations();

  const handleLocationClick = (location: LocationResponse) => {
    logger.userAction('Location marker clicked', {
      locationId: location.id,
      name: location.name
    });
    setSelectedLocation(location);
  };

  const handleCategoryChange = (category: string) => {
    logger.userAction('Category filter changed', {
      from: selectedCategory,
      to: category
    });
    setSelectedCategory(category);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      logger.userAction('Search performed', { query: searchQuery });
      // 검색 로직 구현
    }
  };

  const handleMapLoad = () => {
    logger.mapEvent('Map loaded successfully');
  };

  const handleBoundsChanged = useCallback((bounds: {
    northEast: { lat: number; lng: number };
    southWest: { lat: number; lng: number };
  }) => {
    logger.mapEvent('Map bounds changed', bounds);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      logger.userAction('User logged out from map page');
    } catch (error) {
      logger.error('Logout failed', error);
      // 로그아웃 실패해도 로그인 페이지로 이동
      navigate('/login');
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
          <UserProfile onLogout={handleLogout} />
        </NavRight>
      </TopNavBar>

      {/* 모바일 오버레이 */}
      <MobileOverlay $isOpen={isSidebarOpen} onClick={handleSidebarToggle} />

      {/* 메인 레이아웃 */}
      <MainLayout>
        {/* 왼쪽 사이드바 */}
        <SidebarWrapper className={isSidebarOpen ? 'open' : ''}>
          <Sidebar
            isOpen={true}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            onToggle={handleSidebarToggle}
            locationCounts={locationCounts}
          />
        </SidebarWrapper>

        {/* 메인 콘텐츠 영역 */}
        <MainContent>
          <ContentArea>
            <MapContainer
              center={MAP_CONFIG.DEFAULT_CENTER}
              zoom={MAP_CONFIG.DEFAULT_ZOOM}
              locations={locations}
              onMapLoad={handleMapLoad}
              onBoundsChanged={handleBoundsChanged}
              onLocationClick={handleLocationClick}
            />

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

            {selectedLocation && (
              <InfoPanel>
                <LocationInfo>
                  <LocationTitle>{selectedLocation.name}</LocationTitle>
                  {selectedLocation.description && (
                    <LocationDescription>
                      {selectedLocation.description}
                    </LocationDescription>
                  )}
                  {selectedLocation.category && (
                    <LocationCategory>
                      {selectedLocation.category}
                    </LocationCategory>
                  )}
                </LocationInfo>
                <CloseButton onClick={() => setSelectedLocation(null)}>
                  닫기
                </CloseButton>
              </InfoPanel>
            )}
          </ContentArea>
        </MainContent>
      </MainLayout>
    </PageContainer>
  );
};