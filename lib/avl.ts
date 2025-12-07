import { AVLNode, OperationStep } from './types';

export class AVL {
  root: AVLNode | null = null;
  steps: OperationStep[] = [];

  createNode(value: number): AVLNode {
    return {
      value,
      left: null,
      right: null,
      height: 1,
      balance: 0,
    };
  }

  private getHeight(node: AVLNode | null): number {
    return node === null ? 0 : node.height;
  }

  private getBalance(node: AVLNode | null): number {
    return node === null ? 0 : this.getHeight(node.left as AVLNode | null) - this.getHeight(node.right as AVLNode | null);
  }

  private updateHeight(node: AVLNode): void {
    node.height = Math.max(this.getHeight(node.left as AVLNode | null), this.getHeight(node.right as AVLNode | null)) + 1;
    node.balance = this.getBalance(node);
  }

  private rotateRight(y: AVLNode): AVLNode {
    const x = y.left as AVLNode;
    const T2 = x.right;

    this.steps.push({
      type: 'rotate',
      description: `노드 ${y.value}에서 오른쪽 회전을 수행합니다`,
      highlightNodes: [y.value, x.value],
      tree: this.cloneTree(),
    });

    x.right = y;
    y.left = T2;

    this.updateHeight(y);
    this.updateHeight(x);

    return x;
  }

  private rotateLeft(x: AVLNode): AVLNode {
    const y = x.right as AVLNode;
    const T2 = y.left;

    this.steps.push({
      type: 'rotate',
      description: `노드 ${x.value}에서 왼쪽 회전을 수행합니다`,
      highlightNodes: [x.value, y.value],
      tree: this.cloneTree(),
    });

    y.left = x;
    x.right = T2;

    this.updateHeight(x);
    this.updateHeight(y);

    return y;
  }

  insert(value: number): OperationStep[] {
    this.steps = [];
    this.steps.push({
      type: 'highlight',
      description: `${value}를 삽입합니다`,
      highlightNodes: [value],
      tree: this.cloneTree(),
    });

    this.root = this.insertNode(this.root, value);

    this.steps.push({
      type: 'complete',
      description: `${value} 삽입 완료`,
      tree: this.cloneTree(),
    });

    return this.steps;
  }

