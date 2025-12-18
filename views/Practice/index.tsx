"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TreeType } from "@/lib/types";
import {
  generateProblem,
  Problem,
  OperationType,
} from "@/lib/problemGenerator";
import InitialTreeVisualization from "@/components/InitialTreeVisualization";
import ProblemSettings from "./ProblemSettings";

export default function PracticeView() {
  const router = useRouter();
  const [treeType, setTreeType] = useState<TreeType>("BST");
  const [treeOrder, setTreeOrder] = useState(3);
  const [operationCount, setOperationCount] = useState(10);
  const [operationType, setOperationType] = useState<OperationType>("insert");
  const [initialNodeCount, setInitialNodeCount] = useState(15);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [checkResult, setCheckResult] = useState<
    "correct" | "incorrect" | null
  >(null);
  const [showSettings, setShowSettings] = useState(true);
  const [currentStage, setCurrentStage] = useState<"insert" | "delete">("insert"); // 연계 문제의 현재 단계
  const [showAnswer, setShowAnswer] = useState(false); // 정답 표시 여부
  const [startTime, setStartTime] = useState<number | null>(null); // 현재 단계 타이머 시작 시간
  const [elapsedTime, setElapsedTime] = useState(0); // 현재 단계 경과 시간 (초)
  const [insertTime, setInsertTime] = useState<number | null>(null); // 삽입 문제 완료 시간
  const [deleteTime, setDeleteTime] = useState<number | null>(null); // 삭제 문제 완료 시간
  const [showResultModal, setShowResultModal] = useState(false); // 결과 모달 표시 여부

  // 타이머 업데이트
  useEffect(() => {
    if (startTime && !showResultModal) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime, showResultModal]);

  const generateNewProblem = () => {
    // 삭제 문제 또는 연계 문제일 경우 초기 노드 수가 삭제 개수보다 많은지 검증
    if ((operationType === "delete" || operationType === "insert-delete") && initialNodeCount <= operationCount) {
      alert("초기 노드 수는 삭제 개수보다 많아야 합니다.");
      return;
    }

    const newProblem = generateProblem(
      treeType,
      operationCount,
      treeOrder,
      operationType,
      initialNodeCount
    );
    setProblem(newProblem);
    setUserAnswer("");
    setCheckResult(null);
    setShowSettings(false); // 문제 생성 후 설정 숨기기
    setCurrentStage("insert"); // 연계 문제의 경우 삽입 단계부터 시작
    setShowAnswer(false); // 정답 숨기기
    setStartTime(Date.now()); // 타이머 시작
    setElapsedTime(0);
    setInsertTime(null); // 삽입 시간 초기화
    setDeleteTime(null); // 삭제 시간 초기화
    setShowResultModal(false);
  };

  const checkAnswer = () => {
    if (!problem) return;

    // 연계 문제인 경우 현재 단계에 따라 정답을 확인
    const currentProblem = problem.isLinkedProblem && currentStage === "insert"
      ? problem.insertProblem
      : problem.isLinkedProblem && currentStage === "delete"
      ? problem.deleteProblem
      : problem;

    if (!currentProblem) return;

    const normalized = userAnswer.trim().replace(/\s+/g, "");
    const correctAnswer = currentProblem.answer.replace(/\s+/g, "");

    if (normalized === correctAnswer) {
      setCheckResult("correct");

      // 연계 문제의 삽입 단계에서 정답을 맞춘 경우
      if (problem.isLinkedProblem && currentStage === "insert") {
        // 삽입 시간 저장
        setInsertTime(elapsedTime);

        setTimeout(() => {
          setCurrentStage("delete");
          setUserAnswer("");
          setCheckResult(null);
          setShowAnswer(false);
          // 삭제 단계를 위한 새 타이머 시작
          setStartTime(Date.now());
          setElapsedTime(0);
        }, 2000); // 2초 후 다음 단계로 이동
      } else {
        // 최종 정답을 맞춘 경우
        // 연계 문제의 삭제 단계이거나 일반 문제인 경우
        if (problem.isLinkedProblem) {
          setDeleteTime(elapsedTime);
        } else {
          // 일반 문제는 단일 시간만 저장
          setInsertTime(elapsedTime);
        }

        // 타이머 정지 및 결과 모달 표시
        setStartTime(null);
        setShowResultModal(true);
      }
    } else {
      setCheckResult("incorrect");
    }
  };

  const showSimulation = () => {
    if (!problem) return;

    // 연계 문제인 경우 현재 단계에 따라 시뮬레이션할 문제 선택
    const currentProblem = problem.isLinkedProblem && currentStage === "insert"
      ? problem.insertProblem
      : problem.isLinkedProblem && currentStage === "delete"
      ? problem.deleteProblem
      : problem;

    if (!currentProblem) return;

    // 명령어를 쿼리 파라미터로 전달
    const commandsStr = currentProblem.commands
      .map((cmd) => `${cmd.type === "insert" ? "i" : "d"} ${cmd.value}`)
      .join(",");

    const params = new URLSearchParams({
      treeType: currentProblem.treeType,
      commands: commandsStr,
      ...(currentProblem.treeOrder && { treeOrder: currentProblem.treeOrder.toString() }),
    });

    // 삭제 문제인 경우 초기 삽입 명령 개수를 전달
    if (currentProblem.initialTree) {
      const insertCount = currentProblem.commands.filter(
        (cmd) => cmd.type === "insert"
      ).length;
      params.set("skipInsertCount", insertCount.toString());
    }

    router.push(`/?${params.toString()}`);
  };

  const toggleShowAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const getTreeTypeName = (type: TreeType) => {
    switch (type) {
      case "BST":
        return "BST";
      case "AVL":
        return "AVL";
      case "BTree":
        return "B-트리";
      case "BPlusTree":
        return "B+ 트리";
      default:
        return "";
    }
  };

  const getAnswerFormat = (type: TreeType) => {
    if (type === "BST" || type === "AVL") {
      return (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium mb-1">답안 형식:</p>
          <p>높이,루트키,왼쪽노드수,오른쪽노드수#단말노드1,단말노드2,...</p>
          <p className="mt-1 text-xs">예: 3,50,2,3#10,25,60,80</p>
        </div>
      );
    } else {
      return (
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <p className="font-medium mb-1">답안 형식:</p>
          <p>
            {"{"}키1,키2{"}"},{"{"}키3,키4,키5{"}"},...
          </p>
          <p className="mt-2 text-xs">
            예: {"{"}10,20{"}"},{"{"}30,40,50{"}"}
          </p>
          <p className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400">
            ※ 모든 단말 노드(리프 노드)의 키를 왼쪽에서 오른쪽 순서로 작성
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
            • 각 노드는 중괄호({"{}"})와 콤마로 구별
            <br />• 노드 내 키 값들은 콤마로 구별
          </p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            문제 풀이
          </h1>
          <div className="flex items-center gap-3">
            {startTime && !showResultModal && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-blue-600 dark:text-blue-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
              </div>
            )}
            {problem && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors flex items-center gap-2"
                title={showSettings ? "설정 숨기기" : "설정 보기"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                  />
                </svg>
                설정
              </button>
            )}
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>

        {/* 설정 패널 */}
        {showSettings && (
          <ProblemSettings
            treeType={treeType}
            onTreeTypeChange={setTreeType}
            operationType={operationType}
            onOperationTypeChange={setOperationType}
            operationCount={operationCount}
            onOperationCountChange={setOperationCount}
            initialNodeCount={initialNodeCount}
            onInitialNodeCountChange={setInitialNodeCount}
            treeOrder={treeOrder}
            onTreeOrderChange={setTreeOrder}
            onGenerateProblem={generateNewProblem}
          />
        )}

        {/* 문제 표시 */}
        {problem && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {getTreeTypeName(problem.treeType)} 문제
                {(problem.treeType === "BTree" ||
                  problem.treeType === "BPlusTree") &&
                  problem.treeOrder && (
                    <span className="text-base font-normal text-zinc-600 dark:text-zinc-400 ml-2">
                      (m={problem.treeOrder})
                    </span>
                  )}
              </h2>
              <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-lg text-sm font-medium">
                {problem.isLinkedProblem
                  ? currentStage === "insert"
                    ? "삽입 문제 (1/2)"
                    : "삭제 문제 (2/2)"
                  : operationType === "insert"
                  ? "삽입 문제"
                  : "삭제 문제"}
              </div>
            </div>

            {/* 초기 트리 상태 (삭제 문제 또는 연계 문제의 삭제 단계인 경우) */}
            {(problem.isLinkedProblem && currentStage === "delete" && problem.deleteProblem?.initialTree) ||
            (!problem.isLinkedProblem && problem.initialTree) ? (
              <div className="mb-6">
                <div className="mb-3">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    초기 트리 상태:
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">
                    삭제 연산을 수행하기 전의 트리 상태입니다
                  </p>
                </div>
                <InitialTreeVisualization
                  tree={
                    (problem.isLinkedProblem && currentStage === "delete"
                      ? problem.deleteProblem?.initialTree
                      : problem.initialTree) || null
                  }
                  treeType={problem.treeType}
                />
              </div>
            ) : null}

            {/* 연산 목록 */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                {problem.isLinkedProblem && currentStage === "insert"
                  ? "다음 삽입 연산을 순서대로 수행합니다:"
                  : problem.isLinkedProblem && currentStage === "delete"
                  ? "다음 삭제 연산을 순서대로 수행합니다:"
                  : problem.initialState
                  ? "다음 삭제 연산을 순서대로 수행합니다:"
                  : "다음 연산을 순서대로 수행합니다:"}
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg font-mono text-sm">
                {(problem.isLinkedProblem && currentStage === "insert"
                  ? problem.insertProblem?.commands || []
                  : problem.isLinkedProblem && currentStage === "delete"
                  ? problem.deleteProblem?.commands.filter((cmd) => cmd.type === "delete") || []
                  : problem.commands.filter((cmd) =>
                      problem.initialState ? cmd.type === "delete" : true
                    )
                ).map((cmd, idx, arr) => (
                  <span key={idx} className="inline-block mr-3 mb-1">
                    {cmd.type === "insert" ? "i" : "d"} {cmd.value}
                    {idx < arr.length - 1 && ","}
                  </span>
                ))}
              </div>
            </div>

            {/* 답안 형식 안내 */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              {getAnswerFormat(problem.treeType)}
            </div>

            {/* 답안 입력 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                정답 입력
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="정답을 입력하세요..."
                rows={3}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            {/* 버튼들 */}
            <div className="flex gap-3">
              <button
                onClick={checkAnswer}
                disabled={!userAnswer.trim()}
                className="flex-1 py-3 bg-green-600 hover:bg-green-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
              >
                정답 확인
              </button>
              <button
                onClick={toggleShowAnswer}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-colors"
              >
                {showAnswer ? "정답 숨기기" : "정답 보기"}
              </button>
              <button
                onClick={showSimulation}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                시뮬레이션
              </button>
            </div>

            {/* 정답 보기 */}
            {showAnswer && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
                <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                  정답:
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-mono">
                  {problem.isLinkedProblem && currentStage === "insert"
                    ? problem.insertProblem?.answer
                    : problem.isLinkedProblem && currentStage === "delete"
                    ? problem.deleteProblem?.answer
                    : problem.answer}
                </p>
              </div>
            )}

            {/* 결과 표시 */}
            {checkResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  checkResult === "correct"
                    ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                    : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                }`}
              >
                <p
                  className={`font-semibold ${
                    checkResult === "correct"
                      ? "text-green-900 dark:text-green-100"
                      : "text-red-900 dark:text-red-100"
                  }`}
                >
                  {checkResult === "correct"
                    ? problem.isLinkedProblem && currentStage === "insert"
                      ? "✓ 정답입니다! 2초 후 삭제 문제로 넘어갑니다..."
                      : "✓ 정답입니다!"
                    : "✗ 틀렸습니다."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* 초기 안내 */}
        {!problem && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-12 border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              문제를 생성해주세요
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              위의 설정을 조정하고 &quot;새 문제 생성&quot; 버튼을 눌러주세요
            </p>
          </div>
        )}
      </div>

      {/* 결과 모달 */}
      {showResultModal && problem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-8 max-w-md w-full mx-4 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="text-center">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                정답입니다!
              </h2>

              {problem.isLinkedProblem ? (
                // 연계 문제 - 두 시간 모두 표시
                <div className="mb-6 space-y-3">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      삽입 문제 풀이 시간
                    </p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {insertTime !== null ? formatTime(insertTime) : "-"}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      삭제 문제 풀이 시간
                    </p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {deleteTime !== null ? formatTime(deleteTime) : "-"}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      총 소요 시간
                    </p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {insertTime !== null && deleteTime !== null
                        ? formatTime(insertTime + deleteTime)
                        : "-"}
                    </p>
                  </div>
                </div>
              ) : (
                // 일반 문제 - 단일 시간 표시
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                    문제 풀이 시간
                  </p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {insertTime !== null ? formatTime(insertTime) : "-"}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  setShowResultModal(false);
                  setShowSettings(true);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                새 문제 풀기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
