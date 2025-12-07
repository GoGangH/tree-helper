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

    this.deleteKeyRecursive(this.root, value, null, -1);

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

  private deleteKeyRecursive(node: BTreeNode, value: number, parent: BTreeNode | null, childIndex: number): void {
    const idx = node.keys.findIndex(k => k >= value);

    if (idx !== -1 && node.keys[idx] === value) {
      // Case 1 & 2: 키를 찾은 경우
      if (node.isLeaf) {
        // Case 2-①: 리프 노드에서 삭제
        this.steps.push({
          type: 'delete',
          description: `리프 노드 [${node.keys.join(',')}]에서 ${value}를 삭제합니다`,
          highlightNodes: [value],
          tree: this.cloneTree(),
        });
        node.keys.splice(idx, 1);

        // Case 2-②: 삭제 후 언더플로우 체크 (루트가 아닌 경우)
        if (parent !== null && node.keys.length < this.minKeys) {
          this.steps.push({
            type: 'highlight',
            description: `언더플로우 발생! (현재 ${node.keys.length}개 키, 최소 ${this.minKeys}개 필요)`,
            tree: this.cloneTree(),
          });
          this.fixUnderflow(parent, childIndex);
        }
      } else {
        // Case 1: 내부 노드에서 삭제 - successor와 교환
        this.deleteInternalNode(node, idx);
      }
    } else if (!node.isLeaf) {
      // 키가 없으면 자식으로 이동
      const childIdx = idx === -1 ? node.keys.length : idx;

      // 재귀적으로 자식에서 삭제
      if (childIdx < node.children.length) {
        this.deleteKeyRecursive(node.children[childIdx], value, node, childIdx);
      }

      // 재귀 호출 후 자식의 언더플로우 체크
      if (childIdx < node.children.length && node.children[childIdx].keys.length < this.minKeys) {
        this.steps.push({
          type: 'highlight',
          description: `자식 노드에서 언더플로우 발생! (현재 ${node.children[childIdx].keys.length}개 키, 최소 ${this.minKeys}개 필요)`,
          tree: this.cloneTree(),
        });
        this.fixUnderflow(node, childIdx);

        // fixUnderflow 후에 현재 노드(부모)의 언더플로우 체크 (언더플로우 전파)
        if (parent !== null && node.keys.length < this.minKeys) {
          this.steps.push({
            type: 'highlight',
            description: `병합으로 인해 부모 노드에서도 언더플로우 발생! (현재 ${node.keys.length}개 키, 최소 ${this.minKeys}개 필요)`,
            tree: this.cloneTree(),
          });
          this.fixUnderflow(parent, childIndex);
        }

        // 루트가 비어버린 경우 즉시 처리
        if (this.root && this.root.keys.length === 0 && !this.root.isLeaf && this.root.children.length > 0) {
          this.root = this.root.children[0];
          this.steps.push({
            type: 'delete',
            description: `병합으로 인해 루트가 비어 새로운 루트를 설정했습니다`,
            tree: this.cloneTree(),
          });
        }
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

    // Case 1: 내부 노드에서 삭제 - successor와 교환
    this.steps.push({
      type: 'highlight',
      description: `내부 노드에서 ${key}를 삭제하기 위해 후계자를 찾습니다`,
      highlightNodes: [key],
      tree: this.cloneTree(),
    });

    const succ = this.getSuccessor(node, idx);
    node.keys[idx] = succ;
    this.steps.push({
      type: 'highlight',
      description: `${key}를 후계자 ${succ}로 대체했습니다. 이제 리프 노드에서 ${succ}를 삭제합니다`,
      highlightNodes: [succ],
      tree: this.cloneTree(),
    });

    // 후계자는 항상 리프 노드에 있으므로, 오른쪽 자식에서 삭제
    this.deleteKeyRecursive(node.children[idx + 1], succ, node, idx + 1);
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

  private fixUnderflow(parent: BTreeNode, childIdx: number): void {
    // Best Sibling 선택: 키 개수가 많은 형제 우선, 같으면 왼쪽
    const bestSib = this.getBestSibling(parent, childIdx);

    if (parent.children[bestSib].keys.length > this.minKeys) {
      // 키 재분배 (redistribution)
      if (bestSib < childIdx) {
        this.borrowFromPrev(parent, childIdx);
      } else {
        this.borrowFromNext(parent, childIdx);
      }
    } else {
      // 노드 합병 (merge)
      if (bestSib < childIdx) {
        // 왼쪽 형제와 합병
        this.merge(parent, bestSib);
      } else {
        // 오른쪽 형제와 합병 (현재 노드가 왼쪽이 됨)
        this.merge(parent, childIdx);
      }
    }
  }

  // C++의 __best_sibling 함수와 동일한 로직
  private getBestSibling(node: BTreeNode, idx: number): number {
    // idx 위치의 자식에 대해 가장 좋은 형제를 선택

    // 맨 왼쪽 자식이면 오른쪽 형제만 가능
    if (idx === 0) {
      return idx + 1;
    }

    // 맨 오른쪽 자식이면 왼쪽 형제만 가능
    if (idx === node.keys.length) {
      return idx - 1;
    }

    // 중간에 있으면 크기가 큰 형제를 선택
    const leftSibSize = node.children[idx - 1].keys.length;
    const rightSibSize = node.children[idx + 1].keys.length;

    if (leftSibSize >= rightSibSize) {
      return idx - 1;
    } else {
      return idx + 1;
    }
  }

  private borrowFromPrev(node: BTreeNode, childIdx: number): void {
    const child = node.children[childIdx];
    const sibling = node.children[childIdx - 1];

    // 왼쪽 형제에서 키 빌려오기
    const borrowedKey = sibling.keys.pop()!;
    const parentKey = node.keys[childIdx - 1];

    // 부모의 중간값을 자식으로 내리고, 형제의 키를 부모로 올림
    child.keys.unshift(parentKey);
    node.keys[childIdx - 1] = borrowedKey;

    if (!child.isLeaf) {
      child.children.unshift(sibling.children.pop()!);
    }

    this.steps.push({
      type: 'highlight',
      description: `왼쪽 형제 [${sibling.keys.join(',')}]에서 ${borrowedKey}를 빌려와 부모의 ${parentKey}와 교환했습니다`,
      highlightNodes: [borrowedKey],
      tree: this.cloneTree(),
    });
  }

  private borrowFromNext(node: BTreeNode, childIdx: number): void {
    const child = node.children[childIdx];
    const sibling = node.children[childIdx + 1];

    // 오른쪽 형제에서 키 빌려오기
    const borrowedKey = sibling.keys.shift()!;
    const parentKey = node.keys[childIdx];

    // 부모의 중간값을 자식으로 내리고, 형제의 키를 부모로 올림
    child.keys.push(parentKey);
    node.keys[childIdx] = borrowedKey;

    if (!child.isLeaf) {
      child.children.push(sibling.children.shift()!);
    }

    this.steps.push({
      type: 'highlight',
      description: `오른쪽 형제 [${sibling.keys.join(',')}]에서 ${borrowedKey}를 빌려와 부모의 ${parentKey}와 교환했습니다`,
      highlightNodes: [borrowedKey],
      tree: this.cloneTree(),
    });
  }

  private merge(node: BTreeNode, idx: number): void {
    const leftChild = node.children[idx];
    const rightChild = node.children[idx + 1];
    const parentKey = node.keys[idx];

    // 병합 전 상태 저장 (설명용)
    const leftKeys = [...leftChild.keys];
    const rightKeys = [...rightChild.keys];

    // 왼쪽 노드로 병합: 부모 키 + 오른쪽 노드 키들
    leftChild.keys.push(parentKey);
    leftChild.keys = leftChild.keys.concat(rightChild.keys);

    if (!leftChild.isLeaf) {
      leftChild.children = leftChild.children.concat(rightChild.children);
    }

    // 부모에서 키와 오른쪽 자식 제거
    node.keys.splice(idx, 1);
    node.children.splice(idx + 1, 1);

    this.steps.push({
      type: 'merge',
      description: `노드 병합: [${leftKeys.join(',')}] + 부모키(${parentKey}) + [${rightKeys.join(',')}] → [${leftChild.keys.join(',')}]`,
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
