// Group Management Types

export interface Group {
  id: string;
  name: string;
  locationIds: string[];
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupCreateRequest {
  name: string;
  color?: string;
}

export interface GroupUpdateRequest {
  name?: string;
  color?: string;
  locationIds?: string[];
}

export interface GroupUIState {
  isCreating: boolean;
  editingGroupId: string | null;
  showMenuForGroupId: string | null;
  showDeleteConfirm: string | null;
}

// Group colors for UI
export const GROUP_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Light Yellow
  '#BB8FCE', // Light Purple
  '#85C1E9', // Light Blue
] as const;

export type GroupColor = typeof GROUP_COLORS[number];