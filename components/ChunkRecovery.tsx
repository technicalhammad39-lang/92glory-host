'use client';

import { useEffect } from 'react';

const CHUNK_RELOAD_GUARD_KEY = '__chunk_reload_guard__';

function shouldRecoverFromError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('chunkloaderror') ||
    normalized.includes('loading chunk') ||
    normalized.includes('/_next/static/chunks/')
  );
}

export function ChunkRecovery() {
  useEffect(() => {
    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1';

    if (isLocalHost && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch(() => undefined);
        });
      });

      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            caches.delete(key).catch(() => undefined);
          });
        });
      }
    }

    const attemptReload = () => {
      if (sessionStorage.getItem(CHUNK_RELOAD_GUARD_KEY) === '1') return;
      sessionStorage.setItem(CHUNK_RELOAD_GUARD_KEY, '1');
      window.location.reload();
    };

    const onWindowError = (event: ErrorEvent) => {
      const message = event?.message || '';
      if (shouldRecoverFromError(message)) {
        attemptReload();
      }
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : typeof reason?.message === 'string'
            ? reason.message
            : '';

      if (shouldRecoverFromError(message)) {
        attemptReload();
      }
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
