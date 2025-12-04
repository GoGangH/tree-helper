import { BTreeNode, OperationStep } from './types';

export class BTree {
  root: BTreeNode | null = null;
  steps: OperationStep[] = [];
  readonly order: number; // m (차수)

  constructor(order: number = 3) {
    this.order = order;
  }

  // 내부 노드 최대 키 개수: m - 1
  get maxKeys(): number {
    return this.order - 1;
  }

  // 최소 키 개수 (루트 제외): ceil(m/2) - 1
  get minKeys(): number {
    return Math.ceil(this.order / 2) - 1;
  }

  createNode(isLeaf: boolean = true): BTreeNode {
    return {
      keys: [],
      children: [],
      isLeaf,
    };
  }

  insert(value: number): OperationStep[] {
    this.steps = [];
    this.steps.push({
      type: 'highlight',
      description: `${value}를 삽입합니다`,
      highlightNodes: [value],
      tree: this.cloneTree(),
    });

    if (this.root === null) {
      this.root = this.createNode(true);
      this.root.keys.push(value);
      this.steps.push({
        type: 'insert',
        description: `루트 노드에 ${value}를 삽입했습니다`,
        tree: this.cloneTree(),
      });
    } else {
      this.insertAndSplit(this.root, value, null, -1);
    }

    this.steps.push({
      type: 'complete',
      description: `${value} 삽입 완료`,
      tree: this.cloneTree(),
    });

    return this.steps;
  }

  private insertAndSplit(node: BTreeNode, value: number, parent: BTreeNode | null, childIndex: number): void {
    if (node.isLeaf) {
      // 리프 노드에 삽입
      let i = node.keys.length - 1;
      node.keys.push(0);
      while (i >= 0 && value < node.keys[i]) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = value;

      this.steps.push({
        type: 'insert',
        description: `리프 노드에 ${value}를 삽입했습니다`,
        highlightNodes: [value],
        tree: this.cloneTree(),
      });

      // 오버플로우 체크
      if (node.keys.length > this.maxKeys) {
        this.steps.push({
          type: 'highlight',
          description: `오버플로우 발생! 노드를 분할합니다 (현재 ${node.keys.length}개 키, 최대 ${this.maxKeys}개)`,
          overflowNodes: node.keys,
          tree: this.cloneTree(),
        });

        this.splitNode(node, parent, childIndex);
      }
    } else {
      // 적절한 자식 찾기
      let i = 0;
      while (i < node.keys.length && value > node.keys[i]) {
        i++;
      }

      this.steps.push({
        type: 'highlight',
        description: `자식 노드 ${i}로 이동합니다`,
        tree: this.cloneTree(),
      });

      // 자식에 재귀적으로 삽입
      this.insertAndSplit(node.children[i], value, node, i);

      // 재귀 호출 후, 현재 노드가 오버플로우되었는지 확인
      if (node.keys.length > this.maxKeys) {
        this.steps.push({
          type: 'highlight',
          description: `내부 노드 오버플로우 발생! (현재 ${node.keys.length}개 키, 최대 ${this.maxKeys}개)`,
          overflowNodes: node.keys,
          tree: this.cloneTree(),
        });

        this.splitNode(node, parent, childIndex);
      }
    }
  }

