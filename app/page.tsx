'use client';

import { Suspense } from 'react';
import HomeView from '@/views/Home';

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-950 items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">로딩 중...</div>
      </div>
    }>
      <HomeView />
    </Suspense>
  );
}
