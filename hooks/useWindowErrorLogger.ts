import { useEffect } from 'react';

interface ErrorPayload {
  event: string;
  msg: string;
  src?: string;
  ln?: number;
  col?: number;
  ts: number;
}

const MIN_INTERVAL_MS = 5000;

export const useWindowErrorLogger = () => {
  useEffect(() => {
    let lastSent = 0;

    const send = (payload: ErrorPayload) => {
      const now = Date.now();
      if (now - lastSent < MIN_INTERVAL_MS) return;
      lastSent = now;
      fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
    };

    const onError = (event: ErrorEvent) => {
      const src = (event as any).filename?.toString?.() || '';
      const ln = (event as any).lineno || 0;
      const col = (event as any).colno || 0;
      const msg = event.message || 'unknown';
      send({ event: 'window_error', msg, src, ln, col, ts: Date.now() });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = (event as any).reason;
      const msg = reason?.message || reason?.toString?.() || 'unhandledrejection';
      send({ event: 'unhandledrejection', msg, ts: Date.now() });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as any);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection as any);
    };
  }, []);
};
