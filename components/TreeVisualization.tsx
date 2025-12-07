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
  const [isMobile, setIsMobile] = useState(false);

  // 모바일 감지 및 초기 스케일 설정
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setScale(0.6);
        setOffset({ x: 0, y: 50 });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-2 lg:p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 lg:gap-0 lg:mb-4">
          <div className="flex items-center gap-1 lg:gap-4 overflow-x-auto pb-1">
            <button
              onClick={onPrevStep}
              disabled={currentStepIndex <= 0}
              className="flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-base bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-zinc-900 dark:text-zinc-100"
              title="이전 단계"
            >
              <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden lg:inline">이전</span>
            </button>
            <button
              onClick={onNextStep}
              disabled={currentStepIndex >= steps.length - 1}
              className="flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-base bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              title="다음 단계"
            >
              <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="hidden lg:inline">다음</span>
            </button>
            <button
              onClick={onSkipToEnd}
              disabled={currentStepIndex >= steps.length - 1}
              className="flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-base bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              title="최종 결과"
            >
              <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
              <span className="hidden lg:inline">최종 결과</span>
            </button>
            <button
              onClick={onReset}
              className="flex items-center justify-center px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-base bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              title="리셋"
            >
              <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="hidden lg:inline">리셋</span>
            </button>
          </div>
          <div className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 text-center lg:text-right">
            {currentStepIndex + 1} / {steps.length}
          </div>
        </div>

        {/* 현재 단계 설명 */}
        {currentStep && (
          <div className="p-2 lg:p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg mb-2 lg:mb-0">
            <p className="text-xs lg:text-sm font-medium text-blue-900 dark:text-blue-100">
              {currentStep.description}
            </p>
          </div>
        )}

        {/* 줌 컨트롤 */}
        <div className="flex items-center gap-1 lg:gap-2 mt-2 lg:mt-4">
          <button
            onClick={() => setScale(Math.max(0.3, scale - 0.1))}
            className="flex items-center justify-center px-2 lg:px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-xs lg:text-sm text-zinc-900 dark:text-zinc-100"
            title="축소"
          >
            <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
            <span className="hidden lg:inline">축소</span>
          </button>
          <span className="text-xs lg:text-sm text-zinc-600 dark:text-zinc-400 min-w-[45px] lg:min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(2, scale + 0.1))}
            className="flex items-center justify-center px-2 lg:px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-xs lg:text-sm text-zinc-900 dark:text-zinc-100"
            title="확대"
          >
            <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            <span className="hidden lg:inline">확대</span>
          </button>
          <button
            onClick={() => { setScale(isMobile ? 0.6 : 1); setOffset({ x: 0, y: isMobile ? 50 : 100 }); }}
            className="flex items-center justify-center px-2 lg:px-3 py-1 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded text-xs lg:text-sm text-zinc-900 dark:text-zinc-100"
            title="초기화"
          >
            <svg className="w-4 h-4 lg:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            <span className="hidden lg:inline">초기화</span>
          </button>
        </div>
      </div>

      {/* 캔버스 */}
      <div className="flex-1 relative overflow-hidden touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onWheel={handleWheel}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            setIsDragging(true);
            setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            if (!isDragging) return;
            const touch = e.touches[0];
            setOffset({
              x: touch.clientX - dragStart.x,
              y: touch.clientY - dragStart.y,
            });
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
        />
      </div>
    </div>
  );
}
