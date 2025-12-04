import { Command, TreeType } from './types';
import { BST } from './bst';
import { AVL } from './avl';
import { BTree } from './btree';
import { BPlusTree } from './bplustree';
import { BSTNode, BTreeNode, BPlusTreeNode } from './types';

export interface Problem {
  commands: Command[];
  treeType: TreeType;
  treeOrder?: number;
  answer: string;
}

export function generateProblem(
  treeType: TreeType,
  operationCount: number = 10,
  treeOrder: number = 3
): Problem {
  const commands: Command[] = [];
  const usedValues = new Set<number>();

  // 랜덤 명령 생성
  for (let i = 0; i < operationCount; i++) {
    const isInsert = i < operationCount / 2 || Math.random() > 0.3; // 초반에는 주로 삽입

    if (isInsert) {
      let value: number;
      do {
        value = Math.floor(Math.random() * 100) + 1;
      } while (usedValues.has(value));

      usedValues.add(value);
      commands.push({ type: 'insert', value });
    } else if (usedValues.size > 0) {
      const values = Array.from(usedValues);
      const value = values[Math.floor(Math.random() * values.length)];
      usedValues.delete(value);
      commands.push({ type: 'delete', value });
    } else {
      // 삭제할 값이 없으면 삽입
      let value: number;
      do {
        value = Math.floor(Math.random() * 100) + 1;
      } while (usedValues.has(value));

      usedValues.add(value);
      commands.push({ type: 'insert', value });
    }
  }

  // 정답 계산
  const answer = calculateAnswer(commands, treeType, treeOrder);

  return {
    commands,
    treeType,
    treeOrder: treeType === 'BTree' || treeType === 'BPlusTree' ? treeOrder : undefined,
    answer,
  };
}

function calculateAnswer(commands: Command[], treeType: TreeType, treeOrder: number): string {
  if (treeType === 'BST') {
    return calculateBSTAnswer(commands);
  } else if (treeType === 'AVL') {
    return calculateAVLAnswer(commands);
  } else if (treeType === 'BTree') {
    return calculateBTreeAnswer(commands, treeOrder);
  } else {
    return calculateBPlusTreeAnswer(commands, treeOrder);
  }
}

function calculateBSTAnswer(commands: Command[]): string {
  const tree = new BST();

  for (const cmd of commands) {
    if (cmd.type === 'insert') {
      tree.insert(cmd.value);
    } else {
      tree.delete(cmd.value);
    }
  }

  if (!tree.root) return '0,null,0,0#';

  // 첫 번째 결과: 높이, 루트 키, 왼쪽 서브트리 노드 수, 오른쪽 서브트리 노드 수
  const height = getHeight(tree.root);
  const rootKey = tree.root.value;
  const leftCount = countNodes(tree.root.left);
  const rightCount = countNodes(tree.root.right);

  const part1 = `${height},${rootKey},${leftCount},${rightCount}`;

  // 두 번째 결과: 모든 단말 노드의 키 값 (왼쪽에서 오른쪽)
  const leafNodes: number[] = [];
  collectLeafNodes(tree.root, leafNodes);
  const part2 = leafNodes.join(',');

  return `${part1}#${part2}`;
}

function calculateAVLAnswer(commands: Command[]): string {
  const tree = new AVL();

  for (const cmd of commands) {
    if (cmd.type === 'insert') {
      tree.insert(cmd.value);
    } else {
      tree.delete(cmd.value);
    }
  }

  if (!tree.root) return '0,null,0,0#';

  const height = getHeight(tree.root);
  const rootKey = tree.root.value;
  const leftCount = countNodes(tree.root.left);
  const rightCount = countNodes(tree.root.right);

  const part1 = `${height},${rootKey},${leftCount},${rightCount}`;

  const leafNodes: number[] = [];
  collectLeafNodes(tree.root, leafNodes);
  const part2 = leafNodes.join(',');

  return `${part1}#${part2}`;
}

function calculateBTreeAnswer(commands: Command[], order: number): string {
  const tree = new BTree(order);

  for (const cmd of commands) {
    if (cmd.type === 'insert') {
      tree.insert(cmd.value);
    } else {
      tree.delete(cmd.value);
    }
  }

  if (!tree.root) return '';

  const leafNodes: number[][] = [];
  collectBTreeLeafNodes(tree.root, leafNodes);

  return leafNodes.map(node => `{${node.join(',')}}`).join(',');
}

function calculateBPlusTreeAnswer(commands: Command[], order: number): string {
  const tree = new BPlusTree(order);

  for (const cmd of commands) {
    if (cmd.type === 'insert') {
      tree.insert(cmd.value);
    } else {
      tree.delete(cmd.value);
    }
  }

  if (!tree.root) return '';

  const leafNodes: number[][] = [];
  collectBPlusTreeLeafNodes(tree.root, leafNodes);

  return leafNodes.map(node => `{${node.join(',')}}`).join(',');
}

// Helper functions
function getHeight(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + Math.max(getHeight(node.left), getHeight(node.right));
}

function countNodes(node: BSTNode | null): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

function collectLeafNodes(node: BSTNode | null, result: number[]): void {
  if (!node) return;

  if (!node.left && !node.right) {
    result.push(node.value);
    return;
  }

  collectLeafNodes(node.left, result);
  collectLeafNodes(node.right, result);
}

function collectBTreeLeafNodes(node: BTreeNode | null, result: number[][]): void {
  if (!node) return;

  if (node.isLeaf) {
    result.push([...node.keys]);
  } else {
    for (const child of node.children) {
      collectBTreeLeafNodes(child, result);
    }
  }
}

function collectBPlusTreeLeafNodes(node: BPlusTreeNode | null, result: number[][]): void {
  if (!node) return;

  if (node.isLeaf) {
    result.push([...node.keys]);
  } else {
    for (const child of node.children) {
      collectBPlusTreeLeafNodes(child, result);
    }
  }
}
