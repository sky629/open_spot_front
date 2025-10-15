// 그룹 관련 API 서비스

import { logger } from '../utils/logger';
import type { IGroupService } from '../core/interfaces/IGroupService';
import type { Group, GroupCreateRequest, GroupUpdateRequest } from '../types/group';

// Orval 생성 API factory import
import { getLocationGroups as getLocationGroupsFactory } from '../api/generated/location-groups/location-groups';

// Orval API 함수들 생성
const groupsApi = getLocationGroupsFactory();

export class GroupService implements IGroupService {
  /**
   * 모든 그룹 조회
   */
  async getGroups(): Promise<Group[]> {
    try {
      logger.debug('Fetching groups from API');

      const response = await groupsApi.getLocationGroups();

      if (response.success && response.data) {
        // 백엔드 응답에서 그룹 목록 추출
        const groups = response.data as unknown as Group[];
        logger.info(`Successfully fetched ${groups.length} groups`);
        return groups;
      } else {
        throw new Error('Failed to fetch groups');
      }
    } catch (error) {
      logger.error('Error fetching groups', error);
      throw error;
    }
  }

  /**
   * 특정 그룹 조회
   */
  async getGroupById(id: string): Promise<Group> {
    try {
      // OpenAPI에 단일 그룹 조회 API가 없으므로 전체 목록에서 필터링
      const groups = await this.getGroups();
      const group = groups.find(g => g.id === id);

      if (!group) {
        throw new Error(`Group not found: ${id}`);
      }

      return group;
    } catch (error) {
      logger.error('Error fetching group by id:', error);
      throw error;
    }
  }

  /**
   * 새 그룹 생성
   */
  async createGroup(request: GroupCreateRequest): Promise<Group> {
    try {
      logger.debug('Creating group', request);

      const response = await groupsApi.createLocationGroup({
        name: request.name,
        color: request.color,
      });

      if (response.success && response.data) {
        const group = response.data as unknown as Group;
        logger.info('Group created successfully', { groupId: group.id });
        return group;
      } else {
        throw new Error('Failed to create group');
      }
    } catch (error) {
      logger.error('Error creating group', error);
      throw error;
    }
  }

  /**
   * 그룹 정보 수정
   */
  async updateGroup(id: string, request: GroupUpdateRequest): Promise<Group> {
    try {
      logger.debug('Updating group', { groupId: id, request });

      const response = await groupsApi.updateLocationGroup(id, {
        name: request.name || 'Untitled Group',
        color: request.color || '#8B7FD6',
      });

      if (response.success && response.data) {
        const group = response.data as unknown as Group;
        logger.info('Group updated successfully', { groupId: id });
        return group;
      } else {
        throw new Error('Failed to update group');
      }
    } catch (error) {
      logger.error('Error updating group', error);
      throw error;
    }
  }

  /**
   * 그룹 삭제
   */
  async deleteGroup(id: string): Promise<void> {
    try {
      logger.debug('Deleting group', { groupId: id });

      const response = await groupsApi.deleteLocationGroup(id);

      if (response.success) {
        logger.info('Group deleted successfully', { groupId: id });
      } else {
        throw new Error('Failed to delete group');
      }
    } catch (error) {
      logger.error('Error deleting group', error);
      throw error;
    }
  }

  /**
   * 그룹 순서 변경
   */
  async reorderGroups(groupOrders: Array<{ groupId: string; order: number }>): Promise<void> {
    try {
      logger.debug('Reordering groups', { count: groupOrders.length });

      const response = await groupsApi.reorderLocationGroups({
        groupOrders: groupOrders.map(g => ({
          groupId: g.groupId,
          displayOrder: g.order, // OpenAPI 스펙에 맞게 displayOrder 사용
        })),
      });

      if (response.success) {
        logger.info('Groups reordered successfully');
      } else {
        throw new Error('Failed to reorder groups');
      }
    } catch (error) {
      logger.error('Error reordering groups', error);
      throw error;
    }
  }
}
