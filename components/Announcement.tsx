'use client';

import { useState, useEffect } from 'react';

interface AnnouncementProps {
  version: string; // 공지사항 버전 (예: "v1.0", "2024-01-15")
  title: string;
  children: React.ReactNode;
}

export default function Announcement({ version, title, children }: AnnouncementProps) {
  const [isVisible, setIsVisible] = useState(false);
  const storageKey = 'announcement-dismissed';

  useEffect(() => {
    // localStorage는 클라이언트 사이드에서만 접근 가능하므로 useEffect 사용
    // 비동기 업데이트로 처리하여 cascading render 방지
    const timer = setTimeout(() => {
      const dismissedData = localStorage.getItem(storageKey);

      if (!dismissedData) {
        // 저장된 데이터가 없으면 공지사항 표시
        setIsVisible(true);
        return;
      }

      try {
        const { timestamp, version: savedVersion } = JSON.parse(dismissedData);
        const now = Date.now();
        const oneDayInMs = 24 * 60 * 60 * 1000;

        // 버전이 다르거나 24시간이 지났으면 공지사항 표시
        if (savedVersion !== version || now - timestamp > oneDayInMs) {
          setIsVisible(true);
        }
      } catch {
        // JSON 파싱 실패 시 공지사항 표시
        setIsVisible(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [version, storageKey]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleDismissForDay = () => {
    const dismissData = {
      timestamp: Date.now(),
      version: version,
    };
    localStorage.setItem(storageKey, JSON.stringify(dismissData));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                <h2 className="text-2xl font-bold">{title}</h2>
              </div>
              <p className="text-blue-100 text-sm">버전: {version}</p>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="닫기"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            {children}
          </div>
        </div>

        {/* 푸터 */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleDismissForDay();
                  }
                }}
                className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                하루 동안 보지 않기
              </span>
            </label>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