  private splitNode(node: BTreeNode, parent: BTreeNode | null, childIndex: number): void {
    const mid = Math.floor(node.keys.length / 2);
    const newNode = this.createNode(node.isLeaf);

    // 중간 키를 부모로 올림
    const pushUpKey = node.keys[mid];

    // 새 노드(오른쪽)에 mid+1부터 끝까지의 키를 복사
    newNode.keys = node.keys.splice(mid + 1);
    // 원래 노드(왼쪽)에서 중간 키 제거
    node.keys.splice(mid, 1);

    // 내부 노드인 경우 자식도 분할
    if (!node.isLeaf) {
      newNode.children = node.children.splice(mid + 1);
    }

    if (parent === null) {
      // 부모가 없으면 새 루트 생성
      const newRoot = this.createNode(false);
      newRoot.keys = [pushUpKey];
      newRoot.children = [node, newNode];
      this.root = newRoot;

      this.steps.push({
        type: 'split',
        description: `노드 분할 완료: {${node.keys.join(',')}} [${pushUpKey}] {${newNode.keys.join(',')}}`,
        tree: this.cloneTree(),
      });
    } else {
      // 부모에 키 삽입
      let insertPos = 0;
      while (insertPos < parent.keys.length && pushUpKey > parent.keys[insertPos]) {
        insertPos++;
      }

      parent.keys.splice(insertPos, 0, pushUpKey);
      parent.children.splice(childIndex + 1, 0, newNode);

      this.steps.push({
        type: 'insert',
        description: `부모 노드에 ${pushUpKey} 추가: [${parent.keys.join(',')}]`,
        highlightNodes: [pushUpKey],
        tree: this.cloneTree(),
      });
      // 부모 오버플로우는 호출자(insertAndSplit)에서 확인
    }
  }

  delete(value: number): OperationStep[] {
    this.steps = [];
    this.steps.push({
      type: 'highlight',
      description: `${value}를 삭제합니다`,
      highlightNodes: [value],
      tree: this.cloneTree(),
    });

    if (this.root === null) {
      this.steps.push({
        type: 'highlight',
        description: `트리가 비어있습니다`,
        tree: this.cloneTree(),
      });
      return this.steps;
    }

    this.deleteKey(this.root, value);

    // 루트가 비어있으면 첫 번째 자식을 루트로
    if (this.root.keys.length === 0) {
      if (!this.root.isLeaf && this.root.children.length > 0) {
        this.root = this.root.children[0];
        this.steps.push({
          type: 'delete',
          description: `루트가 비어 새로운 루트를 설정했습니다`,
          tree: this.cloneTree(),
        });
      } else {
        this.root = null;
        this.steps.push({
          type: 'delete',
          description: `트리가 비었습니다`,
          tree: this.cloneTree(),
        });
      }
    }

    this.steps.push({
      type: 'complete',
      description: `${value} 삭제 완료`,
      tree: this.cloneTree(),
    });

    return this.steps;
  }

  private deleteKey(node: BTreeNode, value: number): void {
    const idx = node.keys.findIndex(k => k >= value);

    if (idx < node.keys.length && node.keys[idx] === value) {
      if (node.isLeaf) {
        this.steps.push({
          type: 'delete',
          description: `리프 노드에서 ${value}를 삭제합니다`,
          tree: this.cloneTree(),
        });
        node.keys.splice(idx, 1);
      } else {
        this.deleteInternalNode(node, idx);
      }
    } else if (!node.isLeaf) {
      const childIdx = idx === -1 ? node.keys.length : idx;
      const isInLastChild = childIdx === node.keys.length;

      this.steps.push({
        type: 'highlight',
        description: `자식 노드로 이동합니다`,
        tree: this.cloneTree(),
      });

      if (childIdx < node.children.length && node.children[childIdx].keys.length <= this.minKeys) {
        this.fill(node, childIdx);
      }

      if (isInLastChild && childIdx > node.keys.length) {
        this.deleteKey(node.children[childIdx - 1], value);
      } else if (childIdx < node.children.length) {
        this.deleteKey(node.children[childIdx], value);
      }
    } else {
      this.steps.push({
        type: 'highlight',
        description: `${value}를 찾을 수 없습니다`,
        tree: this.cloneTree(),
      });
    }
  }

