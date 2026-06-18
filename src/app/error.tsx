'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        エラーが発生しました
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        ページの表示中に問題が発生しました。時間をおいて再試行してください。
      </p>
      <Button onClick={reset}>再試行</Button>
    </main>
  );
}
