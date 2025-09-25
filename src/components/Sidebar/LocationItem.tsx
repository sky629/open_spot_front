// Location Item Component

import React, { useState } from 'react';
import styled from 'styled-components';
import type { LocationResponse } from '../../types';
import { MARKER_ICONS } from '../../constants/map';
import { colors, transitions } from '../../styles';

interface LocationItemProps {
  location: LocationResponse & {
    address?: string;
    rating?: number;
    distance?: number;
    phone?: string;
    website?: string;
  };
}

export const LocationItem: React.FC<LocationItemProps> = ({ location }) => {
  const [showDetails, setShowDetails] = useState(false);

  const handleClick = () => {
    setShowDetails(!showDetails);
    // TODO: Focus location on map
    console.log('Focus location on map:', location.id);
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;

    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  };

  const formatRating = (rating?: number) => {
    if (!rating) return null;
    return rating.toFixed(1);
  };

  return (
    <Container onClick={handleClick} $isExpanded={showDetails}>
      <MainContent>
        <LocationIcon>
          {MARKER_ICONS[location.category as keyof typeof MARKER_ICONS] || '📍'}
        </LocationIcon>

        <LocationInfo>
          <LocationName>{location.name}</LocationName>
          <LocationAddress>{location.address || '주소 정보 없음'}</LocationAddress>

          <LocationMeta>
            {location.rating && (
              <MetaItem>
                <StarIcon>⭐</StarIcon>
                <MetaText>{formatRating(location.rating)}</MetaText>
              </MetaItem>
            )}

            {location.distance && (
              <MetaItem>
                <MetaText>{formatDistance(location.distance)}</MetaText>
              </MetaItem>
            )}
          </LocationMeta>
        </LocationInfo>

        <ExpandIcon $isExpanded={showDetails}>
          ▼
        </ExpandIcon>
      </MainContent>

      {showDetails && (
        <DetailsContent>
          <DetailRow>
            <DetailLabel>카테고리:</DetailLabel>
            <DetailValue>{location.category}</DetailValue>
          </DetailRow>

          <DetailRow>
            <DetailLabel>좌표:</DetailLabel>
            <DetailValue>
              {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </DetailValue>
          </DetailRow>

          {location.phone && (
            <DetailRow>
              <DetailLabel>전화번호:</DetailLabel>
              <DetailValue>
                <PhoneLink href={`tel:${location.phone}`}>
                  {location.phone}
                </PhoneLink>
              </DetailValue>
            </DetailRow>
          )}

          {location.website && (
            <DetailRow>
              <DetailLabel>웹사이트:</DetailLabel>
              <DetailValue>
                <WebLink href={location.website} target="_blank" rel="noopener noreferrer">
                  방문하기
                </WebLink>
              </DetailValue>
            </DetailRow>
          )}

          {location.description && (
            <DetailRow>
              <DetailLabel>설명:</DetailLabel>
              <DetailValue>{location.description}</DetailValue>
            </DetailRow>
          )}

          <ActionButtons>
            <ActionButton $primary>
              지도에서 보기
            </ActionButton>
            <ActionButton>
              그룹에 추가
            </ActionButton>
          </ActionButtons>
        </DetailsContent>
      )}
    </Container>
  );
};

const Container = styled.div<{ $isExpanded: boolean }>`
  background-color: white;
  border: 1px solid ${colors.border.secondary};
  border-radius: 8px;
  margin: 0 1rem 0.5rem;
  cursor: pointer;
  transition: ${transitions.fast};
  overflow: hidden;

  &:hover {
    border-color: ${colors.primary.light};
    box-shadow: ${colors.shadow.sm};
  }

  ${props => props.$isExpanded && `
    border-color: ${colors.status.info};
    box-shadow: ${colors.shadow.md};
  `}
`;

const MainContent = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  gap: 0.75rem;
`;

const LocationIcon = styled.div`
  font-size: 1.25rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const LocationInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const LocationName = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin-bottom: 0.25rem;
  line-height: 1.4;
`;

const LocationAddress = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
  margin-bottom: 0.5rem;
  line-height: 1.3;
`;

const LocationMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const StarIcon = styled.span`
  font-size: 0.75rem;
`;

const MetaText = styled.span`
  font-size: 0.75rem;
  color: ${colors.text.secondary};
`;

const ExpandIcon = styled.div<{ $isExpanded: boolean }>`
  font-size: 0.75rem;
  color: ${colors.text.tertiary};
  transition: ${transitions.fast};
  transform: ${props => props.$isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  flex-shrink: 0;
  margin-top: 0.125rem;
`;

const DetailsContent = styled.div`
  border-top: 1px solid ${colors.border.secondary};
  padding: 0.75rem;
  background-color: ${colors.surface.hover};
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 0.5rem;
  gap: 0.5rem;

  &:last-of-type {
    margin-bottom: 0.75rem;
  }
`;

const DetailLabel = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
  font-weight: 500;
  min-width: 4rem;
  flex-shrink: 0;
`;

const DetailValue = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.primary};
  flex: 1;
  line-height: 1.4;
`;

const PhoneLink = styled.a`
  color: ${colors.primary.dark};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const WebLink = styled.a`
  color: ${colors.primary.dark};
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
`;

const ActionButton = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${props => props.$primary ? colors.primary.main : colors.border.primary};
  border-radius: 4px;
  background-color: ${props => props.$primary ? colors.primary.main : 'white'};
  color: ${props => props.$primary ? 'white' : colors.text.primary};
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${props => props.$primary ? colors.primary.dark : colors.surface.hover};
    border-color: ${props => props.$primary ? colors.primary.dark : colors.text.tertiary};
  }
`;