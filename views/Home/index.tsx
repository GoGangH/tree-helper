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
      <Announcement version="2025-12-08-v3" title="🎉 대규모 업데이트">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              ✨ 주요 업데이트 내용
            </h3>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-2 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              삽입-삭제 연계 문제 추가! 🆕
            </h4>
            <div className="space-y-2 text-sm text-orange-800 dark:text-orange-200">
              <div className="bg-white/50 dark:bg-zinc-900/50 rounded p-2 border-l-2 border-orange-500">
                <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
                  새로운 학습 방식:
                </p>
                <ul className="text-xs space-y-0.5">
                  <li>• 1단계: 삽입 문제를 먼저 풀이</li>
                  <li>• 정답을 맞추면 자동으로 2단계로 이동</li>
                  <li>• 2단계: 삽입한 트리에서 삭제 문제 풀이</li>
                  <li>• 정답 보기 버튼으로 언제든 정답 확인 가능</li>
                  <li>• 시뮬레이션 버튼으로 각 단계별 확인</li>
                </ul>
              </div>
              <p className="font-semibold text-orange-700 dark:text-orange-300 pt-1">
                → 실전처럼 삽입과 삭제를 연속으로 연습하세요! 🎯
              </p>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              B-트리 / B+트리 삭제 알고리즘 완전 재작성 ✅
            </h4>
            <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
              <div className="bg-white/50 dark:bg-zinc-900/50 rounded p-2 border-l-2 border-red-400">
                <p className="font-semibold text-red-700 dark:text-red-400 mb-1">
                  기존 문제점:
                </p>
                <ul className="text-xs space-y-0.5">
                  <li>• 삭제 시 언더플로우 체크가 전혀 없어 트리 조건 위반</li>
                  <li>• 병합/재분배 로직이 제대로 작동하지 않음</li>
                  <li>• 빈 노드 발생 시 처리 오류로 구조 파괴</li>
                  <li>• B+트리에서 부모 키 업데이트가 잘못됨</li>
                </ul>
              </div>
              <div className="bg-white/50 dark:bg-zinc-900/50 rounded p-2 border-l-2 border-green-500">
                <p className="font-semibold text-green-700 dark:text-green-400 mb-1">
                  개선 내용:
                </p>
                <ul className="text-xs space-y-0.5">
                  <li>• 표준 삭제 알고리즘 구현 (삭제 → 언더플로우 체크 → 재분배/병합)</li>
                  <li>• 언더플로우 재귀 전파로 모든 노드 조건 유지</li>
                  <li>• Best Sibling 선택: 키가 많은 형제 우선, 같으면 왼쪽 우선</li>
                  <li>• B+트리 라우팅 조건(≤)에 맞는 정확한 부모 키 업데이트</li>
                  <li>• 병합 시각화 개선: 중복 단계 제거, 명확한 설명 추가</li>
                  <li>• 불필요한 탐색 경로 시각화 제거로 가독성 향상</li>
                </ul>
              </div>
              <p className="font-semibold text-green-700 dark:text-green-300 pt-1">
                → 이제 B-트리/B+트리 삭제가 정확하게 작동합니다! 🎉
              </p>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              BST / AVL 삭제 로직 개선 완료 ✅
            </h4>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <div className="bg-white/50 dark:bg-zinc-900/50 rounded p-2 border-l-2 border-green-500">
                <p className="font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  개선 내용:
                </p>
                <ul className="text-xs space-y-0.5">
                  <li>• 서브트리 높이 비교하여 더 높은 쪽에서 후계자 선택</li>
                  <li>• 높이가 같으면 노드 개수가 많은 쪽 선택</li>
                  <li>• 모두 같으면 왼쪽 우선으로 균형 유지</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              모바일 최적화 📱
            </h4>
            <ul className="space-y-1 text-sm text-purple-800 dark:text-purple-200">
              <li>• 터치 드래그로 캔버스 자유롭게 이동</li>
              <li>• 반응형 UI: 화면 크기에 맞는 자동 레이아웃</li>
              <li>• Safe Area 지원: 노치/섬 영역 고려</li>
              <li>• 토글 메뉴로 작은 화면에서도 쾌적한 사용</li>
            </ul>
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
