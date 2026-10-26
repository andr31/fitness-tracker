import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 70;
const MAX_PULL = 110;

/**
 * Touch pull-to-refresh for the window scroll container.
 * Only starts when the page is scrolled to the top and no modal is open.
 */
export function usePullToRefresh(
  onRefresh: () => Promise<unknown> | void,
  enabled = true,
) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);
  const refreshRef = useRef(onRefresh);
  useEffect(() => {
    refreshRef.current = onRefresh;
  });

  useEffect(() => {
    if (!enabled) return;

    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || e.touches.length !== 1) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      startY.current = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      if (startY.current === null) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0 || window.scrollY > 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      pullRef.current = Math.min(MAX_PULL, delta * 0.5);
      setPull(pullRef.current);
    };

    const onEnd = async () => {
      if (startY.current === null) return;
      startY.current = null;
      const shouldRefresh = pullRef.current >= THRESHOLD * 0.5;
      pullRef.current = 0;
      setPull(0);
      if (!shouldRefresh) return;
      setRefreshing(true);
      try {
        await refreshRef.current();
      } finally {
        setRefreshing(false);
      }
    };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);
    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, [enabled]);

  return { pull, refreshing, threshold: THRESHOLD };
}
