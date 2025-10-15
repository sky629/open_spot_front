// Group Store using Zustand with Backend API Integration

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { Group, GroupCreateRequest, GroupUpdateRequest, GroupUIState } from '../../types/group';
import { logger } from '../../utils/logger';
import type { IGroupService } from '../../core/interfaces/IGroupService';
import type { ILocationService } from '../../core/interfaces/ILocationService';
import { useLocationStore } from '../location';
import { container } from '../../core/container';
import { SERVICE_TOKENS } from '../../core/container/ServiceTokens';

// 의존성 주입을 위한 서비스 참조
let groupService: IGroupService | null = null;

export const setGroupServiceForStore = (service: IGroupService) => {
  groupService = service;
  logger.info('✅ Group service injected into store');
};

interface GroupStore {
  // Data state
  groups: Group[];
  selectedGroupId: string | null;
  isLoading: boolean;
  error: string | null;

  // UI state
  ui: GroupUIState;

  // Group CRUD actions
  fetchGroups: () => Promise<void>;
  createGroup: (request: GroupCreateRequest) => Promise<void>;
  updateGroup: (id: string, request: GroupUpdateRequest) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  selectGroup: (id: string | null) => void;

  // Location management (backend sync)
  updateGroupLocationIds: (groupId: string) => Promise<void>;

  // UI actions
  setUIState: (state: Partial<GroupUIState>) => void;
  resetUIState: () => void;

  // Utility
  getGroupById: (id: string) => Group | undefined;
  getGroupsWithLocation: (locationId: string) => Group[];
  reset: () => void;
}

const initialUIState: GroupUIState = {
  isCreating: false,
  editingGroupId: null,
  showMenuForGroupId: null,
  showDeleteConfirm: null,
};

const initialState = {
  groups: [],
  selectedGroupId: null,
  isLoading: false,
  error: null,
  ui: initialUIState,
};

export const useGroupStore = create<GroupStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Fetch all groups from backend
        fetchGroups: async () => {
          if (!groupService) {
            logger.error('Group service not initialized');
            return;
          }

          try {
            set({ isLoading: true, error: null });
            logger.info('Fetching groups from backend');

            const groups = await groupService.getGroups();

            set({ groups, isLoading: false });
            logger.info(`Successfully fetched ${groups.length} groups`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch groups';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to fetch groups', error);
          }
        },

        // Group CRUD actions
        createGroup: async (request: GroupCreateRequest) => {
          if (!groupService) {
            logger.error('Group service not initialized');
            return;
          }

          try {
            set({ isLoading: true, error: null });
            logger.info('Creating group', request);

            const newGroup = await groupService.createGroup(request);

            set((state) => ({
              groups: [...state.groups, newGroup],
              isLoading: false,
              ui: { ...state.ui, isCreating: false }
            }));

            logger.userAction('Group created', { groupId: newGroup.id, name: newGroup.name });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to create group';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to create group', error);
            throw error;
          }
        },

        updateGroup: async (id: string, request: GroupUpdateRequest) => {
          if (!groupService) {
            logger.error('Group service not initialized');
            return;
          }

          try {
            set({ isLoading: true, error: null });
            logger.info('Updating group', { groupId: id, request });

            const updatedGroup = await groupService.updateGroup(id, request);

            set((state) => ({
              groups: state.groups.map((group) =>
                group.id === id ? updatedGroup : group
              ),
              isLoading: false,
              ui: { ...state.ui, editingGroupId: null }
            }));

            logger.userAction('Group updated', { groupId: id, request });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update group';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to update group', error);
            throw error;
          }
        },

        deleteGroup: async (id: string) => {
          if (!groupService) {
            logger.error('Group service not initialized');
            return;
          }

          const group = get().getGroupById(id);
          if (!group) {
            logger.warn('Group not found for deletion', { groupId: id });
            return;
          }

          try {
            set({ isLoading: true, error: null });
            logger.info('Deleting group', { groupId: id, locationCount: group.locationIds?.length || 0 });

            // 1. 그룹에 속한 장소들의 groupId를 null로 초기화
            const locationIds = group.locationIds || [];
            const locationStore = useLocationStore.getState();

            for (const locationId of locationIds) {
              await locationStore.removeLocationFromGroup({
                id: locationId,
                groupId: undefined
              });
            }

            // 2. 그룹 삭제
            await groupService.deleteGroup(id);

            set((state) => ({
              groups: state.groups.filter((g) => g.id !== id),
              selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
              isLoading: false,
              ui: { ...state.ui, showDeleteConfirm: null }
            }));

            logger.userAction('Group deleted with locations cleanup', {
              groupId: id,
              name: group.name,
              cleanedLocationCount: locationIds.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete group';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to delete group', error);
            throw error;
          }
        },

        selectGroup: (id: string | null) => {
          set({ selectedGroupId: id });
          logger.userAction('Group selected', { groupId: id });
        },

        // Location management (backend sync)
        updateGroupLocationIds: async (groupId: string) => {
          try {
            // locationService를 DI container에서 직접 조회
            const locationService = container.resolve<ILocationService>(SERVICE_TOKENS.LOCATION_SERVICE);

            // 백엔드에서 해당 그룹의 장소 목록 조회
            const locations = await locationService.getLocations({ groupId });

            // 조회된 장소 ID 배열로 업데이트
            const locationIds = locations.map(loc => loc.id);

            set((state) => ({
              groups: state.groups.map((group) =>
                group.id === groupId
                  ? { ...group, locationIds }
                  : group
              ),
            }));

            logger.debug('Group locationIds updated from backend', {
              groupId,
              locationCount: locationIds.length
            });
          } catch (error) {
            logger.error('Failed to update group locationIds', error);
            throw error;
          }
        },

        // UI actions
        setUIState: (newState: Partial<GroupUIState>) => {
          set((state) => ({
            ui: { ...state.ui, ...newState }
          }));
        },

        resetUIState: () => {
          set({ ui: initialUIState });
        },

        // Utility functions
        getGroupById: (id: string) => {
          return get().groups.find(group => group.id === id);
        },

        getGroupsWithLocation: (locationId: string) => {
          return get().groups.filter(group =>
            group.locationIds?.includes(locationId) ?? false
          );
        },

        reset: () => {
          set(initialState);
          logger.info('Group store reset');
        },
      }),
      {
        name: 'group-store',
        partialize: (state) => ({
          groups: state.groups,
          selectedGroupId: state.selectedGroupId
        }),
      }
    ),
    {
      name: 'group-store',
    }
  )
);

// Selectors for easy access
export const useGroups = () => useGroupStore(state => state.groups);
export const useSelectedGroup = () => {
  const selectedGroupId = useGroupStore(state => state.selectedGroupId);
  const getGroupById = useGroupStore(state => state.getGroupById);
  return selectedGroupId ? getGroupById(selectedGroupId) : null;
};
export const useGroupUIState = () => useGroupStore(state => state.ui);
export const useGroupsLoading = () => useGroupStore(state => state.isLoading);
export const useGroupsError = () => useGroupStore(state => state.error);
