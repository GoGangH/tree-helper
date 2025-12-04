// 트리 시각화 관련 상수
export const TREE_CONSTANTS = {
  // BST/AVL 트리 노드
  NODE_RADIUS: 25,

  // B-트리, B+ 트리 노드
  BTREE_NODE_WIDTH: 40,
  BTREE_NODE_HEIGHT: 35,

  // 레이아웃
  HORIZONTAL_SPACING: 80,
  VERTICAL_SPACING: 100,
} as const;

// 색상 테마
export const COLORS = {
  // 노드 색상
  NODE_DEFAULT: '#ffffff',
  NODE_HIGHLIGHTED: '#3b82f6',
  NODE_BORDER: '#000000',
  NODE_BORDER_HIGHLIGHTED: '#2563eb',

  // 텍스트 색상
  TEXT_DEFAULT: '#000000',
  TEXT_HIGHLIGHTED: '#ffffff',
  TEXT_SECONDARY: '#6b7280',

  // B+ 트리 리프 노드
  LEAF_NODE_BG: '#dcfce7',

  // 연결선
  EDGE_COLOR: '#d1d5db',
  NEXT_POINTER_COLOR: '#10b981',
} as const;
