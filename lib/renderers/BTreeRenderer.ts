import { BTreeNode } from '../types';
import { TREE_CONSTANTS, COLORS } from '../constants';

export class BTreeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    node: BTreeNode | null,
    highlights: number[]
  ): void {
    if (!node) return;

    // 자식 노드와의 연결선 그리기
    if (!node.isLeaf && node.children.length > 0) {
      node.children.forEach((child) => {
        if (node.x !== undefined && node.y !== undefined && child.x !== undefined && child.y !== undefined) {
          this.drawLine(
            ctx,
            node.x,
            node.y + TREE_CONSTANTS.BTREE_NODE_HEIGHT / 2,
            child.x,
            child.y - TREE_CONSTANTS.BTREE_NODE_HEIGHT / 2
          );
        }
        this.render(ctx, child, highlights);
      });
    }

    // 노드 그리기
    if (node.x !== undefined && node.y !== undefined) {
      this.drawNode(ctx, node, highlights);
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
    highlights: number[]
  ): void {
    const x = node.x!;
    const y = node.y!;
    const nodeWidth = TREE_CONSTANTS.BTREE_NODE_WIDTH * node.keys.length;
    const startX = x - nodeWidth / 2;

    node.keys.forEach((key, index) => {
      const keyX = startX + index * TREE_CONSTANTS.BTREE_NODE_WIDTH;
      const isHighlighted = highlights.includes(key);

      this.drawKeyBox(ctx, keyX, y, key, isHighlighted);
    });
  }

  private drawKeyBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    key: number,
    isHighlighted: boolean
  ): void {
    const boxY = y - TREE_CONSTANTS.BTREE_NODE_HEIGHT / 2;

    // 박스 그리기
    ctx.fillStyle = isHighlighted ? COLORS.NODE_HIGHLIGHTED : COLORS.NODE_DEFAULT;
    ctx.fillRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);

    ctx.strokeStyle = isHighlighted ? COLORS.NODE_BORDER_HIGHLIGHTED : COLORS.NODE_BORDER;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, boxY, TREE_CONSTANTS.BTREE_NODE_WIDTH, TREE_CONSTANTS.BTREE_NODE_HEIGHT);

    // 키 값 표시
    ctx.fillStyle = isHighlighted ? COLORS.TEXT_HIGHLIGHTED : COLORS.TEXT_DEFAULT;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(key.toString(), x + TREE_CONSTANTS.BTREE_NODE_WIDTH / 2, y);
  }
}
