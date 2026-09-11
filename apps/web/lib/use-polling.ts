'use client';
import { useEffect, useRef } from 'react';

export function usePolling(fn: () => void | Promise<void>, intervalMs: number, enabled: boolean) {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      Promise.resolve(fnRef.current()).catch(() => {});
    };

    tick();
    const id = window.setInterval(tick, intervalMs);
    const onFocus = () => tick();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [intervalMs, enabled]);
}
