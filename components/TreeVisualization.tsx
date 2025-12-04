'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { BSTNode, BTreeNode, BPlusTreeNode, OperationStep, TreeType } from '@/lib/types';
import { calculateBSTLayout, calculateBTreeLayout, calculateBPlusTreeLayout } from '@/lib/treeLayout';
import { BSTRenderer } from '@/lib/renderers/BSTRenderer';
import { BTreeRenderer } from '@/lib/renderers/BTreeRenderer';
import { BPlusTreeRenderer } from '@/lib/renderers/BPlusTreeRenderer';

interface TreeVisualizationProps {
  steps: OperationStep[];
  currentStepIndex: number;
  treeType: TreeType;
  onNextStep: () => void;
  onPrevStep: () => void;
  onReset: () => void;
  onSkipToEnd: () => void;
}

export default function TreeVisualization({
  steps,
  currentStepIndex,
  treeType,
  onNextStep,
  onPrevStep,
  onReset,
  onSkipToEnd,
}: TreeVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const prevStepIndexRef = useRef(0);

  // 렌더러 인스턴스 생성 (메모이제이션)
  const bstRenderer = useMemo(() => new BSTRenderer('BST'), []);
  const avlRenderer = useMemo(() => new BSTRenderer('AVL'), []);
  const btreeRenderer = useMemo(() => new BTreeRenderer(), []);
  const bplusTreeRenderer = useMemo(() => new BPlusTreeRenderer(), []);

  const drawTree = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 변환 적용
    ctx.save();
    ctx.translate(canvas.width / 2 + offset.x, offset.y);
    ctx.scale(scale, scale);

    if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
      const step = steps[currentStepIndex];
      const tree = step.tree;
      const highlights = step.highlightNodes || [];
      const overflows = step.overflowNodes || [];
      const creatingValue = step.creatingValue;

      if (tree) {
        switch (treeType) {
          case 'BST':
            calculateBSTLayout(tree as BSTNode);
            bstRenderer.render(ctx, tree as BSTNode, highlights, creatingValue);
            break;

          case 'AVL':
            calculateBSTLayout(tree as BSTNode);
            avlRenderer.render(ctx, tree as BSTNode, highlights, creatingValue);
            break;

          case 'BTree':
            calculateBTreeLayout(tree as BTreeNode);
            btreeRenderer.render(ctx, tree as BTreeNode, highlights, overflows);
            break;

          case 'BPlusTree':
            calculateBPlusTreeLayout(tree as BPlusTreeNode);
            bplusTreeRenderer.render(ctx, tree as BPlusTreeNode, highlights, overflows);
            break;
        }
      }
    }

    ctx.restore();
  }, [steps, currentStepIndex, scale, offset, treeType, bstRenderer, avlRenderer, btreeRenderer, bplusTreeRenderer]);

  useEffect(() => {
    drawTree();
  }, [drawTree]);

  // 최종 단계 도달 시 토스트 표시
  useEffect(() => {
    if (
      currentStepIndex === steps.length - 1 &&
      prevStepIndexRef.current !== currentStepIndex &&
      steps.length > 1
    ) {
      toast.success('모든 단계가 완료되었습니다!', {
        duration: 3000,
        icon: '✅',
      });
    }
    prevStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex, steps.length]);

  // 마우스 드래그 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.3, Math.min(2, prev + delta)));
  };

  const currentStep = currentStepIndex >= 0 && currentStepIndex < steps.length
    ? steps[currentStepIndex]
    : null;

  return (
    <div className="w-full h-full bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* 컨트롤 패널 */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={onPrevStep}
              disabled={currentStepIndex <= 0}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-zinc-900 dark:text-zinc-100"
            >
              이전
            </button>
            <button
              onClick={onNextStep}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              다음
            </button>
            <button
              onClick={onSkipToEnd}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              최종 결과
            </button>
            <button
              onClick={onReset}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              리셋
            </button>
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            단계: {currentStepIndex + 1} / {steps.length}
          </div>
        </div>

        {/* 현재 단계 설명 */}
        {currentStep && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {currentStep.description}
            </p>
          </div>
        )}

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => setScale(Math.max(0.3, scale - 0.1))}
            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-sm text-zinc-900 dark:text-zinc-100"
          >
            축소
          </button>
          <span className="text-sm text-zinc-600 dark:text-zinc-400 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-sm text-zinc-900 dark:text-zinc-100"
          >
            확대
          </button>
          <button
            onClick={() => { setScale(1); setOffset({ x: 0, y: 100 }); }}
            className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-sm text-zinc-900 dark:text-zinc-100"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 캔버스 */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
        />
      </div>
    </div>
  );
}
