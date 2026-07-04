import { useState, useRef, useCallback } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // pixeles para activar
  maxPull?: number; // maximo pixeles de pull
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, maxPull = 120 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const scroll = scrollRef.current;
    if (!scroll || scroll.scrollTop > 0 || isRefreshing) return;

    startYRef.current = e.touches[0].clientY;
    isPullingRef.current = true;
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPullingRef.current || isRefreshing) return;

    const deltaY = e.touches[0].clientY - startYRef.current;

    if (deltaY > 0) {
      // Pulling down
      const distance = Math.min(deltaY * 0.5, maxPull); // 0.5 = resistance
      setPullDistance(distance);
      setCanRefresh(distance >= threshold);
    }
  }, [isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // mantener la animacion

      // Vibración de trigger
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(15);
        } catch {
          /* ignore */
        }
      }

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        setCanRefresh(false);
      }
    } else {
      setPullDistance(0);
      setCanRefresh(false);
    }
  }, [canRefresh, isRefreshing, onRefresh]);

  return {
    scrollRef,
    pullDistance,
    isRefreshing,
    canRefresh,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}
