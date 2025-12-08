import { TreeType } from '@/lib/types';
import { OperationType } from '@/lib/problemGenerator';

interface ProblemSettingsProps {
  treeType: TreeType;
  onTreeTypeChange: (type: TreeType) => void;
  operationType: OperationType;
  onOperationTypeChange: (type: OperationType) => void;
  operationCount: number;
  onOperationCountChange: (count: number) => void;
  initialNodeCount: number;
  onInitialNodeCountChange: (count: number) => void;
  treeOrder: number;
  onTreeOrderChange: (order: number) => void;
  onGenerateProblem: () => void;
}

export default function ProblemSettings({
  treeType,
  onTreeTypeChange,
  operationType,
  onOperationTypeChange,
  operationCount,
  onOperationCountChange,
  initialNodeCount,
  onInitialNodeCountChange,
  treeOrder,
  onTreeOrderChange,
  onGenerateProblem,
}: ProblemSettingsProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 mb-6 border border-zinc-200 dark:border-zinc-800">
      <h2 className="text-xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">
        문제 설정
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 트리 타입 */}
        <div>
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

        {/* 연산 타입 */}
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            연산 타입
          </label>
          <select
            value={operationType}
            onChange={(e) => onOperationTypeChange(e.target.value as OperationType)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="insert">삽입 (Insert)</option>
            <option value="delete">삭제 (Delete)</option>
            <option value="insert-delete">삽입-삭제 연계 문제</option>
          </select>
        </div>

        {/* 연산 개수 */}
        <div>
          <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
            {operationType === 'insert' ? '삽입 개수' : operationType === 'delete' ? '삭제 개수' : '삭제 개수'}
          </label>
          <input
            type="number"
            min="5"
            max={operationType === 'delete' || operationType === 'insert-delete' ? '14' : '30'}
            value={operationCount}
            onChange={(e) => onOperationCountChange(parseInt(e.target.value) || 10)}
            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 초기 노드 수 (삭제 문제 또는 연계 문제일 경우) */}
        {(operationType === 'delete' || operationType === 'insert-delete') && (
          <div>
            <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
              {operationType === 'insert-delete' ? '삽입 개수' : '초기 노드 수'}
            </label>
            <input
              type="number"
              min={operationCount + 1}
              max="15"
              value={initialNodeCount}
              onChange={(e) => onInitialNodeCountChange(parseInt(e.target.value) || 15)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

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
              onChange={(e) => onTreeOrderChange(parseInt(e.target.value) || 3)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <button
        onClick={onGenerateProblem}
        className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        새 문제 생성
      </button>
    </div>
  );
}
