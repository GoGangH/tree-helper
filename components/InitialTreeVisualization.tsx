"use client";

import { useEffect, useRef, useMemo } from "react";
import { BSTNode, BTreeNode, BPlusTreeNode, TreeType } from "@/lib/types";
import {
  calculateBSTLayout,
  calculateBTreeLayout,
  calculateBPlusTreeLayout,
} from "@/lib/treeLayout";
import { BSTRenderer } from "@/lib/renderers/BSTRenderer";
import { BTreeRenderer } from "@/lib/renderers/BTreeRenderer";
import { BPlusTreeRenderer } from "@/lib/renderers/BPlusTreeRenderer";

interface InitialTreeVisualizationProps {
  tree: BSTNode | BTreeNode | BPlusTreeNode | null;
  treeType: TreeType;
}

// 타입 가드 함수들
function isBSTNode(node: BSTNode | BTreeNode | BPlusTreeNode): node is BSTNode {
  return 'left' in node && 'right' in node;
}

function isBTreeOrBPlusNode(node: BSTNode | BTreeNode | BPlusTreeNode): node is BTreeNode | BPlusTreeNode {
  return 'children' in node && 'isLeaf' in node;
}

// 트리의 범위를 계산하는 함수
function getTreeBounds(
  node: BSTNode | BTreeNode | BPlusTreeNode,
  type: TreeType
): { minX: number; maxX: number; minY: number; maxY: number } {
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const traverse = (n: BSTNode | BTreeNode | BPlusTreeNode | null): void => {
    if (!n) return;

    if (n.x !== undefined && n.y !== undefined) {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    }

    if (type === "BST" || type === "AVL") {
      if (isBSTNode(n)) {
        if (n.left) traverse(n.left);
        if (n.right) traverse(n.right);
      }
    } else {
      if (isBTreeOrBPlusNode(n) && n.children) {
        n.children.forEach((child: BTreeNode | BPlusTreeNode) => traverse(child));
      }
    }
  };

  traverse(node);
  return { minX, maxX, minY, maxY };
}

export default function InitialTreeVisualization({
  tree,
  treeType,
}: InitialTreeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bstRenderer = useMemo(() => new BSTRenderer("BST"), []);
  const avlRenderer = useMemo(() => new BSTRenderer("AVL"), []);
  const btreeRenderer = useMemo(() => new BTreeRenderer(), []);
  const bplusTreeRenderer = useMemo(() => new BPlusTreeRenderer(), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tree) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 레이아웃 계산
    switch (treeType) {
      case "BST":
      case "AVL":
        calculateBSTLayout(tree as BSTNode);
        break;
      case "BTree":
        calculateBTreeLayout(tree as BTreeNode);
        break;
      case "BPlusTree":
        calculateBPlusTreeLayout(tree as BPlusTreeNode);
        break;
    }

    // 트리 범위 계산
    const bounds = tree ? getTreeBounds(tree, treeType) : { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const treeWidth = bounds.maxX - bounds.minX + 100; // 여백 추가
    const treeHeight = bounds.maxY - bounds.minY + 100; // 여백 추가

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = Math.max(50, Math.min(600, treeHeight)); // 최소 400, 최대 600

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 스케일 계산 (트리가 캔버스에 맞도록)
    const scaleX = canvas.width / treeWidth;
    const scaleY = canvas.height / treeHeight;
    const scale = Math.min(scaleX, scaleY, 1); // 최대 1 (확대하지 않음)

    // 변환 적용
    ctx.save();
    ctx.translate(canvas.width / 2, 50);
    ctx.scale(scale, scale);

    // 트리 렌더링
    switch (treeType) {
      case "BST":
        bstRenderer.render(ctx, tree as BSTNode, [], undefined);
        break;

      case "AVL":
        avlRenderer.render(ctx, tree as BSTNode, [], undefined);
        break;

      case "BTree":
        btreeRenderer.render(ctx, tree as BTreeNode, [], []);
        break;

      case "BPlusTree":
        bplusTreeRenderer.render(ctx, tree as BPlusTreeNode, [], []);
        break;
    }

    ctx.restore();
  }, [
    tree,
    treeType,
    bstRenderer,
    avlRenderer,
    btreeRenderer,
    bplusTreeRenderer,
  ]);

  if (!tree) return null;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <canvas ref={canvasRef} className="w-full" />
    </div>
  );
}
