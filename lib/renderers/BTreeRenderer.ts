import { BTreeNode } from '../types';
import { TREE_CONSTANTS, COLORS } from '../constants';

export class BTreeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    node: BTreeNode | null,
    highlights: number[],
    overflows: number[] = []
  ): void {
    if (!node) return;

    // 자식 노드와의 연결선 그리기
    if (!node.isLeaf && node.children.length > 0) {
      const nodeWidth = TREE_CONSTANTS.BTREE_NODE_WIDTH * node.keys.length;
      const startX = node.x! - nodeWidth / 2;

      node.children.forEach((child, childIndex) => {
        if (node.x !== undefined && node.y !== undefined && child.x !== undefined && child.y !== undefined) {
          // 각 자식은 키들 사이의 경계에 연결
          // childIndex 0은 맨 왼쪽, childIndex n은 맨 오른쪽
          let parentConnectionX: number;

          if (childIndex === 0) {
            // 첫 번째 자식: 맨 왼쪽 경계
            parentConnectionX = startX;
          } else if (childIndex === node.keys.length) {
            // 마지막 자식: 맨 오른쪽 경계
            parentConnectionX = startX + nodeWidth;
          } else {
            // 중간 자식: 해당 키의 왼쪽 경계
            parentConnectionX = startX + childIndex * TREE_CONSTANTS.BTREE_NODE_WIDTH;
          }

          this.drawLine(
            ctx,
            parentConnectionX,
            node.y + TREE_CONSTANTS.BTREE_NODE_HEIGHT / 2,
            child.x,
            child.y - TREE_CONSTANTS.BTREE_NODE_HEIGHT / 2
          );
        }
        this.render(ctx, child, highlights, overflows);
      });
    }

    // 노드 그리기
    if (node.x !== undefined && node.y !== undefined) {
      this.drawNode(ctx, node, highlights, overflows);
    }
  }

  private drawLine(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    ctx.strokeStyle = COLORS.EDGE_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  private drawNode(
    ctx: CanvasRenderingContext2D,
    node: BTreeNode,
    highlights: number[],
    overflows: number[]
  ): void {
    const x = node.x!;
    const y = node.y!;
    const nodeWidth = TREE_CONSTANTS.BTREE_NODE_WIDTH * node.keys.length;
    const startX = x - nodeWidth / 2;

    node.keys.forEach((key, index) => {
      const keyX = startX + index * TREE_CONSTANTS.BTREE_NODE_WIDTH;
      const isHighlighted = highlights.includes(key);
      const isOverflow = overflows.includes(key);

      this.drawKeyBox(ctx, keyX, y, key, isHighlighted, isOverflow);
    });
  }

  private drawKeyBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    key: number,
    isHighlighted: boolean,
    isOverflow: boolean
  ): void {
    const boxY = y - TREE_CONSTANTS.BTREE_NODE_HEIGHT / 2;

    // 박스 그리기
    if (isOverflow) {
      // 오버플로우 노드는 빨간색
      ctx.fillStyle = '#fee2e2'; // 연한 빨강
      ctx.fillRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);
      ctx.strokeStyle = '#dc2626'; // 진한 빨강
      ctx.lineWidth = 3;
      ctx.strokeRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);
    } else if (isHighlighted) {
      ctx.fillStyle = COLORS.NODE_HIGHLIGHTED;
      ctx.fillRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);
      ctx.strokeStyle = COLORS.NODE_BORDER_HIGHLIGHTED;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);
    } else {
      ctx.fillStyle = COLORS.NODE_DEFAULT;
      ctx.fillRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);
      ctx.strokeStyle = COLORS.NODE_BORDER;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);
    }

    // 키 값 표시
    ctx.fillStyle = (isHighlighted || isOverflow) ? '#000000' : COLORS.TEXT_DEFAULT;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.toString(), x + TREE_CONSTANTS.BTREE_NODE_WIDTH / 2, y);
  }
}
