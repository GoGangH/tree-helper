import { Command, TreeType } from './types';
import { BST } from './bst';
import { AVL } from './avl';
import { BTree } from './btree';
import { BPlusTree } from './bplustree';
import { BSTNode, BTreeNode, BPlusTreeNode } from './types';

export type OperationType = 'insert' | 'delete' | 'insert-delete';

export interface Problem {
  commands: Command[];
  treeType: TreeType;
  treeOrder?: number;
  answer: string;
  initialState?: string; // 삭제 문제의 경우 초기 트리 상태 (텍스트)
  initialTree?: BSTNode | BTreeNode | BPlusTreeNode | null; // 삭제 문제의 경우 초기 트리 객체
  isLinkedProblem?: boolean; // 연계 문제 여부
  insertProblem?: Problem; // 연계 문제의 삽입 부분
  deleteProblem?: Problem; // 연계 문제의 삭제 부분
}

export function generateProblem(
  treeType: TreeType,
  operationCount: number = 10,
  treeOrder: number = 3,
  operationType: OperationType = 'insert',
  initialNodeCount: number = 15
): Problem {
  // 연계 문제인 경우
  if (operationType === 'insert-delete') {
    const usedValues = new Set<number>();
    const insertCommands: Command[] = [];

    // 1단계: 삽입 문제 생성
    for (let i = 0; i < initialNodeCount; i++) {
      let value: number;
      do {
        value = Math.floor(Math.random() * 100) + 1;
      } while (usedValues.has(value));

      usedValues.add(value);
      insertCommands.push({ type: 'insert', value });
    }

    const insertAnswer = calculateAnswer(insertCommands, treeType, treeOrder);
    const insertTree = buildInitialTree(insertCommands, treeType, treeOrder);

    // 2단계: 삭제 문제 생성
    const deleteCommands: Command[] = [...insertCommands];
    const values = Array.from(usedValues);

    for (let i = 0; i < operationCount; i++) {
      if (values.length === 0) break;

      const randomIndex = Math.floor(Math.random() * values.length);
      const value = values.splice(randomIndex, 1)[0];
      usedValues.delete(value);
      deleteCommands.push({ type: 'delete', value });
    }

    const deleteAnswer = calculateAnswer(deleteCommands, treeType, treeOrder);

    const insertProblem: Problem = {
      commands: insertCommands,
      treeType,
      treeOrder: treeType === 'BTree' || treeType === 'BPlusTree' ? treeOrder : undefined,
      answer: insertAnswer,
    };

    const deleteProblem: Problem = {
      commands: deleteCommands,
      treeType,
      treeOrder: treeType === 'BTree' || treeType === 'BPlusTree' ? treeOrder : undefined,
      answer: deleteAnswer,
      initialTree: insertTree,
      initialState: insertAnswer,
    };

    return {
      commands: deleteCommands,
      treeType,
      treeOrder: treeType === 'BTree' || treeType === 'BPlusTree' ? treeOrder : undefined,
      answer: deleteAnswer,
      isLinkedProblem: true,
      insertProblem,
      deleteProblem,
    };
  }

  const commands: Command[] = [];
  const usedValues = new Set<number>();
  let initialState: string | undefined;
  let initialTree: BSTNode | BTreeNode | BPlusTreeNode | null = null;

  if (operationType === 'insert') {
    // 삽입 문제: 모든 연산이 삽입
    for (let i = 0; i < operationCount; i++) {
      let value: number;
      do {
        value = Math.floor(Math.random() * 100) + 1;
      } while (usedValues.has(value));

      usedValues.add(value);
      commands.push({ type: 'insert', value });
    }
  } else {
    // 삭제 문제: 먼저 지정된 개수만큼 삽입한 후 삭제
    const initialCommands: Command[] = [];

    // 초기 삽입
    for (let i = 0; i < initialNodeCount; i++) {
      let value: number;
      do {
        value = Math.floor(Math.random() * 100) + 1;
      } while (usedValues.has(value));

      usedValues.add(value);
      const insertCmd = { type: 'insert' as const, value };
      commands.push(insertCmd);
      initialCommands.push(insertCmd);
    }

    // 초기 트리 상태 계산
    initialState = calculateAnswer(initialCommands, treeType, treeOrder);
    initialTree = buildInitialTree(initialCommands, treeType, treeOrder);

    // 삭제 연산
    const values = Array.from(usedValues);
    for (let i = 0; i < operationCount; i++) {
      if (values.length === 0) break;

      const randomIndex = Math.floor(Math.random() * values.length);
      const value = values.splice(randomIndex, 1)[0];
      usedValues.delete(value);
      commands.push({ type: 'delete', value });
    }
  }

  // 정답 계산
  const answer = calculateAnswer(commands, treeType, treeOrder);

  return {
    commands,
    treeType,
    treeOrder: treeType === 'BTree' || treeType === 'BPlusTree' ? treeOrder : undefined,
    answer,
    initialState,
    initialTree,
  };
}

function buildInitialTree(
  commands: Command[],
  treeType: TreeType,
  treeOrder: number
): BSTNode | BTreeNode | BPlusTreeNode | null {
  if (treeType === 'BST') {
    const tree = new BST();
    for (const cmd of commands) {
      if (cmd.type === 'insert') tree.insert(cmd.value);
    }
    return tree.root ? cloneBSTNode(tree.root) : null;
  } else if (treeType === 'AVL') {
    const tree = new AVL();
    for (const cmd of commands) {
      if (cmd.type === 'insert') tree.insert(cmd.value);
    }
    return tree.root ? cloneBSTNode(tree.root) : null;
  } else if (treeType === 'BTree') {
    const tree = new BTree(treeOrder);
    for (const cmd of commands) {
      if (cmd.type === 'insert') tree.insert(cmd.value);
    }
    return tree.root ? cloneBTreeNode(tree.root) : null;
  } else {
    const tree = new BPlusTree(treeOrder);
    for (const cmd of commands) {
      if (cmd.type === 'insert') tree.insert(cmd.value);
    }
    return tree.root ? cloneBPlusTreeNode(tree.root) : null;
  }
}

function cloneBSTNode(node: BSTNode): BSTNode {
  return {
    value: node.value,
    left: node.left ? cloneBSTNode(node.left) : null,
    right: node.right ? cloneBSTNode(node.right) : null,
  };
}

function cloneBTreeNode(node: BTreeNode): BTreeNode {
  return {
    keys: [...node.keys],
    children: node.children.map(child => cloneBTreeNode(child)),
    isLeaf: node.isLeaf,
  };
}

function cloneBPlusTreeNode(node: BPlusTreeNode): BPlusTreeNode {
  return {
    keys: [...node.keys],
    children: node.children.map(child => cloneBPlusTreeNode(child)),
    isLeaf: node.isLeaf,
    next: null, // next 포인터는 복사하지 않음
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
