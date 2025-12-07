import { BSTNode, OperationStep } from './types';

export class BST {
  root: BSTNode | null = null;
  steps: OperationStep[] = [];

  createNode(value: number): BSTNode {
    return {
      value,
      left: null,
      right: null,
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

    this.root = this.insertNode(this.root, value);

    this.steps.push({
      type: 'complete',
      description: `${value} 삽입 완료`,
      tree: this.cloneTree(),
    });

    return this.steps;
  }

  private insertNode(node: BSTNode | null, value: number): BSTNode {
    if (node === null) {
      // 노드 생성 단계 표시
      this.steps.push({
        type: 'create',
        description: `빈 노드를 생성합니다`,
        creatingValue: value,
        tree: this.cloneTree(),
      });

      const newNode = this.createNode(value);

      this.steps.push({
        type: 'insert',
        description: `새 노드에 ${value}를 삽입했습니다`,
        node: newNode,
        highlightNodes: [value],
        tree: this.cloneTree(),
      });
      return newNode;
    }

    if (value < node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} < ${node.value}, 왼쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.left = this.insertNode(node.left, value);
    } else if (value > node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} > ${node.value}, 오른쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.right = this.insertNode(node.right, value);
    } else {
      this.steps.push({
        type: 'highlight',
        description: `${value}는 이미 존재합니다`,
        highlightNodes: [value],
        tree: this.cloneTree(),
      });
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

  private deleteNode(node: BSTNode | null, value: number): BSTNode | null {
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
      node.left = this.deleteNode(node.left, value);
    } else if (value > node.value) {
      this.steps.push({
        type: 'highlight',
        description: `${value} > ${node.value}, 오른쪽으로 이동`,
        highlightNodes: [node.value],
        tree: this.cloneTree(),
      });
      node.right = this.deleteNode(node.right, value);
    } else {
      this.steps.push({
        type: 'highlight',
        description: `${value}를 찾았습니다`,
        highlightNodes: [value],
        tree: this.cloneTree(),
      });

      // 자식이 없는 경우
      if (node.left === null && node.right === null) {
        this.steps.push({
          type: 'delete',
          description: `리프 노드 ${value}를 삭제합니다`,
          tree: this.cloneTree(),
        });
        return null;
      }

      // 자식이 하나인 경우
      if (node.left === null) {
        this.steps.push({
          type: 'delete',
          description: `오른쪽 자식으로 ${value}를 대체합니다`,
          tree: this.cloneTree(),
        });
        return node.right;
      }
      if (node.right === null) {
        this.steps.push({
          type: 'delete',
          description: `왼쪽 자식으로 ${value}를 대체합니다`,
          tree: this.cloneTree(),
        });
        return node.left;
      }

      // 자식이 둘인 경우 - 높이/노드 개수 기반 선택
      const leftHeight = this.getHeight(node.left);
      const rightHeight = this.getHeight(node.right);

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
        const leftCount = this.countNodes(node.left);
        const rightCount = this.countNodes(node.right);

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
        const predecessor = this.findMax(node.left);
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

        node.left = this.deleteNode(node.left, predecessor.value);
      } else {
        const successor = this.findMin(node.right);
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

        node.right = this.deleteNode(node.right, successor.value);
      }
    }

    return node;
  }

  private getHeight(node: BSTNode | null): number {
    if (node === null) return 0;
    return Math.max(this.getHeight(node.left), this.getHeight(node.right)) + 1;
  }

  private countNodes(node: BSTNode | null): number {
    if (node === null) return 0;
    return this.countNodes(node.left) + this.countNodes(node.right) + 1;
  }

  private findMin(node: BSTNode): BSTNode {
    while (node.left !== null) {
      node = node.left;
    }
    return node;
  }

  private findMax(node: BSTNode): BSTNode {
    while (node.right !== null) {
      node = node.right;
    }
    return node;
  }

  private cloneTree(): BSTNode | null {
    return this.cloneNode(this.root);
  }

  private cloneNode(node: BSTNode | null): BSTNode | null {
    if (node === null) return null;
    return {
      value: node.value,
      left: this.cloneNode(node.left),
      right: this.cloneNode(node.right),
    };
  }

  toArray(): number[] {
    const result: number[] = [];
    this.inorder(this.root, result);
    return result;
  }

  private inorder(node: BSTNode | null, result: number[]): void {
    if (node !== null) {
      this.inorder(node.left, result);
      result.push(node.value);
      this.inorder(node.right, result);
    }
  }
}
