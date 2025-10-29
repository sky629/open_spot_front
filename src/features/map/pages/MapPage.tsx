// Map Page Component with New Layout

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { MapContainer, type MapContainerRef } from '../components';
import { UserProfile } from '../../auth/components';
import { CategoryDropdown } from '../../../components/common/CategoryDropdown';
import { GroupSection } from '../../../components/Sidebar/GroupSection';
import { LocationSection } from '../../../components/Sidebar/LocationSection';
import { useUser } from '../../../stores/auth';
import { useGroupStore } from '../../../stores/group';
import { useCategoryStore } from '../../../stores/category';
import { useLocationStore } from '../../../stores/location';
import { logger } from '../../../utils/logger';
import { colors, media, transitions, shadows } from '../../../styles';
import type { LocationResponse } from '../../../types';

export const MapPage: React.FC = () => {
  console.log('🚀 MapPage component rendering...');

  const navigate = useNavigate();
  const user = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState<boolean>(false);
  const mapContainerRef = useRef<MapContainerRef>(null);

  // Store actions
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const setGroupSearchQuery = useGroupStore((state) => state.setSearchQuery);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const setLocationSearchQuery = useLocationStore((state) => state.setSearchQuery);

  // Search state from store
  const locationSearchQuery = useLocationStore((state) => state.searchQuery);

  useEffect(() => {
    // 만약 사용자 정보가 없다면 (로그인되지 않은 상태라면)
    if (!user) {
      logger.info('User not authenticated, redirecting to login page.');
      // /login 페이지로 리디렉션시킵니다.
      navigate('/login');
    }
  }, [user, navigate]);

  // 초기 데이터 로딩 (그룹, 카테고리)
  useEffect(() => {
    if (user) {
      logger.info('Loading initial data for authenticated user');

      // 카테고리는 항상 로드
      fetchCategories().catch((error) => {
        logger.error('Failed to load categories', error);
      });

      // 그룹 로드 후 각 그룹의 locationIds 동기화
      fetchGroups()
        .then(() => {
          const { groups, updateGroupLocationIds } = useGroupStore.getState();
          logger.info(`Syncing locationIds for ${groups.length} groups`);

          // 각 그룹의 장소 개수 동기화
          groups.forEach((group) => {
            updateGroupLocationIds(group.id).catch((error) => {
              logger.error(`Failed to sync locationIds for group ${group.id}`, error);
            });
          });
        })
        .catch((error) => {
          logger.error('Failed to load groups', error);
        });
    }
  }, [user, fetchGroups, fetchCategories]);

  const handleLocationSelect = (location: LocationResponse) => {
    logger.userAction('Location selected from map', { locationId: location.id });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;

    // 장소와 그룹 모두 검색어 업데이트
    setLocationSearchQuery(query);
    setGroupSearchQuery(query);

    if (query.trim()) {
      logger.debug('Search query updated', { query });
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

  const handleCurrentLocation = () => {
    logger.userAction('Current location button clicked');
    setIsLoadingLocation(true);

    if (!navigator.geolocation) {
      logger.error('Geolocation is not supported by this browser');
      alert('이 브라우저는 위치 정보를 지원하지 않습니다.');
      setIsLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        logger.info('Current location retrieved', { latitude, longitude });

        // MapContainer의 panToLocation 메서드 호출
        if (mapContainerRef.current) {
          mapContainerRef.current.panToLocation(latitude, longitude, 15);
        }

        setIsLoadingLocation(false);
      },
      (error) => {
        logger.error('Failed to get current location', error);
        let errorMessage = '현재 위치를 가져올 수 없습니다.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 정보 요청이 시간 초과되었습니다.';
            break;
        }

        alert(errorMessage);
        setIsLoadingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
              placeholder="장소, 그룹 검색"
              value={locationSearchQuery}
              onChange={handleSearchChange}
              onKeyPress={(e) => e.key === 'Enter' && e.preventDefault()}
            />
            <SearchButton onClick={() => logger.userAction('Search clicked', { query: locationSearchQuery })}>
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
          </SidebarContent>
        </SidebarWrapper>

        {/* 메인 콘텐츠 영역 */}
        <MainContent>
          <ContentArea>
            <MapContainer ref={mapContainerRef} onLocationSelect={handleLocationSelect} />

            {/* 현재 위치 버튼 */}
            <CurrentLocationButton
              onClick={handleCurrentLocation}
              disabled={isLoadingLocation}
              title="현재 위치로 이동"
            >
              {isLoadingLocation ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="#A394E8" strokeWidth="2"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" fill="#8B7FD6"/>
                  <circle cx="12" cy="12" r="9" stroke="#8B7FD6" strokeWidth="2"/>
                  <line x1="12" y1="1" x2="12" y2="4" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="20" x2="12" y2="23" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="1" y1="12" x2="4" y2="12" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="20" y1="12" x2="23" y2="12" stroke="#8B7FD6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </CurrentLocationButton>
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

  ${media.mobile} {
    gap: 8px;
  }
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

const CurrentLocationButton = styled.button<{ disabled?: boolean }>`
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 48px;
  height: 48px;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  font-size: 20px;
  z-index: 1001;
  opacity: ${props => props.disabled ? 0.6 : 1};

  &:hover:not(:disabled) {
    background: ${colors.primary.subtle};
    border-color: ${colors.primary.main};
    box-shadow: ${colors.shadow.purple};
    transform: scale(1.05);
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 18px;
    bottom: 16px;
    left: 16px;
  }
`;