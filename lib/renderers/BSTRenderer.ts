import { BSTNode } from '../types';
import { TREE_CONSTANTS, COLORS } from '../constants';

export class BSTRenderer {
  constructor(private treeType: 'BST' | 'AVL') {}

  render(
    ctx: CanvasRenderingContext2D,
    node: BSTNode | null,
    highlights: number[],
    creatingValue?: number
  ): void {
    if (!node) return;

    // 자식 노드 먼저 그리기 (연결선이 노드 아래에 그려지도록)
    if (node.left && node.x !== undefined && node.y !== undefined && node.left.x !== undefined && node.left.y !== undefined) {
      this.drawLine(ctx, node.x, node.y, node.left.x, node.left.y);
      this.render(ctx, node.left, highlights, creatingValue);
    }

    if (node.right && node.x !== undefined && node.y !== undefined && node.right.x !== undefined && node.right.y !== undefined) {
      this.drawLine(ctx, node.x, node.y, node.right.x, node.right.y);
      this.render(ctx, node.right, highlights, creatingValue);
    }

    // 현재 노드 그리기
    if (node.x !== undefined && node.y !== undefined) {
      const isCreating = creatingValue === node.value;
      this.drawNode(ctx, node, highlights.includes(node.value), isCreating);
    }
  }

  drawCreatingNode(ctx: CanvasRenderingContext2D, x: number, y: number, value: number): void {
    // 점선으로 빈 노드 표시
    ctx.beginPath();
    ctx.arc(x, y, TREE_CONSTANTS.NODE_RADIUS, 0, 2 * Math.PI);
    ctx.strokeStyle = COLORS.NODE_HIGHLIGHTED;
    ctx.lineWidth = 3;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // "생성 중" 텍스트
    ctx.fillStyle = COLORS.NODE_HIGHLIGHTED;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('생성 중', x, y);

    // 값 표시 (위쪽)
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${value}`, x, y - TREE_CONSTANTS.NODE_RADIUS - 15);
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
    node: BSTNode,
    isHighlighted: boolean,
    isCreating: boolean = false
  ): void {
    const x = node.x!;
    const y = node.y!;

    // 원 그리기
    ctx.beginPath();
    ctx.arc(x, y, TREE_CONSTANTS.NODE_RADIUS, 0, 2 * Math.PI);

    if (isCreating) {
      // 생성 중인 노드는 점선과 반투명으로 표시
      ctx.strokeStyle = COLORS.NODE_HIGHLIGHTED;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fill();
    } else {
      ctx.fillStyle = isHighlighted ? COLORS.NODE_HIGHLIGHTED : COLORS.NODE_DEFAULT;
      ctx.fill();
      ctx.strokeStyle = isHighlighted ? COLORS.NODE_BORDER_HIGHLIGHTED : COLORS.NODE_BORDER;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 값 표시
    ctx.fillStyle = isHighlighted ? COLORS.TEXT_HIGHLIGHTED : COLORS.TEXT_DEFAULT;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.value.toString(), x, y);

    // AVL 트리인 경우 높이와 균형 인수 표시
    if (this.treeType === 'AVL' && 'height' in node && 'balance' in node) {
      ctx.fillStyle = COLORS.TEXT_SECONDARY;
      ctx.font = '10px monospace';
      ctx.fillText(`h:${node.height} b:${node.balance}`, x, y + TREE_CONSTANTS.NODE_RADIUS + 12);
    }
  }
}
