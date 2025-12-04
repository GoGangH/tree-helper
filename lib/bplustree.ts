import { BPlusTreeNode, OperationStep } from './types';

export class BPlusTree {
  root: BPlusTreeNode | null = null;
  steps: OperationStep[] = [];
  readonly minDegree: number;

  constructor(minDegree: number = 3) {
    this.minDegree = minDegree;
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
      if (this.root.keys.length === 2 * this.minDegree - 1) {
        this.steps.push({
          type: 'split',
          description: `루트가 가득 찼습니다. 분할을 수행합니다`,
          tree: this.cloneTree(),
        });

        const newRoot = this.createNode(false);
        newRoot.children.push(this.root);
        this.splitChild(newRoot, 0);
        this.root = newRoot;

        this.steps.push({
          type: 'split',
          description: `새로운 루트를 생성했습니다`,
          tree: this.cloneTree(),
        });
      }
      this.insertNonFull(this.root, value);
    }

    this.steps.push({
      type: 'complete',
      description: `${value} 삽입 완료`,
      tree: this.cloneTree(),
    });

    return this.steps;
  }

  private insertNonFull(node: BPlusTreeNode, value: number): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
      // 리프 노드에 삽입
      node.keys.push(0);
      while (i >= 0 && value < node.keys[i]) {
        node.keys[i + 1] = node.keys[i];
        i--;
      }
      node.keys[i + 1] = value;

      this.steps.push({
        type: 'insert',
        description: `리프 노드에 ${value}를 삽입했습니다`,
        tree: this.cloneTree(),
      });
    } else {
      // 적절한 자식 찾기
      while (i >= 0 && value < node.keys[i]) {
        i--;
      }
      i++;

      this.steps.push({
        type: 'highlight',
        description: `자식 노드 ${i}로 이동합니다`,
        tree: this.cloneTree(),
      });

      if (node.children[i].keys.length === 2 * this.minDegree - 1) {
        this.steps.push({
          type: 'split',
          description: `자식 노드가 가득 찼습니다. 분할을 수행합니다`,
          tree: this.cloneTree(),
        });

        this.splitChild(node, i);

        if (value > node.keys[i]) {
          i++;
        }
      }
      this.insertNonFull(node.children[i], value);
    }
  }

  private splitChild(parent: BPlusTreeNode, index: number): void {
    const fullChild = parent.children[index];
    const newChild = this.createNode(fullChild.isLeaf);

    const mid = this.minDegree - 1;

    if (fullChild.isLeaf) {
      // B+ 트리의 경우 리프 노드는 중간 키를 유지
      parent.keys.splice(index, 0, fullChild.keys[mid]);

      // 새 자식에 중간부터 끝까지 복사
      newChild.keys = fullChild.keys.splice(mid);

      // 리프 노드 연결
      newChild.next = fullChild.next;
      fullChild.next = newChild;
    } else {
      // 내부 노드는 B-트리와 동일
      parent.keys.splice(index, 0, fullChild.keys[mid]);
      newChild.keys = fullChild.keys.splice(mid + 1);
      fullChild.keys.splice(mid, 1);
      newChild.children = fullChild.children.splice(this.minDegree);
    }

    parent.children.splice(index + 1, 0, newChild);

    this.steps.push({
      type: 'split',
      description: `노드 분할 완료`,
      tree: this.cloneTree(),
    });
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

      if (node.children[childIdx].keys.length < this.minDegree) {
        this.fill(node, childIdx);
      }

      if (childIdx < node.children.length) {
        this.deleteKey(node.children[childIdx], value);
      }
    }
  }

  private fill(node: BPlusTreeNode, idx: number): void {
    // 이전 형제에서 빌릴 수 있는지 확인
    if (idx !== 0 && node.children[idx - 1].keys.length >= this.minDegree) {
      this.borrowFromPrev(node, idx);
    }
    // 다음 형제에서 빌릴 수 있는지 확인
    else if (idx !== node.keys.length && node.children[idx + 1].keys.length >= this.minDegree) {
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
