import { BSTNode, BTreeNode, BPlusTreeNode } from './types';
import { TREE_CONSTANTS } from './constants';

export function calculateBSTLayout(root: BSTNode | null): void {
  if (!root) return;

  // 각 노드의 인덱스를 계산 (중위 순회 순서)
  let index = 0;
  const assignIndex = (node: BSTNode | null): void => {
    if (!node) return;
    assignIndex(node.left);
    node.x = index * TREE_CONSTANTS.HORIZONTAL_SPACING;
    index++;
    assignIndex(node.right);
  };

  // 깊이 계산
  const assignDepth = (node: BSTNode | null, depth: number = 0): void => {
    if (!node) return;
    node.y = depth * TREE_CONSTANTS.VERTICAL_SPACING;
    node.level = depth;
    assignDepth(node.left, depth + 1);
    assignDepth(node.right, depth + 1);
  };

  assignIndex(root);
  assignDepth(root);

  // 중앙 정렬을 위해 x 좌표 조정
  const minX = getMinX(root);
  const maxX = getMaxX(root);
  const centerOffset = -(minX + maxX) / 2;

  adjustX(root, centerOffset);
}

function getMinX(node: BSTNode | null): number {
  if (!node) return Infinity;
  return Math.min(node.x || 0, getMinX(node.left), getMinX(node.right));
}

function getMaxX(node: BSTNode | null): number {
  if (!node) return -Infinity;
  return Math.max(node.x || 0, getMaxX(node.left), getMaxX(node.right));
}

function adjustX(node: BSTNode | null, offset: number): void {
  if (!node) return;
  node.x = (node.x || 0) + offset;
  adjustX(node.left, offset);
  adjustX(node.right, offset);
}

export function calculateBTreeLayout(root: BTreeNode | null): void {
  if (!root) return;

  const assignPositions = (
    node: BTreeNode | null,
    level: number,
    leftBound: number,
    rightBound: number
  ): void => {
    if (!node) return;

    const x = (leftBound + rightBound) / 2;
    const y = level * TREE_CONSTANTS.VERTICAL_SPACING;

    node.x = x;
    node.y = y;
    node.level = level;

    if (!node.isLeaf && node.children.length > 0) {
      const childWidth = (rightBound - leftBound) / node.children.length;
      node.children.forEach((child, index) => {
        const childLeft = leftBound + index * childWidth;
        const childRight = childLeft + childWidth;
        assignPositions(child, level + 1, childLeft, childRight);
      });
    }
  };

  const getTreeWidth = (node: BTreeNode | null): number => {
    if (!node) return 0;
    if (node.isLeaf) {
      return Math.max(
        node.keys.length * TREE_CONSTANTS.BTREE_NODE_WIDTH * TREE_CONSTANTS.BTREE_WIDTH_MULTIPLIER,
        150
      );
    }

    let maxWidth = 0;
    node.children.forEach(child => {
      maxWidth = Math.max(maxWidth, getTreeWidth(child));
    });
    return Math.max(
      node.keys.length * TREE_CONSTANTS.BTREE_NODE_WIDTH * TREE_CONSTANTS.BTREE_WIDTH_MULTIPLIER,
      maxWidth * node.children.length
    );
  };

  const width = getTreeWidth(root);
  assignPositions(root, 0, -width / 2, width / 2);
}

export function calculateBPlusTreeLayout(root: BPlusTreeNode | null): void {
  if (!root) return;

  const assignPositions = (
    node: BPlusTreeNode | null,
    level: number,
    leftBound: number,
    rightBound: number
  ): void => {
    if (!node) return;

    const x = (leftBound + rightBound) / 2;
    const y = level * TREE_CONSTANTS.VERTICAL_SPACING;

    node.x = x;
    node.y = y;
    node.level = level;

    if (!node.isLeaf && node.children.length > 0) {
      const childWidth = (rightBound - leftBound) / node.children.length;
      node.children.forEach((child, index) => {
        const childLeft = leftBound + index * childWidth;
        const childRight = childLeft + childWidth;
        assignPositions(child, level + 1, childLeft, childRight);
      });
    }
  };

  const getTreeWidth = (node: BPlusTreeNode | null): number => {
    if (!node) return 0;
    if (node.isLeaf) {
      return Math.max(
        node.keys.length * TREE_CONSTANTS.BTREE_NODE_WIDTH * TREE_CONSTANTS.BTREE_WIDTH_MULTIPLIER,
        150
      );
    }

    let maxWidth = 0;
    node.children.forEach(child => {
      maxWidth = Math.max(maxWidth, getTreeWidth(child));
    });
    return Math.max(
      node.keys.length * TREE_CONSTANTS.BTREE_NODE_WIDTH * TREE_CONSTANTS.BTREE_WIDTH_MULTIPLIER,
      maxWidth * node.children.length
    );
  };

  const width = getTreeWidth(root);
  assignPositions(root, 0, -width / 2, width / 2);
}
