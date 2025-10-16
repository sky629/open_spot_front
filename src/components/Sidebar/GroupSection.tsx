// Group Section Component

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { useFilteredGroups, useGroupUIState, useGroupStore } from '../../stores/group';
import { useLocationStore } from '../../stores/location';
import { colors, transitions } from '../../styles';
import { CreateGroupForm } from './CreateGroupForm';
import { EditGroupModal } from './EditGroupModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';

export const GroupSection: React.FC = () => {
  const groups = useFilteredGroups();
  const ui = useGroupUIState();
  const { setUIState, selectedGroupId, selectGroup } = useGroupStore();
  const { setCurrentGroupId, refreshLocations } = useLocationStore();
  const searchQuery = useGroupStore((state) => state.searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setUIState({ showMenuForGroupId: null });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setUIState]);

  const handleAddGroup = () => {
    setUIState({ isCreating: true });
  };

  const handleGroupClick = (groupId: string) => {
    if (selectedGroupId === groupId) {
      // 토글: 선택 해제 → 전체 조회
      selectGroup(null);
      setCurrentGroupId(null);
    } else {
      // 새 그룹 선택 → 그룹 필터링
      selectGroup(groupId);
      setCurrentGroupId(groupId);
    }
    // 지도 재조회
    refreshLocations();
  };

  return (
    <Container ref={containerRef}>
      <Header>
        <Title>장소 보관함</Title>
        <AddButton onClick={handleAddGroup}>
          <PlusIcon>+</PlusIcon>
        </AddButton>
      </Header>

      <GroupList>
        {groups.map((group) => (
          <GroupItem
            key={group.id}
            $selected={selectedGroupId === group.id}
            onClick={() => handleGroupClick(group.id)}
          >
            <GroupInfo>
              <GroupColorDot $color={group.color} />
              <GroupName>{group.name}</GroupName>
              <LocationCount>({group.locationIds?.length ?? 0})</LocationCount>
            </GroupInfo>

            <GroupMenu
              onClick={(e) => {
                e.stopPropagation(); // 부모 클릭 이벤트 방지
                setUIState({ showMenuForGroupId: group.id });
              }}
            >
              <MenuIcon>⋮</MenuIcon>
            </GroupMenu>

            {ui.showMenuForGroupId === group.id && (
              <DropdownMenu>
                <MenuItem
                  onClick={() => {
                    setUIState({ editingGroupId: group.id, showMenuForGroupId: null });
                  }}
                >
                  수정
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setUIState({ showDeleteConfirm: group.id, showMenuForGroupId: null });
                  }}
                  $danger
                >
                  삭제
                </MenuItem>
              </DropdownMenu>
            )}
          </GroupItem>
        ))}

        {groups.length === 0 && (
          <EmptyState>
            {searchQuery ? (
              <>
                <EmptyText>검색 결과가 없습니다</EmptyText>
                <EmptySubText>'{searchQuery}'에 해당하는 그룹이 없습니다</EmptySubText>
              </>
            ) : (
              <>
                <EmptyText>생성된 그룹이 없습니다</EmptyText>
                <EmptySubText>+ 버튼을 눌러 새 그룹을 만들어보세요</EmptySubText>
              </>
            )}
          </EmptyState>
        )}
      </GroupList>

      {ui.isCreating && <CreateGroupForm />}
      {ui.editingGroupId && <EditGroupModal />}
      {ui.showDeleteConfirm && <DeleteConfirmDialog />}
    </Container>
  );
};

const Container = styled.div`
  padding: 1rem 0;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0 1rem;
`;

const Title = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: ${colors.text.primary};
  margin: 0;
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background-color: ${colors.primary.main};
  cursor: pointer;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.primary.dark};
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const PlusIcon = styled.span`
  color: white;
  font-size: 1.25rem;
  font-weight: 500;
  line-height: 1;
`;

const GroupList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const GroupItem = styled.div<{ $selected?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  transition: ${transitions.fast};
  background-color: ${props => props.$selected ? colors.primary.subtle : 'transparent'};
  border: 2px solid ${props => props.$selected ? colors.primary.main : 'transparent'};

  &:hover {
    background-color: ${props => props.$selected ? colors.primary.subtle : colors.surface.hover};
  }
`;

const GroupInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
`;

const GroupColorDot = styled.div<{ $color?: string }>`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: ${props => props.$color || colors.text.tertiary};
  flex-shrink: 0;
`;

const GroupName = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${colors.text.primary};
`;

const LocationCount = styled.span`
  font-size: 0.8125rem;
  color: ${colors.text.secondary};
`;

const GroupMenu = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 4px;
  transition: ${transitions.fast};

  &:hover {
    background-color: ${colors.surface.hover};
  }
`;

const MenuIcon = styled.span`
  color: ${colors.text.secondary};
  font-size: 1rem;
  line-height: 1;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 1rem;
  z-index: 50;
  min-width: 6rem;
  background-color: white;
  border: 1px solid ${colors.border.secondary};
  border-radius: 6px;
  box-shadow: ${colors.shadow.md};
  overflow: hidden;
`;

const MenuItem = styled.button<{ $danger?: boolean }>`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: none;
  font-size: 0.875rem;
  color: ${props => props.$danger ? colors.status.error : colors.text.primary};
  cursor: pointer;
  transition: ${transitions.fast};
  text-align: left;

  &:hover {
    background-color: ${props => props.$danger ? colors.primary.subtle : colors.surface.hover};
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
`;

const EmptyText = styled.div`
  font-size: 0.875rem;
  color: ${colors.text.secondary};
  margin-bottom: 0.25rem;
`;

const EmptySubText = styled.div`
  font-size: 0.8125rem;
  color: ${colors.text.tertiary};
`;