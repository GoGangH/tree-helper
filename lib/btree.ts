import { BTreeNode, OperationStep } from './types';

export class BTree {
  root: BTreeNode | null = null;
  steps: OperationStep[] = [];
  readonly minDegree: number; // 최소 차수 (t)

  constructor(minDegree: number = 3) {
    this.minDegree = minDegree;
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

  private insertNonFull(node: BTreeNode, value: number): void {
    let i = node.keys.length - 1;

    if (node.isLeaf) {
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

  private splitChild(parent: BTreeNode, index: number): void {
    const fullChild = parent.children[index];
    const newChild = this.createNode(fullChild.isLeaf);

    const mid = this.minDegree - 1;

    // 중간 키를 부모로 올림
    parent.keys.splice(index, 0, fullChild.keys[mid]);

    // 새 자식에 오른쪽 절반의 키를 복사
    newChild.keys = fullChild.keys.splice(mid + 1);
    fullChild.keys.splice(mid, 1);

    // 내부 노드인 경우 자식도 분할
    if (!fullChild.isLeaf) {
      newChild.children = fullChild.children.splice(this.minDegree);
    }

    // 부모의 자식 배열에 새 자식 삽입
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
      const isInLastChild = idx === node.keys.length;

      this.steps.push({
        type: 'highlight',
        description: `자식 노드로 이동합니다`,
        tree: this.cloneTree(),
      });

      if (node.children[idx].keys.length < this.minDegree) {
        this.fill(node, idx);
      }

      if (isInLastChild && idx > node.keys.length) {
        this.deleteKey(node.children[idx - 1], value);
      } else {
        this.deleteKey(node.children[idx], value);
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

    if (node.children[idx].keys.length >= this.minDegree) {
      const pred = this.getPredecessor(node, idx);
      node.keys[idx] = pred;
      this.steps.push({
        type: 'highlight',
        description: `${key}를 선행자 ${pred}로 대체합니다`,
        tree: this.cloneTree(),
      });
      this.deleteKey(node.children[idx], pred);
    } else if (node.children[idx + 1].keys.length >= this.minDegree) {
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
    if (idx !== 0 && node.children[idx - 1].keys.length >= this.minDegree) {
      this.borrowFromPrev(node, idx);
    } else if (idx !== node.keys.length && node.children[idx + 1].keys.length >= this.minDegree) {
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
