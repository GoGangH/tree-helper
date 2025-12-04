export interface TreeNode {
  value: number;
  x?: number;
  y?: number;
  level?: number;
}

export interface BSTNode extends TreeNode {
  left: BSTNode | null;
  right: BSTNode | null;
}

export interface AVLNode extends BSTNode {
  height: number;
  balance: number;
}

export interface BTreeNode {
  keys: number[];
  children: BTreeNode[];
  isLeaf: boolean;
  x?: number;
  y?: number;
  level?: number;
}

export interface BPlusTreeNode {
  keys: number[];
  children: BPlusTreeNode[];
  isLeaf: boolean;
  next: BPlusTreeNode | null;
  x?: number;
  y?: number;
  level?: number;
}

export interface OperationStep {
  type: 'insert' | 'delete' | 'rotate' | 'split' | 'merge' | 'highlight' | 'complete' | 'create';
  description: string;
  node?: BSTNode | AVLNode | BTreeNode | BPlusTreeNode;
  highlightNodes?: number[];
  overflowNodes?: number[]; // 오버플로우된 노드 (빨간색 표시)
  tree?: BSTNode | AVLNode | BTreeNode | BPlusTreeNode | null;
  creatingValue?: number; // 생성 중인 노드의 값
}

export type TreeType = 'BST' | 'AVL' | 'BTree' | 'BPlusTree';

export interface Command {
  type: 'insert' | 'delete';
  value: number;
}
