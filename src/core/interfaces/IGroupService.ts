// Group Service Interface

import type { Group, GroupCreateRequest, GroupUpdateRequest } from '../../types/group';

export interface IGroupService {
  /**
   * 모든 그룹 조회
   */
  getGroups(): Promise<Group[]>;

  /**
   * 특정 그룹 조회
   */
  getGroupById(id: string): Promise<Group>;

  /**
   * 새 그룹 생성
   */
  createGroup(request: GroupCreateRequest): Promise<Group>;

  /**
   * 그룹 정보 수정
   */
  updateGroup(id: string, request: GroupUpdateRequest): Promise<Group>;

  /**
   * 그룹 삭제
   */
  deleteGroup(id: string): Promise<void>;

  /**
   * 그룹 순서 변경
   */
  reorderGroups(groupOrders: Array<{ groupId: string; order: number }>): Promise<void>;
}
