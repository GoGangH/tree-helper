"use client";

import { useState, useEffect, useRef } from "react";
import { Command, TreeType } from "@/lib/types";

interface InputPanelProps {
  onCommandsSubmit: (commands: Command[]) => void;
  treeType: TreeType;
  onTreeTypeChange: (type: TreeType) => void;
  treeOrder: number;
  onTreeOrderChange: (order: number) => void;
  initialCommands?: Command[] | null;
  currentCommandIndex?: number;
  onPracticeClick?: () => void;
}

export default function InputPanel({
  onCommandsSubmit,
  treeType,
  onTreeTypeChange,
  treeOrder,
  onTreeOrderChange,
  initialCommands,
  currentCommandIndex = -1,
  onPracticeClick,
}: InputPanelProps) {
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentValue, setCurrentValue] = useState("");
  const [currentOperation, setCurrentOperation] = useState<"insert" | "delete">(
    "insert"
  );
  const [bulkInput, setBulkInput] = useState("");
  const hasAutoSubmitted = useRef(false);
  const commandRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 초기 명령어 로드 (문제 풀이 모드에서 넘어온 경우)
  useEffect(() => {
    if (
      initialCommands &&
      initialCommands.length > 0 &&
      !hasAutoSubmitted.current
    ) {
      setCommands(initialCommands);
      // 자동으로 시뮬레이션 시작
      onCommandsSubmit(initialCommands);
      hasAutoSubmitted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCommands]);

  // 현재 실행 중인 명령으로 스크롤
  useEffect(() => {
    if (
      currentCommandIndex >= 0 &&
      currentCommandIndex < commandRefs.current.length
    ) {
      const element = commandRefs.current[currentCommandIndex];
      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [currentCommandIndex]);

  const addCommand = () => {
    const value = parseInt(currentValue);
    if (!isNaN(value)) {
      setCommands([...commands, { type: currentOperation, value }]);
      setCurrentValue("");
    }
  };

  const removeCommand = (index: number) => {
    setCommands(commands.filter((_, i) => i !== index));
  };

  const clearCommands = () => {
    setCommands([]);
  };

  const handleSubmit = () => {
    if (commands.length > 0) {
      onCommandsSubmit(commands);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      addCommand();
    }
  };

  const parseBulkInput = () => {
    // "d 45, i 30, 20" 형식 파싱 (i/d가 없으면 자동으로 insert)
    const input = bulkInput.trim();
    if (!input) return;

    const parts = input.split(",").map((s) => s.trim());
    const newCommands: Command[] = [];

    for (const part of parts) {
      // i/d가 있는 경우
      const matchWithPrefix = part.match(/^([di])\s+(\d+)$/i);
      if (matchWithPrefix) {
        const operation =
          matchWithPrefix[1].toLowerCase() === "i" ? "insert" : "delete";
        const value = parseInt(matchWithPrefix[2]);
        newCommands.push({ type: operation, value });
        continue;
      }

      // 숫자만 있는 경우 (자동으로 insert)
      const matchNumberOnly = part.match(/^(\d+)$/);
      if (matchNumberOnly) {
        const value = parseInt(matchNumberOnly[1]);
        newCommands.push({ type: "insert", value });
      }
    }

    if (newCommands.length > 0) {
      setCommands([...commands, ...newCommands]);
      setBulkInput("");
    }
  };

  const handleBulkKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      parseBulkInput();
    }
  };

  return (
    <div className="w-full h-full bg-white dark:bg-zinc-900 pt-[calc(1rem+var(--safe-area-inset-top))] lg:pt-[calc(1.5rem+var(--safe-area-inset-top))] px-4 lg:px-6 pb-4 lg:pb-6 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* 헤더와 연습 모드 버튼 */}
      <div className="mb-4 lg:mb-6">
        <h2 className="text-xl lg:text-2xl font-bold mb-3 text-zinc-900 dark:text-zinc-100">
          트리 시각화 도구
        </h2>
        {onPracticeClick && (
          <button
            onClick={onPracticeClick}
            className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm lg:text-base"
          >
            📝 연습 모드
          </button>
        )}
      </div>

      {/* 트리 타입 선택 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          트리 타입
        </label>
        <select
          value={treeType}
          onChange={(e) => onTreeTypeChange(e.target.value as TreeType)}
          className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="BST">이진 탐색 트리 (BST)</option>
          <option value="AVL">AVL 트리</option>
          <option value="BTree">B-트리</option>
          <option value="BPlusTree">B+ 트리</option>
        </select>
      </div>

      {/* B-트리, B+ 트리 차수 설정 */}
      {(treeType === "BTree" || treeType === "BPlusTree") && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            차수 (m) - 최소: 3
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="3"
              max="10"
              value={treeOrder}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 3) {
                  onTreeOrderChange(value);
                }
              }}
              className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-1">
              <button
                onClick={() => onTreeOrderChange(Math.max(3, treeOrder - 1))}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
              >
                -
              </button>
              <button
                onClick={() => onTreeOrderChange(Math.min(10, treeOrder + 1))}
                className="px-3 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
              >
                +
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            각 노드는 최대 {treeOrder - 1}개의 키를 가질 수 있습니다
          </p>
        </div>
      )}

      {/* 일괄 명령 입력 */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          일괄 입력 (예: i 30, d 45, i 20)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            onKeyDown={handleBulkKeyDown}
            placeholder="i 30, d 45, i 20"
            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={parseBulkInput}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            파싱
          </button>
        </div>
      </div>

      {/* 개별 명령 입력 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
          개별 추가
        </label>
        <div className="flex gap-2 mb-3">
          <select
            value={currentOperation}
            onChange={(e) =>
              setCurrentOperation(e.target.value as "insert" | "delete")
            }
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="insert">삽입</option>
            <option value="delete">삭제</option>
          </select>
          <input
            type="number"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="숫자 입력"
            className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addCommand}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* 명령 리스트 */}
      <div className="flex-1 min-h-0 mb-4 lg:mb-6 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs lg:text-sm font-medium text-zinc-700 dark:text-zinc-300">
            명령 목록 ({commands.length})
          </label>
          {commands.length > 0 && (
            <button
              onClick={clearCommands}
              className="text-xs lg:text-sm text-red-500 hover:text-red-600 font-medium"
            >
              전체 삭제
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 lg:space-y-2">
          {commands.length === 0 ? (
            <div className="text-center py-6 lg:py-8 text-sm lg:text-base text-zinc-400 dark:text-zinc-600">
              명령을 추가해주세요
            </div>
          ) : (
            commands.map((cmd, index) => (
              <div
                key={index}
                ref={(el) => {
                  commandRefs.current[index] = el;
                }}
                className={`flex items-center justify-between p-2 lg:p-3 rounded-lg border transition-all ${
                  index === currentCommandIndex
                    ? "bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600 shadow-md"
                    : "bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                }`}
              >
                <div className="flex items-center gap-2 lg:gap-3">
                  <span className="text-xs lg:text-sm font-mono text-zinc-500 dark:text-zinc-400">
                    {index + 1}.
                  </span>
                  <span
                    className={`px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-xs font-medium ${
                      cmd.type === "insert"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {cmd.type === "insert" ? "삽입" : "삭제"}
                  </span>
                  <span className="font-mono font-semibold text-sm lg:text-base text-zinc-900 dark:text-zinc-100">
                    {cmd.value}
                  </span>
                </div>
                <button
                  onClick={() => removeCommand(index)}
                  className="text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <svg
                    className="w-4 h-4 lg:w-5 lg:h-5"
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
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 실행 버튼 */}
      <button
        onClick={handleSubmit}
        disabled={commands.length === 0}
        className="w-full py-2.5 lg:py-3 text-sm lg:text-base bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
      >
        시작하기
      </button>
    </div>
  );
}