  private insertNode(node: AVLNode | null, value: number): AVLNode {
    if (node === null) {
      // 노드 생성 단계 표시
      const newNode = this.createNode(value);
      return newNode;
    }

    if (value < node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} < ${node.value}, 왼쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.left = this.insertNode(node.left as AVLNode | null, value);
    } else if (value > node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} > ${node.value}, 오른쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.right = this.insertNode(node.right as AVLNode | null, value);
    } else {
      this.steps.push({
        type: 'highlight',
        description: `${value}는 이미 존재합니다`,
        highlightNodes: [value],
        tree: this.cloneTree(),
      });
      return node;
    }

    this.updateHeight(node);
    const balance = this.getBalance(node);

    this.steps.push({
      type: 'highlight',
      description: `노드 ${node.value}의 균형 인수: ${balance}`,
      highlightNodes: [node.value],
      tree: this.cloneTree(),
    });

    // Left Left Case
    if (balance > 1 && value < (node.left as AVLNode).value) {
      this.steps.push({
        type: 'rotate',
        description: `LL 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      return this.rotateRight(node);
    }

    // Right Right Case
    if (balance < -1 && value > (node.right as AVLNode).value) {
      this.steps.push({
        type: 'rotate',
        description: `RR 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      return this.rotateLeft(node);
    }

    // Left Right Case
    if (balance > 1 && value > (node.left as AVLNode).value) {
      this.steps.push({
        type: 'rotate',
        description: `LR 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.left = this.rotateLeft(node.left as AVLNode);
      return this.rotateRight(node);
    }

    // Right Left Case
    if (balance < -1 && value < (node.right as AVLNode).value) {
      this.steps.push({
        type: 'rotate',
        description: `RL 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.right = this.rotateRight(node.right as AVLNode);
      return this.rotateLeft(node);
    }

    return node;
  }

  delete(value: number): OperationStep[] {
    this.steps = [];
    this.steps.push({
      type: 'highlight',
      description: `${value}를 삭제합니다`,
      highlightNodes: [value],
      tree: this.cloneTree(),
    });

    this.root = this.deleteNode(this.root, value);

    this.steps.push({
      type: 'complete',
      description: `${value} 삭제 완료`,
      tree: this.cloneTree(),
    });

    return this.steps;
  }

  private deleteNode(node: AVLNode | null, value: number): AVLNode | null {
    if (node === null) {
      this.steps.push({
        type: 'highlight',
        description: `${value}를 찾을 수 없습니다`,
        tree: this.cloneTree(),
      });
      return null;
    }

    if (value < node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} < ${node.value}, 왼쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.left = this.deleteNode(node.left as AVLNode | null, value);
    } else if (value > node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} > ${node.value}, 오른쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.right = this.deleteNode(node.right as AVLNode | null, value);
    } else {
      this.steps.push({
        type: 'highlight',
        description: `${value}를 찾았습니다`,
        highlightNodes: [value],
        tree: this.cloneTree(),
      });

      if (node.left === null && node.right === null) {
        this.steps.push({
          type: 'delete',
          description: `리프 노드 ${value}를 삭제합니다`,
          tree: this.cloneTree(),
        });
        return null;
      }

      if (node.left === null) {
        this.steps.push({
          type: 'delete',
          description: `오른쪽 자식으로 ${value}를 대체합니다`,
          tree: this.cloneTree(),
        });
        return node.right as AVLNode | null;
      }
      if (node.right === null) {
        this.steps.push({
          type: 'delete',
          description: `왼쪽 자식으로 ${value}를 대체합니다`,
          tree: this.cloneTree(),
        });
        return node.left as AVLNode | null;
      }

      // 자식이 둘인 경우 - 높이/노드 개수 기반 선택
      const leftHeight = this.getHeight(node.left as AVLNode | null);
      const rightHeight = this.getHeight(node.right as AVLNode | null);

      let usePredecessor = false;

      if (leftHeight > rightHeight) {
        usePredecessor = true;
        this.steps.push({
          type: 'highlight',
          description: `왼쪽 높이(${leftHeight}) > 오른쪽 높이(${rightHeight}), 왼쪽에서 선택`,
          highlightNodes: [value],
          tree: this.cloneTree(),
        });
      } else if (leftHeight < rightHeight) {
        usePredecessor = false;
        this.steps.push({
          type: 'highlight',
          description: `오른쪽 높이(${rightHeight}) > 왼쪽 높이(${leftHeight}), 오른쪽에서 선택`,
          highlightNodes: [value],
          tree: this.cloneTree(),
        });
      } else {
        // 높이가 같으면 노드 개수 비교
        const leftCount = this.countNodes(node.left as AVLNode | null);
        const rightCount = this.countNodes(node.right as AVLNode | null);

        if (leftCount > rightCount) {
          usePredecessor = true;
          this.steps.push({
            type: 'highlight',
            description: `높이 동일, 왼쪽 노드(${leftCount}) > 오른쪽 노드(${rightCount}), 왼쪽에서 선택`,
            highlightNodes: [value],
            tree: this.cloneTree(),
          });
        } else if (leftCount < rightCount) {
          usePredecessor = false;
          this.steps.push({
            type: 'highlight',
            description: `높이 동일, 오른쪽 노드(${rightCount}) > 왼쪽 노드(${leftCount}), 오른쪽에서 선택`,
            highlightNodes: [value],
            tree: this.cloneTree(),
          });
        } else {
          // 높이와 노드 개수가 모두 같으면 왼쪽 우선
          usePredecessor = true;
          this.steps.push({
            type: 'highlight',
            description: `높이와 노드 개수 동일, 왼쪽 우선`,
            highlightNodes: [value],
            tree: this.cloneTree(),
          });
        }
      }

      if (usePredecessor) {
        const predecessor = this.findMax(node.left as AVLNode);
        this.steps.push({
          type: 'highlight',
          description: `선행자 ${predecessor.value}를 찾았습니다`,
          highlightNodes: [predecessor.value],
          tree: this.cloneTree(),
        });

        node.value = predecessor.value;
        this.steps.push({
          type: 'highlight',
          description: `${value}를 ${predecessor.value}로 대체합니다`,
          highlightNodes: [predecessor.value],
          tree: this.cloneTree(),
        });

        node.left = this.deleteNode(node.left as AVLNode | null, predecessor.value);
      } else {
        const successor = this.findMin(node.right as AVLNode);
        this.steps.push({
          type: 'highlight',
          description: `후계자 ${successor.value}를 찾았습니다`,
          highlightNodes: [successor.value],
          tree: this.cloneTree(),
        });

        node.value = successor.value;
        this.steps.push({
          type: 'highlight',
          description: `${value}를 ${successor.value}로 대체합니다`,
          highlightNodes: [successor.value],
          tree: this.cloneTree(),
        });

        node.right = this.deleteNode(node.right as AVLNode | null, successor.value);
      }
    }

    if (node === null) return null;

    this.updateHeight(node);
    const balance = this.getBalance(node);

    this.steps.push({
      type: 'highlight',
      description: `노드 ${node.value}의 균형 인수: ${balance}`,
      highlightNodes: [node.value],
      tree: this.cloneTree(),
    });

    // Left Left Case
    if (balance > 1 && this.getBalance(node.left as AVLNode | null) >= 0) {
      this.steps.push({
        type: 'rotate',
        description: `LL 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      return this.rotateRight(node);
    }

    // Left Right Case
    if (balance > 1 && this.getBalance(node.left as AVLNode | null) < 0) {
      this.steps.push({
        type: 'rotate',
        description: `LR 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.left = this.rotateLeft(node.left as AVLNode);
      return this.rotateRight(node);
    }

    // Right Right Case
    if (balance < -1 && this.getBalance(node.right as AVLNode | null) <= 0) {
      this.steps.push({
        type: 'rotate',
        description: `RR 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      return this.rotateLeft(node);
    }

    // Right Left Case
    if (balance < -1 && this.getBalance(node.right as AVLNode | null) > 0) {
      this.steps.push({
        type: 'rotate',
        description: `RL 불균형 감지 (균형: ${balance})`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.right = this.rotateRight(node.right as AVLNode);
      return this.rotateLeft(node);
    }

    return node;
  }

  private countNodes(node: AVLNode | null): number {
    if (node === null) return 0;
    return this.countNodes(node.left as AVLNode | null) + this.countNodes(node.right as AVLNode | null) + 1;
  }

  private findMin(node: AVLNode): AVLNode {
    while (node.left !== null) {
      node = node.left as AVLNode;
    }
    return node;
  }

  private findMax(node: AVLNode): AVLNode {
    while (node.right !== null) {
      node = node.right as AVLNode;
    }
    return node;
  }

  private cloneTree(): AVLNode | null {
    return this.cloneNode(this.root);
  }

  private cloneNode(node: AVLNode | null): AVLNode | null {
    if (node === null) return null;
    return {
      value: node.value,
      left: this.cloneNode(node.left as AVLNode | null),
      right: this.cloneNode(node.right as AVLNode | null),
      height: node.height,
      balance: node.balance,
    };
  }

  toArray(): number[] {
    const result: number[] = [];
    this.inorder(this.root, result);
    return result;
  }

  private inorder(node: AVLNode | null, result: number[]): void {
    if (node !== null) {
      this.inorder(node.left as AVLNode | null, result);
      result.push(node.value);
      this.inorder(node.right as AVLNode | null, result);
    }
  }
}
