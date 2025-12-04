'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TreeType } from '@/lib/types';
import { generateProblem, Problem } from '@/lib/problemGenerator';

export default function PracticeView() {
  const router = useRouter();
  const [treeType, setTreeType] = useState<TreeType>('BST');
  const [treeOrder, setTreeOrder] = useState(3);
  const [operationCount, setOperationCount] = useState(10);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [checkResult, setCheckResult] = useState<'correct' | 'incorrect' | null>(null);

  const generateNewProblem = () => {
    const newProblem = generateProblem(treeType, operationCount, treeOrder);
    setProblem(newProblem);
    setUserAnswer('');
    setCheckResult(null);
  };

  const checkAnswer = () => {
    if (!problem) return;

    const normalized = userAnswer.trim().replace(/\s+/g, '');
    const correctAnswer = problem.answer.replace(/\s+/g, '');

    if (normalized === correctAnswer) {
      setCheckResult('correct');
    } else {
      setCheckResult('incorrect');
    }
  };

  const showSimulation = () => {
    if (!problem) return;

    // 명령어를 쿼리 파라미터로 전달
    const commandsStr = problem.commands
      .map(cmd => `${cmd.type === 'insert' ? 'i' : 'd'} ${cmd.value}`)
      .join(',');

    const params = new URLSearchParams({
      treeType: problem.treeType,
      commands: commandsStr,
      ...(problem.treeOrder && { treeOrder: problem.treeOrder.toString() }),
    });

    router.push(`/?${params.toString()}`);
  };

  const getAnswerFormat = () => {
    if (treeType === 'BST' || treeType === 'AVL') {
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
          <p>{'{'}키1,키2{'}'},{'{'}키3,키4,키5{'}'},...</p>
          <p className="mt-1 text-xs">예: {'{'}10,20{'}'},{'{'}30,40,50{'}'}</p>
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
            트리 문제 풀이
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-lg font-medium transition-colors"
          >
            시뮬레이션으로 돌아가기
          </button>
        </div>

        {/* 설정 패널 */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 mb-6 border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
            문제 설정
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 트리 타입 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                트리 타입
              </label>
              <select
                value={treeType}
                onChange={(e) => setTreeType(e.target.value as TreeType)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BST">이진 탐색 트리 (BST)</option>
                <option value="AVL">AVL 트리</option>
                <option value="BTree">B-트리</option>
                <option value="BPlusTree">B+ 트리</option>
              </select>
            </div>

            {/* 연산 개수 */}
            <div>
              <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                연산 개수
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={operationCount}
                onChange={(e) => setOperationCount(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* B-트리 차수 */}
            {(treeType === 'BTree' || treeType === 'BPlusTree') && (
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                  차수 (m)
                </label>
                <input
                  type="number"
                  min="3"
                  max="10"
                  value={treeOrder}
                  onChange={(e) => setTreeOrder(parseInt(e.target.value) || 3)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <button
            onClick={generateNewProblem}
            className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            새 문제 생성
          </button>
        </div>

        {/* 문제 표시 */}
        {problem && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 border border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
              문제
            </h2>

            {/* 연산 목록 */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
                다음 연산을 순서대로 수행합니다:
              </p>
              <div className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg font-mono text-sm">
                {problem.commands.map((cmd, idx) => (
                  <span key={idx} className="inline-block mr-3 mb-1">
                    {cmd.type === 'insert' ? 'i' : 'd'} {cmd.value}
                    {idx < problem.commands.length - 1 && ','}
                  </span>
                ))}
              </div>
            </div>

            {/* 답안 형식 안내 */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              {getAnswerFormat()}
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
                onClick={showSimulation}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                정답 보기 (시뮬레이션)
              </button>
            </div>

            {/* 결과 표시 */}
            {checkResult && (
              <div
                className={`mt-4 p-4 rounded-lg ${
                  checkResult === 'correct'
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                }`}
              >
                <p
                  className={`font-semibold ${
                    checkResult === 'correct'
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {checkResult === 'correct' ? '✓ 정답입니다!' : '✗ 틀렸습니다.'}
                </p>
                {checkResult === 'incorrect' && (
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">
                    정답: {problem.answer}
                  </p>
                )}
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
              위의 설정을 조정하고 "새 문제 생성" 버튼을 눌러주세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
