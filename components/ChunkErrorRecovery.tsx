'use client';

import { useEffect } from 'react';

const RECOVERY_KEY = 'chunk_recovery_once';

function isChunkErrorMessage(message: string) {
  const text = message.toLowerCase();
  return (
    text.includes('chunkloaderror') ||
    text.includes('loading chunk') ||
    text.includes('failed to fetch dynamically imported module') ||
    text.includes('importing a module script failed')
  );
}

export function ChunkErrorRecovery() {
  useEffect(() => {
    const canReload = () => {
      try {
        const attempted = sessionStorage.getItem(RECOVERY_KEY);
        if (attempted) return false;
        sessionStorage.setItem(RECOVERY_KEY, '1');
        return true;
      } catch {
        return true;
      }
    };

    const onError = (event: ErrorEvent) => {
      const message = event?.message || event?.error?.message || '';
      if (!message || !isChunkErrorMessage(message)) return;
      if (!canReload()) return;
      window.location.reload();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason?.message
            ? String(reason.message)
            : '';
      if (!message || !isChunkErrorMessage(message)) return;
      if (!canReload()) return;
      window.location.reload();
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}

