// Group Store using Zustand

import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { Group, GroupCreateRequest, GroupUpdateRequest, GroupUIState } from '../../types/group';
import { logger } from '../../utils/logger';

interface GroupStore {
  // Data state
  groups: Group[];
  selectedGroupId: string | null;

  // UI state
  ui: GroupUIState;

  // Group CRUD actions
  createGroup: (request: GroupCreateRequest) => void;
  updateGroup: (id: string, request: GroupUpdateRequest) => void;
  deleteGroup: (id: string) => void;
  selectGroup: (id: string | null) => void;

  // Location management
  addLocationToGroup: (groupId: string, locationId: string) => void;
  removeLocationFromGroup: (groupId: string, locationId: string) => void;

  // UI actions
  setUIState: (state: Partial<GroupUIState>) => void;
  resetUIState: () => void;

  // Utility
  getGroupById: (id: string) => Group | undefined;
  getGroupsWithLocation: (locationId: string) => Group[];
}

const initialUIState: GroupUIState = {
  isCreating: false,
  editingGroupId: null,
  showMenuForGroupId: null,
  showDeleteConfirm: null,
};

export const useGroupStore = create<GroupStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        groups: [],
        selectedGroupId: null,
        ui: initialUIState,

        // Group CRUD actions
        createGroup: (request: GroupCreateRequest) => {
          const newGroup: Group = {
            id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: request.name,
            color: request.color,
            locationIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          set((state) => ({
            groups: [...state.groups, newGroup],
            ui: { ...state.ui, isCreating: false }
          }));

          logger.userAction('Group created', { groupId: newGroup.id, name: newGroup.name });
        },

        updateGroup: (id: string, request: GroupUpdateRequest) => {
          set((state) => ({
            groups: state.groups.map((group) =>
              group.id === id
                ? {
                    ...group,
                    ...request,
                    updatedAt: new Date().toISOString(),
                  }
                : group
            ),
            ui: { ...state.ui, editingGroupId: null }
          }));

          logger.userAction('Group updated', { groupId: id, request });
        },

        deleteGroup: (id: string) => {
          const group = get().getGroupById(id);
          if (!group) return;

          set((state) => ({
            groups: state.groups.filter((g) => g.id !== id),
            selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
            ui: { ...state.ui, showDeleteConfirm: null }
          }));

          logger.userAction('Group deleted', { groupId: id, name: group.name });
        },

        selectGroup: (id: string | null) => {
          set({ selectedGroupId: id });
          logger.userAction('Group selected', { groupId: id });
        },

        // Location management
        addLocationToGroup: (groupId: string, locationId: string) => {
          set((state) => ({
            groups: state.groups.map((group) =>
              group.id === groupId && !group.locationIds.includes(locationId)
                ? {
                    ...group,
                    locationIds: [...group.locationIds, locationId],
                    updatedAt: new Date().toISOString(),
                  }
                : group
            )
          }));

          logger.userAction('Location added to group', { groupId, locationId });
        },

        removeLocationFromGroup: (groupId: string, locationId: string) => {
          set((state) => ({
            groups: state.groups.map((group) =>
              group.id === groupId
                ? {
                    ...group,
                    locationIds: group.locationIds.filter(id => id !== locationId),
                    updatedAt: new Date().toISOString(),
                  }
                : group
            )
          }));

          logger.userAction('Location removed from group', { groupId, locationId });
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
            group.locationIds.includes(locationId)
          );
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