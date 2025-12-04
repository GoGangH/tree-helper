import { BPlusTreeNode, OperationStep } from './types';

export class BPlusTree {
  root: BPlusTreeNode | null = null;
  steps: OperationStep[] = [];
  readonly order: number; // m (차수)

  constructor(order: number = 3) {
    this.order = order;
  }

  // 내부 노드 최대 키 개수: m - 1
  get maxInternalKeys(): number {
    return this.order - 1;
  }

  // 리프 노드 최대 키 개수: m
  get maxLeafKeys(): number {
    return this.order;
  }

  createNode(isLeaf: boolean = true): BPlusTreeNode {
    return {
      keys: [],
      children: [],
      isLeaf,
      next: null,
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

  private insertAndSplit(node: BPlusTreeNode, value: number, parent: BPlusTreeNode | null, childIndex: number): void {
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
      if (node.keys.length > this.maxLeafKeys) {
        this.steps.push({
          type: 'highlight',
          description: `오버플로우 발생! 노드를 분할합니다 (현재 ${node.keys.length}개 키, 최대 ${this.maxLeafKeys}개)`,
          overflowNodes: node.keys,
          tree: this.cloneTree(),
        });

        this.splitLeafNode(node, parent, childIndex);
      }
    } else {
      // 적절한 자식 찾기 (≤는 왼쪽, >는 오른쪽)
      let i = 0;
      while (i < node.keys.length && value > node.keys[i]) {
        i++;
      }

      this.steps.push({
        type: 'highlight',
        description: `자식 노드로 이동합니다 (${value} ${i < node.keys.length ? (value <= node.keys[i] ? '<=' : '>') : '>'} ${i < node.keys.length ? node.keys[i] : '최대값'})`,
        tree: this.cloneTree(),
      });

      // 자식에 재귀적으로 삽입
      this.insertAndSplit(node.children[i], value, node, i);

      // 재귀 호출 후, 현재 노드가 오버플로우되었는지 확인
      // (자식이 분할되어 키가 추가된 경우 발생할 수 있음)
      if (node.keys.length > this.maxInternalKeys) {
        this.steps.push({
          type: 'highlight',
          description: `내부 노드 오버플로우 발생! (현재 ${node.keys.length}개 키, 최대 ${this.maxInternalKeys}개)`,
          overflowNodes: node.keys,
          tree: this.cloneTree(),
        });

        this.splitInternalNode(node, parent, childIndex);
      }
    }
  }

  private splitLeafNode(node: BPlusTreeNode, parent: BPlusTreeNode | null, childIndex: number): void {
    const mid = Math.ceil(node.keys.length / 2);
    const newNode = this.createNode(true);

    // 분할: 중간부터 끝까지 새 노드로
    newNode.keys = node.keys.splice(mid);

    // 리프 노드 연결
    newNode.next = node.next;
    node.next = newNode;

    // 왼쪽 노드의 마지막 키를 부모로 복사 (≤ 는 왼쪽, > 는 오른쪽)
    const pushUpKey = node.keys[node.keys.length - 1];

    // 부모가 없으면 새 루트 생성
    if (parent === null) {
      const newRoot = this.createNode(false);
      newRoot.keys.push(pushUpKey);
      newRoot.children.push(node, newNode);
      this.root = newRoot;

      this.steps.push({
        type: 'split',
        description: `리프 노드 분할 완료: {${node.keys.join(',')}} | {${newNode.keys.join(',')}} (${pushUpKey}를 부모로 복사)`,
        tree: this.cloneTree(),
      });
    } else {
      // 부모에 키 삽입 (정렬된 위치 찾기)
      let insertPos = 0;
      while (insertPos < parent.keys.length && pushUpKey > parent.keys[insertPos]) {
        insertPos++;
      }

      // 키와 자식 포인터 삽입
      parent.keys.splice(insertPos, 0, pushUpKey);
      parent.children.splice(insertPos + 1, 0, newNode);

      this.steps.push({
        type: 'insert',
        description: `부모 노드에 ${pushUpKey} 추가: [${parent.keys.join(',')}]`,
        highlightNodes: [pushUpKey],
        tree: this.cloneTree(),
      });
      // 부모 오버플로우는 호출자(insertAndSplit)에서 확인
    }
  }

  private splitInternalNode(
    node: BPlusTreeNode,
    parent: BPlusTreeNode | null,
    childIndex: number
  ): void {
    const mid = Math.floor(node.keys.length / 2);
    const newNode = this.createNode(false);

    // 중간 키를 부모로 올림
    const pushUpKey = node.keys[mid];

    // 오른쪽 노드: mid+1 ~ end
    newNode.keys = node.keys.slice(mid + 1);
    newNode.children = node.children.slice(mid + 1);

    // 왼쪽 노드(원래 노드): 0 ~ mid-1
    node.keys = node.keys.slice(0, mid);
    node.children = node.children.slice(0, mid + 1);

    if (parent === null) {
      // 부모가 없으면 새 루트 생성
      const newRoot = this.createNode(false);
      newRoot.keys = [pushUpKey];
      newRoot.children = [node, newNode];
      this.root = newRoot;

      this.steps.push({
        type: 'split',
        description: `내부 노드 분할 완료: {${node.keys.join(',')}} [${pushUpKey}] {${newNode.keys.join(',')}}`,
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

  private deleteKey(node: BPlusTreeNode, value: number): void {
    const idx = node.keys.findIndex(k => k >= value);

    if (node.isLeaf) {
      // 리프 노드에서 직접 삭제
      const keyIdx = node.keys.indexOf(value);
      if (keyIdx !== -1) {
        this.steps.push({
          type: 'delete',
          description: `리프 노드에서 ${value}를 삭제합니다`,
          tree: this.cloneTree(),
        });
        node.keys.splice(keyIdx, 1);
      } else {
        this.steps.push({
          type: 'highlight',
          description: `${value}를 찾을 수 없습니다`,
          tree: this.cloneTree(),
        });
      }
    } else {
      // 내부 노드의 경우 적절한 자식으로 이동
      const childIdx = idx === -1 ? node.keys.length : idx;

      this.steps.push({
        type: 'highlight',
        description: `자식 노드로 이동합니다`,
        tree: this.cloneTree(),
      });

      const minKeys = Math.ceil(this.order / 2) - 1;
      if (node.children[childIdx].keys.length < minKeys) {
        this.fill(node, childIdx);
      }

      if (childIdx < node.children.length) {
        this.deleteKey(node.children[childIdx], value);
      }
    }
  }

  private fill(node: BPlusTreeNode, idx: number): void {
    const minKeys = Math.ceil(this.order / 2);
    // 이전 형제에서 빌릴 수 있는지 확인
    if (idx !== 0 && node.children[idx - 1].keys.length >= minKeys) {
      this.borrowFromPrev(node, idx);
    }
    // 다음 형제에서 빌릴 수 있는지 확인
    else if (idx !== node.keys.length && node.children[idx + 1].keys.length >= minKeys) {
      this.borrowFromNext(node, idx);
    }
    // 병합 수행
    else {
      if (idx !== node.keys.length) {
        this.merge(node, idx);
      } else {
        this.merge(node, idx - 1);
      }
    }
  }

  private borrowFromPrev(node: BPlusTreeNode, childIdx: number): void {
    const child = node.children[childIdx];
    const sibling = node.children[childIdx - 1];

    if (child.isLeaf) {
      child.keys.unshift(sibling.keys.pop()!);
      node.keys[childIdx - 1] = child.keys[0];
    } else {
      child.keys.unshift(node.keys[childIdx - 1]);
      node.keys[childIdx - 1] = sibling.keys.pop()!;
      child.children.unshift(sibling.children.pop()!);
    }

    this.steps.push({
      type: 'highlight',
      description: `이전 형제에서 키를 빌렸습니다`,
      tree: this.cloneTree(),
    });
  }

  private borrowFromNext(node: BPlusTreeNode, childIdx: number): void {
    const child = node.children[childIdx];
    const sibling = node.children[childIdx + 1];

    if (child.isLeaf) {
      child.keys.push(sibling.keys.shift()!);
      node.keys[childIdx] = sibling.keys[0];
    } else {
      child.keys.push(node.keys[childIdx]);
      node.keys[childIdx] = sibling.keys.shift()!;
      child.children.push(sibling.children.shift()!);
    }

    this.steps.push({
      type: 'highlight',
      description: `다음 형제에서 키를 빌렸습니다`,
      tree: this.cloneTree(),
    });
  }

  private merge(node: BPlusTreeNode, idx: number): void {
    const child = node.children[idx];
    const sibling = node.children[idx + 1];

    if (child.isLeaf) {
      // 리프 노드는 단순히 연결
      child.keys = child.keys.concat(sibling.keys);
      child.next = sibling.next;
    } else {
      // 내부 노드는 부모 키를 포함
      child.keys.push(node.keys[idx]);
      child.keys = child.keys.concat(sibling.keys);
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

  private cloneTree(): BPlusTreeNode | null {
    return this.cloneNode(this.root);
  }

  private cloneNode(node: BPlusTreeNode | null): BPlusTreeNode | null {
    if (node === null) return null;
    return {
      keys: [...node.keys],
      children: node.children.map(child => this.cloneNode(child)!),
      isLeaf: node.isLeaf,
      next: null,
    };
  }

  toArray(): number[] {
    const result: number[] = [];
    // B+ 트리는 리프 노드에만 실제 값이 있음
    let current = this.findFirstLeaf(this.root);
    while (current !== null) {
      result.push(...current.keys);
      current = current.next;
    }
    return result;
  }

  private findFirstLeaf(node: BPlusTreeNode | null): BPlusTreeNode | null {
    if (node === null) return null;
    while (!node.isLeaf) {
      node = node.children[0];
    }
    return node;
  }
}