  private deleteInternalNode(node: BTreeNode, idx: number): void {
    const key = node.keys[idx];

    if (node.children[idx].keys.length > this.minKeys) {
      const pred = this.getPredecessor(node, idx);
      node.keys[idx] = pred;
      this.steps.push({
        type: 'highlight',
        description: `${key}를 선행자 ${pred}로 대체합니다`,
        tree: this.cloneTree(),
      });
      this.deleteKey(node.children[idx], pred);
    } else if (node.children[idx + 1].keys.length > this.minKeys) {
      const succ = this.getSuccessor(node, idx);
      node.keys[idx] = succ;
      this.steps.push({
        type: 'highlight',
        description: `${key}를 후계자 ${succ}로 대체합니다`,
        tree: this.cloneTree(),
      });
      this.deleteKey(node.children[idx + 1], succ);
    } else {
      this.steps.push({
        type: 'merge',
        description: `자식 노드를 병합합니다`,
        tree: this.cloneTree(),
      });
      this.merge(node, idx);
      this.deleteKey(node.children[idx], key);
    }
  }

  private getPredecessor(node: BTreeNode, idx: number): number {
    let cur = node.children[idx];
    while (!cur.isLeaf) {
      cur = cur.children[cur.children.length - 1];
    }
    return cur.keys[cur.keys.length - 1];
  }

  private getSuccessor(node: BTreeNode, idx: number): number {
    let cur = node.children[idx + 1];
    while (!cur.isLeaf) {
      cur = cur.children[0];
    }
    return cur.keys[0];
  }

  private fill(node: BTreeNode, idx: number): void {
    if (idx !== 0 && node.children[idx - 1].keys.length > this.minKeys) {
      this.borrowFromPrev(node, idx);
    } else if (idx !== node.keys.length && node.children[idx + 1].keys.length > this.minKeys) {
      this.borrowFromNext(node, idx);
    } else {
      if (idx !== node.keys.length) {
        this.merge(node, idx);
      } else {
        this.merge(node, idx - 1);
      }
    }
  }

  private borrowFromPrev(node: BTreeNode, childIdx: number): void {
    const child = node.children[childIdx];
    const sibling = node.children[childIdx - 1];

    child.keys.unshift(node.keys[childIdx - 1]);
    node.keys[childIdx - 1] = sibling.keys.pop()!;

    if (!child.isLeaf) {
      child.children.unshift(sibling.children.pop()!);
    }

    this.steps.push({
      type: 'highlight',
      description: `이전 형제에서 키를 빌렸습니다`,
      tree: this.cloneTree(),
    });
  }

  private borrowFromNext(node: BTreeNode, childIdx: number): void {
    const child = node.children[childIdx];
    const sibling = node.children[childIdx + 1];

    child.keys.push(node.keys[childIdx]);
    node.keys[childIdx] = sibling.keys.shift()!;

    if (!child.isLeaf) {
      child.children.push(sibling.children.shift()!);
    }

    this.steps.push({
      type: 'highlight',
      description: `다음 형제에서 키를 빌렸습니다`,
      tree: this.cloneTree(),
    });
  }

  private merge(node: BTreeNode, idx: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx + 1];

    child.keys.push(node.keys[idx]);
    child.keys = child.keys.concat(sibling.keys);

    if (!child.isLeaf) {
      child.children = child.children.concat(sibling.children);
    }

    node.keys.splice(idx, 1);
    node.children.splice(idx + 1, 1);

    this.steps.push({
      type: 'merge',
      description: `노드를 병합했습니다`,
      tree: this.cloneTree(),
    });
  }

  private cloneTree(): BTreeNode | null {
    return this.cloneNode(this.root);
  }

  private cloneNode(node: BTreeNode | null): BTreeNode | null {
    if (node === null) return null;
    return {
      keys: [...node.keys],
      children: node.children.map(child => this.cloneNode(child)!),
      isLeaf: node.isLeaf,
    };
  }

  toArray(): number[] {
    const result: number[] = [];
    this.inorder(this.root, result);
    return result;
  }

  private inorder(node: BTreeNode | null, result: number[]): void {
    if (node !== null) {
      let i = 0;
      for (; i < node.keys.length; i++) {
        if (!node.isLeaf && i < node.children.length) {
          this.inorder(node.children[i], result);
        }
        result.push(node.keys[i]);
      }
      if (!node.isLeaf && i < node.children.length) {
        this.inorder(node.children[i], result);
      }
    }
  }
}
