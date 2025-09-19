// 지도 페이지 컴포넌트 (인증 후 접근 가능)

import React, { useState, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { MapContainer } from '../components/Map';
import { Sidebar } from '../components/Sidebar';
import { MAP_CONFIG, MAP_CATEGORIES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useLocations } from '../hooks';
import { logger } from '../utils/logger';
import type { LocationResponse } from '../types';

const PageContainer = styled.div`
  display: flex;
  flex-direction: row;
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
  overflow: hidden;
  position: relative;
`;

const Header = styled.header`
  background: #fff;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;

  @media (max-width: 768px) {
    padding: 12px 16px;
    flex-direction: column;
    gap: 12px;
  }
`;

const SidebarToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: transparent;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  color: #666;
  font-size: 18px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #f8f9fa;
    border-color: #03C75A;
    color: #03C75A;
  }

  &:focus {
    outline: 2px solid #03C75A;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 16px;
  }
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #03C75A 0%, #029E4A 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 16px;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 20px;
  color: #2d2d2d;
  font-weight: 700;
  letter-spacing: -0.5px;

  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 600px;
  position: relative;

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 50px 0 16px;
  border: 2px solid #e8e8e8;
  border-radius: 24px;
  font-size: 16px;
  background: #fafafa;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: #03C75A;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(3, 199, 90, 0.1);
  }

  &::placeholder {
    color: #999;
  }

  @media (max-width: 768px) {
    height: 44px;
    font-size: 15px;
  }
`;

const SearchButton = styled.button`
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: #03C75A;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background: #029E4A;
  }

  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
  }
`;

const FilterContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;

  @media (max-width: 768px) {
    margin-left: 0;
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: 12px;
  }
`;

const UserProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
`;

const UserAvatar = styled.div`
  width: 28px;
  height: 28px;
  background: #03C75A;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 12px;
`;

const LogoutButton = styled.button`
  padding: 8px 16px;
  background: transparent;
  border: 1px solid #e8e8e8;
  border-radius: 16px;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #ff4444;
    color: #ff4444;
    background: #fff5f5;
  }
`;

const CategoryChip = styled.button<{ $isActive: boolean }>`
  padding: 8px 16px;
  border: 1px solid ${props => props.$isActive ? '#03C75A' : '#e8e8e8'};
  border-radius: 20px;
  background: ${props => props.$isActive ? '#03C75A' : '#fff'};
  color: ${props => props.$isActive ? '#fff' : '#666'};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: #03C75A;
    background: ${props => props.$isActive ? '#029E4A' : '#f8fff8'};
    color: ${props => props.$isActive ? '#fff' : '#03C75A'};
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 13px;
  }
`;

const InfoPanel = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  max-width: 320px;
  z-index: 1001;
  border: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    top: 16px;
    right: 16px;
    left: 16px;
    max-width: none;
    padding: 16px;
  }

  @media (max-width: 480px) {
    position: fixed;
    bottom: 20px;
    top: auto;
    left: 16px;
    right: 16px;
    border-radius: 20px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    padding: 20px;
  }
`;

const MapSection = styled.main`
  flex: 1;
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
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

  const categories = [
    { key: MAP_CATEGORIES.ALL, label: '전체' },
    { key: MAP_CATEGORIES.RESTAURANT, label: '음식점' },
    { key: MAP_CATEGORIES.CAFE, label: '카페' },
    { key: MAP_CATEGORIES.SHOPPING, label: '쇼핑' },
    { key: MAP_CATEGORIES.PARK, label: '공원' },
  ];

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

  return (
    <PageContainer>
      <Sidebar
        isOpen={isSidebarOpen}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        onToggle={handleSidebarToggle}
        locationCounts={locationCounts}
      />

      <MainContent>
        <Header>
          <SidebarToggleButton onClick={handleSidebarToggle}>
            {isSidebarOpen ? '✕' : '☰'}
          </SidebarToggleButton>
        <Logo>
          <LogoIcon>OS</LogoIcon>
          <Title>Open Spot</Title>
        </Logo>

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

        <FilterContainer>
          {categories.map((category) => (
            <CategoryChip
              key={category.key}
              $isActive={selectedCategory === category.key}
              onClick={() => handleCategoryChange(category.key)}
            >
              {category.label}
            </CategoryChip>
          ))}
        </FilterContainer>

        <UserSection>
          <UserProfile>
            <UserAvatar>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </UserAvatar>
            {user?.name || 'User'}
          </UserProfile>
          <LogoutButton onClick={handleLogout}>
            로그아웃
          </LogoutButton>
        </UserSection>
      </Header>

      <MapSection>
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
        </MapSection>
      </MainContent>
    </PageContainer>
  );
};