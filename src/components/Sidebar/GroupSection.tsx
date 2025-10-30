// Group Section Component

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useFilteredGroups, useGroupUIState, useGroupStore } from '../../stores/group';
import { useLocationStore } from '../../stores/location';
import { colors, transitions } from '../../styles';
import { CreateGroupForm } from './CreateGroupForm';
import { EditGroupModal } from './EditGroupModal';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Group } from '../../types/group';
import { logger } from '../../utils/logger';

// Sortable Group Item Component
interface SortableGroupItemProps {
  group: Group;
  isSelected: boolean;
  onGroupClick: (groupId: string) => void;
  showMenu: boolean;
  onMenuToggle: (groupId: string) => void;
  onEdit: (groupId: string) => void;
  onDelete: (groupId: string) => void;
}

const SortableGroupItem: React.FC<SortableGroupItemProps> = ({
  group,
  isSelected,
  onGroupClick,
  showMenu,
  onMenuToggle,
  onEdit,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <GroupItem
      ref={setNodeRef}
      style={style}
      $selected={isSelected}
      $isDragging={isDragging}
      onClick={() => onGroupClick(group.id)}
      {...attributes}
      {...listeners}
    >
      <GroupInfo>
        <GroupColorDot $color={group.color} />
        <GroupName>{group.name}</GroupName>
        <LocationCount>({group.locationIds?.length ?? 0})</LocationCount>
      </GroupInfo>

      <GroupMenu
        onClick={(e) => {
          e.stopPropagation();
          onMenuToggle(group.id);
        }}
      >
        <MenuIcon>⋮</MenuIcon>
      </GroupMenu>

      {showMenu && (
        <DropdownMenu>
          <MenuItem onClick={() => onEdit(group.id)}>
            수정
          </MenuItem>
          <MenuItem onClick={() => onDelete(group.id)} $danger>
            삭제
          </MenuItem>
        </DropdownMenu>
      )}
    </GroupItem>
  );
};

export const GroupSection: React.FC = () => {
  const groups = useFilteredGroups();
  const ui = useGroupUIState();
  const { setUIState, selectedGroupId, selectGroup, reorderGroups } = useGroupStore();
  const { setCurrentGroupId, refreshLocations } = useLocationStore();
  const searchQuery = useGroupStore((state) => state.searchQuery);
  const containerRef = useRef<HTMLDivElement>(null);
  const [orderedGroups, setOrderedGroups] = useState<Group[]>(groups);

  // 그룹이 변경되면 정렬된 그룹 목록 업데이트
  useEffect(() => {
    setOrderedGroups(groups);
  }, [groups]);

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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddGroup = () => {
    setUIState({ isCreating: true });
  };

  const handleGroupClick = (groupId: string) => {
    if (selectedGroupId === groupId) {
      selectGroup(null);
      setCurrentGroupId(null);
    } else {
      selectGroup(groupId);
      setCurrentGroupId(groupId);
    }
    refreshLocations();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = orderedGroups.findIndex((g) => g.id === active.id);
      const newIndex = orderedGroups.findIndex((g) => g.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        // UI 업데이트 (낙관적 업데이트)
        const newOrder = arrayMove(orderedGroups, oldIndex, newIndex);
        setOrderedGroups(newOrder);

        // 백엔드에 순서 변경 요청
        const groupOrders = newOrder.map((group, index) => ({
          groupId: group.id,
          order: index,
        }));

        try {
          logger.info('Reordering groups', { groupOrders });
          await reorderGroups(groupOrders);
        } catch (error) {
          logger.error('Failed to reorder groups', error);
          // 에러 시 원래 순서로 복원
          setOrderedGroups(groups);
        }
      }
    }
  };

  return (
    <Container ref={containerRef}>
      <Header>
        <Title>장소 보관함</Title>
        <AddButton onClick={handleAddGroup}>
          <PlusIcon>+</PlusIcon>
        </AddButton>
      </Header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedGroups.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          <GroupList>
            {orderedGroups.map((group) => (
              <SortableGroupItem
                key={group.id}
                group={group}
                isSelected={selectedGroupId === group.id}
                onGroupClick={handleGroupClick}
                showMenu={ui.showMenuForGroupId === group.id}
                onMenuToggle={(groupId) =>
                  setUIState({ showMenuForGroupId: groupId })
                }
                onEdit={(groupId) =>
                  setUIState({
                    editingGroupId: groupId,
                    showMenuForGroupId: null,
                  })
                }
                onDelete={(groupId) =>
                  setUIState({
                    showDeleteConfirm: groupId,
                    showMenuForGroupId: null,
                  })
                }
              />
            ))}

            {orderedGroups.length === 0 && (
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
        </SortableContext>
      </DndContext>

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

const GroupItem = styled.div<{ $selected?: boolean; $isDragging?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  cursor: grab;
  transition: ${transitions.fast};
  background-color: ${props => props.$selected ? colors.primary.subtle : 'transparent'};
  border: 2px solid ${props => props.$selected ? colors.primary.main : 'transparent'};
  user-select: none;

  ${props => props.$isDragging && `
    opacity: 0.5;
    box-shadow: ${colors.shadow.lg};
    background-color: ${colors.surface.hover};
    border-color: ${colors.primary.main};
    cursor: grabbing;
  `}

  &:hover {
    background-color: ${props => props.$selected ? colors.primary.subtle : colors.surface.hover};
  }

  &:active {
    cursor: grabbing;
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