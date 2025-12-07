"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputPanel from "@/components/InputPanel";
import TreeVisualization from "@/components/TreeVisualization";
import Announcement from "@/components/Announcement";
import { Command, OperationStep, TreeType } from "@/lib/types";
import { BST } from "@/lib/bst";
import { AVL } from "@/lib/avl";
import { BTree } from "@/lib/btree";
import { BPlusTree } from "@/lib/bplustree";

export default function HomeView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [treeType, setTreeType] = useState<TreeType>("BST");
  const [treeOrder, setTreeOrder] = useState(3); // B-트리, B+ 트리 차수
  const [steps, setSteps] = useState<OperationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [initialCommands, setInitialCommands] = useState<Command[] | null>(
    null
  );
  const [skipInsertCount, setSkipInsertCount] = useState<number | null>(null);
  const [showInputPanel, setShowInputPanel] = useState(true); // 모바일에서 패널 토글

  // 현재 실행 중인 명령 인덱스 계산
  const currentCommandIndex = useMemo(() => {
    if (steps.length === 0 || currentStepIndex < 0) return -1;

    // 모든 complete 스텝의 인덱스를 찾음 (각 명령의 끝)
    const completeIndices: number[] = [];
    for (let i = 0; i < steps.length; i++) {
      if (steps[i]?.type === 'complete') {
        completeIndices.push(i);
      }
    }

    // 현재 스텝이 몇 번째 명령에 속하는지 찾기
    // 첫 번째 complete 이전이면 0번째 명령, 두 번째 complete 이전이면 1번째 명령...
    for (let i = 0; i < completeIndices.length; i++) {
      if (currentStepIndex < completeIndices[i]) {
        return i; // i번째 명령 실행 중
      }
    }

    // 마지막 complete 스텝에 도달했거나 넘어선 경우
    return completeIndices.length > 0 ? completeIndices.length - 1 : -1;
  }, [steps, currentStepIndex]);

  // 쿼리 파라미터에서 명령어 로드
  useEffect(() => {
    const commandsParam = searchParams.get("commands");
    const treeTypeParam = searchParams.get("treeType");
    const treeOrderParam = searchParams.get("treeOrder");

    if (commandsParam) {
      // "i 30,d 45,20" 형식 파싱 (i/d가 없으면 자동으로 insert)
      const parts = commandsParam.split(",").map((s) => s.trim());
      const commands: Command[] = [];

      for (const part of parts) {
        // i/d가 있는 경우
        const matchWithPrefix = part.match(/^([di])\s+(\d+)$/i);
        if (matchWithPrefix) {
          const operation =
            matchWithPrefix[1].toLowerCase() === "i" ? "insert" : "delete";
          const value = parseInt(matchWithPrefix[2]);
          commands.push({ type: operation, value });
          continue;
        }

        // 숫자만 있는 경우 (자동으로 insert)
        const matchNumberOnly = part.match(/^(\d+)$/);
        if (matchNumberOnly) {
          const value = parseInt(matchNumberOnly[1]);
          commands.push({ type: "insert", value });
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

    const skipInsertCountParam = searchParams.get("skipInsertCount");
    if (skipInsertCountParam) {
      const count = parseInt(skipInsertCountParam);
      if (!isNaN(count)) {
        setSkipInsertCount(count);
      }
    }
  }, [searchParams]);

  const handleCommandsSubmit = (commands: Command[]) => {
    let tree: BST | AVL | BTree | BPlusTree;
    let allSteps: OperationStep[] = [];

    // 트리 타입에 따라 적절한 트리 생성
    switch (treeType) {
      case "BST":
        tree = new BST();
        break;
      case "AVL":
        tree = new AVL();
        break;
      case "BTree":
        tree = new BTree(treeOrder);
        break;
      case "BPlusTree":
        tree = new BPlusTree(treeOrder);
        break;
    }

    // 초기 상태 스텝 추가
    allSteps.push({
      type: "highlight",
      description: "시작: 빈 트리",
      tree: null,
    });

    // 각 명령 실행 및 insert 명령 완료 지점 추적
    let insertCommandCount = 0;
    let skipToStepIndex = 0;

    commands.forEach((command) => {
      if (command.type === "insert") {
        const insertSteps = tree.insert(command.value);
        allSteps = [...allSteps, ...insertSteps];
        insertCommandCount++;

        // skipInsertCount번째 insert 명령이 완료된 지점 기록
        if (
          skipInsertCount !== null &&
          insertCommandCount === skipInsertCount
        ) {
          skipToStepIndex = allSteps.length - 1;
        }
      } else if (command.type === "delete") {
        const deleteSteps = tree.delete(command.value);
        allSteps = [...allSteps, ...deleteSteps];
      }
    });

    setSteps(allSteps);

    // skipInsertCount가 설정되어 있으면 해당 지점으로 이동, 아니면 처음부터 시작
    if (skipInsertCount !== null && skipToStepIndex > 0) {
      setCurrentStepIndex(skipToStepIndex);
      setSkipInsertCount(null); // 한 번만 적용되도록 리셋
    } else {
      setCurrentStepIndex(0);
    }
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

  const handleSkipToEnd = () => {
    if (steps.length > 0) {
      setCurrentStepIndex(steps.length - 1);
    }
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
    <>
      {/* 공지사항 */}
      <Announcement version="2024-12-07-v2" title="🎉 업데이트 소식">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              ✨ 주요 업데이트 내용
            </h3>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              BST / AVL 삭제 로직 개선 완료 ✅
            </h4>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <div className="bg-white/50 dark:bg-zinc-900/50 rounded p-2 border-l-2 border-red-400">
                <p className="font-semibold text-red-700 dark:text-red-400 mb-1">기존 문제점:</p>
                <p className="text-xs">• 항상 오른쪽 서브트리에서만 후계자를 선택하여 트리가 불균형해지는 문제</p>
              </div>
              <div className="bg-white/50 dark:bg-zinc-900/50 rounded p-2 border-l-2 border-green-500">
                <p className="font-semibold text-green-700 dark:text-green-400 mb-1">개선 내용:</p>
                <ul className="text-xs space-y-0.5">
                  <li>• 서브트리 높이를 비교하여 더 높은 쪽에서 노드 선택</li>
                  <li>• 높이가 같으면 노드 개수가 많은 쪽 선택</li>
                  <li>• 모두 같으면 왼쪽 우선으로 균형 유지</li>
                </ul>
              </div>
              <p className="font-semibold text-green-700 dark:text-green-300 pt-1">→ 이제 BST/AVL 삭제 기능을 안전하게 사용하실 수 있습니다! 🎉</p>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 dark:border-yellow-800 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              B-트리 / B+ 트리 알림 ⚠️
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              삭제 로직에서 에러가 발생하여 현재 수정 중입니다. 빠른 시일 내에 해결하겠습니다.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              모바일 지원 📱
            </h4>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>• 터치 드래그로 캔버스 이동 가능</li>
              <li>• 아이콘 버튼으로 공간 절약</li>
              <li>• 자동 스케일 조정</li>
              <li>• 토글 메뉴로 효율적인 화면 구성</li>
            </ul>
            <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 mt-2">
              → 이제 모바일에서도 편리하게 사용하세요! 📱
            </p>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <p>문제가 있으시면 언제든지 피드백 부탁드립니다. 😊</p>
          </div>
        </div>
      </Announcement>

      <div className="flex flex-col lg:flex-row h-screen w-full bg-zinc-100 dark:bg-zinc-950">
        {/* 모바일 토글 버튼 */}
      <button
        onClick={() => setShowInputPanel(!showInputPanel)}
        className="lg:hidden fixed right-4 z-50 p-3 text-white rounded-full shadow-lg transition-colors"
      >
        {showInputPanel ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        )}
      </button>

      {/* 왼쪽: 입력 패널 */}
      <div
        className={`
        ${showInputPanel ? "flex" : "hidden"}
        lg:flex
        w-full lg:w-96
        h-1/2 lg:h-full
        shrink-0
        fixed lg:relative
        z-40
        lg:z-auto
        inset-0 lg:inset-auto
        bg-white dark:bg-zinc-900 rounded-b-lg flex-col lg:flex-col-reverse lg:rounded-b-none

      `}
      >
        {/* 네비게이션 버튼 */}

        <div className="flex-1 overflow-hidden border-b lg:border-none border-zinc-200 dark:border-zinc-800 ">
          <InputPanel
            onCommandsSubmit={(commands) => {
              handleCommandsSubmit(commands);
              setShowInputPanel(false); // 모바일에서 시작 시 패널 닫기
            }}
            treeType={treeType}
            onTreeTypeChange={handleTreeTypeChange}
            treeOrder={treeOrder}
            onTreeOrderChange={handleTreeOrderChange}
            initialCommands={initialCommands}
            currentCommandIndex={currentCommandIndex}
          />
        </div>
        <div className="p-4 border-r border-zinc-200 dark:border-zinc-800">
          <button
            onClick={() => router.push("/practice")}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            📝 연습 모드
          </button>
        </div>
      </div>

      {/* 오른쪽: 시각화 영역 */}
      <div className="flex-1 h-full w-full">
        {steps.length > 0 ? (
          <TreeVisualization
            steps={steps}
            currentStepIndex={currentStepIndex}
            treeType={treeType}
            onNextStep={handleNextStep}
            onPrevStep={handlePrevStep}
            onReset={handleReset}
            onSkipToEnd={handleSkipToEnd}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
            <div className="text-center max-w-md">
              <div className="mb-4 text-4xl lg:text-6xl">🌳</div>
              <h2 className="text-xl lg:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                트리 시각화 도구에 오신 것을 환영합니다
              </h2>
              <p className="text-sm lg:text-base text-zinc-600 dark:text-zinc-400">
                <span className="lg:hidden">상단 메뉴를 열어서</span>
                <span className="hidden lg:inline">왼쪽 패널에서</span> 트리
                타입을 선택하고 명령을 추가한 후 시작하기 버튼을 눌러주세요
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
