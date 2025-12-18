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
  const [showInputPanel, setShowInputPanel] = useState(false); // 모바일에서 패널 토글

  // 현재 실행 중인 명령 인덱스 계산
  const currentCommandIndex = useMemo(() => {
    if (steps.length === 0 || currentStepIndex < 0) return -1;

    // 모든 complete 스텝의 인덱스를 찾음 (각 명령의 끝)
    const completeIndices: number[] = [];
    for (let i = 0; i < steps.length; i++) {
      if (steps[i]?.type === "complete") {
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
      <Announcement version="2025-12-18-v4" title="🎉 업데이트 소식">
        <div className="space-y-4">
          {/* 최신 업데이트 - 강조 */}
          <div className="bg-green-50 dark:bg-green-950/30 border-2 border-green-300 dark:border-green-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-green-600 text-white text-xs font-bold rounded">NEW</span>
                <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                  타이머 기능 추가! ⏱️
                </h3>
              </div>
              <span className="text-xs font-medium text-green-700 dark:text-green-400">
                2025-12-18
              </span>
            </div>
            <div className="space-y-2">
              <div className="bg-white/70 dark:bg-zinc-900/70 rounded p-3 border-l-4 border-green-500">
                <ul className="text-sm text-green-900 dark:text-green-100 space-y-1.5">
                  <li>• 문제 풀이 시간 측정 및 실시간 표시</li>
                  <li>• 정답 맞추면 타이머 자동 정지</li>
                  <li>• 연계 문제: 삽입/삭제 각각 별도 타이머로 측정</li>
                  <li>• 결과 모달에서 각 단계별 소요 시간 확인 가능</li>
                  <li>• 오답 시 정답 자동 노출 제거 (정답 보기 버튼 이용)</li>
                </ul>
              </div>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 pt-1">
                → 문제 풀이 속도를 체크하며 실력을 향상시키세요! ⚡
              </p>
            </div>
          </div>

          {/* 이전 업데이트 - 간단히 */}
          <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-300 dark:border-zinc-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-400 mb-3">
              이전 업데이트 내역
            </h4>
            <div className="space-y-2 text-xs text-zinc-600 dark:text-zinc-500">
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <span>• 삽입-삭제 연계 문제 추가</span>
                <span className="text-zinc-500 dark:text-zinc-600">2025-12-08</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <span>• B-트리 / B+트리 삭제 알고리즘 재작성</span>
                <span className="text-zinc-500 dark:text-zinc-600">2025-12-08</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-zinc-200 dark:border-zinc-800">
                <span>• BST / AVL 삭제 로직 개선</span>
                <span className="text-zinc-500 dark:text-zinc-600">2025-12-08</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>• 모바일 최적화</span>
                <span className="text-zinc-500 dark:text-zinc-600">2025-12-08</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-zinc-600 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <p className="font-medium mb-1">📚 알고리즘 학습에 도움이 되셨나요?</p>
            <p className="text-xs">문제나 개선사항이 있으시면 언제든지 피드백 부탁드립니다!</p>
          </div>
        </div>
      </Announcement>

      <div className="flex flex-col lg:flex-row h-screen w-full bg-zinc-100 dark:bg-zinc-950">
        {/* 모바일 토글 버튼 */}
        <button
          onClick={() => setShowInputPanel(!showInputPanel)}
          className="lg:hidden fixed right-4 z-50 p-3 text-white transition-colors"
          style={{ top: "calc(1rem + var(--safe-area-inset-top))" }}
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
        h-full
        shrink-0
        flex-col
        fixed lg:relative
        z-40
        lg:z-auto
        inset-0 lg:inset-auto
        bg-white dark:bg-zinc-900
      `}
        >
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
            onPracticeClick={() => router.push("/practice")}
          />
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
