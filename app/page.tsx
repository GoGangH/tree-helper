'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import InputPanel from '@/components/InputPanel';
import TreeVisualization from '@/components/TreeVisualization';
import { Command, OperationStep, TreeType } from '@/lib/types';
import { BST } from '@/lib/bst';
import { AVL } from '@/lib/avl';
import { BTree } from '@/lib/btree';
import { BPlusTree } from '@/lib/bplustree';

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treeType, setTreeType] = useState<TreeType>('BST');
  const [treeOrder, setTreeOrder] = useState(3); // B-트리, B+ 트리 차수
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [initialCommands, setInitialCommands] = useState<Command[] | null>(null);

  // 쿼리 파라미터에서 명령어 로드
  useEffect(() => {
    const commandsParam = searchParams.get('commands');
    const treeTypeParam = searchParams.get('treeType');
    const treeOrderParam = searchParams.get('treeOrder');

    if (commandsParam) {
      // "i 30,d 45,i 20" 형식 파싱
      const parts = commandsParam.split(',').map(s => s.trim());
      const commands: Command[] = [];

      for (const part of parts) {
        const match = part.match(/^([di])\s+(\d+)$/i);
        if (match) {
          const operation = match[1].toLowerCase() === 'i' ? 'insert' : 'delete';
          const value = parseInt(match[2]);
          commands.push({ type: operation, value });
        }
      }

      setInitialCommands(commands);
    }

    if (treeTypeParam) {
      setTreeType(treeTypeParam as TreeType);
    }

    if (treeOrderParam) {
      setTreeOrder(parseInt(treeOrderParam));
    }
  }, [searchParams]);

  const handleCommandsSubmit = (commands: Command[]) => {
    let tree: BST | AVL | BTree | BPlusTree;
    let allSteps: OperationStep[] = [];

    // 트리 타입에 따라 적절한 트리 생성
    switch (treeType) {
      case 'BST':
        tree = new BST();
        break;
      case 'AVL':
        tree = new AVL();
        break;
      case 'BTree':
        tree = new BTree(treeOrder);
        break;
      case 'BPlusTree':
        tree = new BPlusTree(treeOrder);
        break;
    }

    // 초기 상태 스텝 추가
    allSteps.push({
      type: 'highlight',
      description: '시작: 빈 트리',
      tree: null,
    });

    // 각 명령 실행
    commands.forEach((command) => {
      if (command.type === 'insert') {
        const insertSteps = tree.insert(command.value);
        allSteps = [...allSteps, ...insertSteps];
      } else if (command.type === 'delete') {
        const deleteSteps = tree.delete(command.value);
        allSteps = [...allSteps, ...deleteSteps];
      }
    });

    setSteps(allSteps);
    setCurrentStepIndex(0);
  };

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentStepIndex(0);
  };

  const handleTreeTypeChange = (type: TreeType) => {
    setTreeType(type);
    setSteps([]);
    setCurrentStepIndex(0);
  };

  const handleTreeOrderChange = (order: number) => {
    setTreeOrder(order);
    setSteps([]);
    setCurrentStepIndex(0);
  };

  return (
    <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950">
      {/* 왼쪽: 입력 패널 */}
      <div className="w-96 h-full shrink-0 flex flex-col">
        {/* 네비게이션 버튼 */}
        <div className="bg-white dark:bg-zinc-900 p-4 border-b border-r border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => router.push('/practice')}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            📝 문제 풀이 모드
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <InputPanel
            onCommandsSubmit={handleCommandsSubmit}
            treeType={treeType}
            onTreeTypeChange={handleTreeTypeChange}
            treeOrder={treeOrder}
            onTreeOrderChange={handleTreeOrderChange}
            initialCommands={initialCommands}
          />
        </div>
      </div>

      {/* 오른쪽: 시각화 영역 */}
      <div className="flex-1 h-full">
        {steps.length > 0 ? (
          <TreeVisualization
            steps={steps}
            currentStepIndex={currentStepIndex}
            treeType={treeType}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onReset={handleReset}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <div className="text-center">
              <div className="mb-4 text-6xl">🌳</div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                트리 시각화 도구에 오신 것을 환영합니다
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                왼쪽 패널에서 트리 타입을 선택하고 명령을 추가한 후 시작하기 버튼을 눌러주세요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
