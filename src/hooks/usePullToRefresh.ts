import { useState, useRef, useCallback, useEffect } from 'react';

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
  const animationFrameRef = useRef<number | null>(null);

  const getScrollTop = useCallback(() => {
    if (scrollRef.current) return scrollRef.current.scrollTop;
    if (typeof window !== 'undefined') return window.scrollY || document.documentElement.scrollTop || 0;
    return 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (getScrollTop() > 0 || isRefreshing) return;

    const touch = 'touches' in e ? e.touches[0] : null;
    if (!touch) return;

    startYRef.current = touch.clientY;
    isPullingRef.current = true;
  }, [getScrollTop, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent | TouchEvent) => {
    if (!isPullingRef.current || isRefreshing || getScrollTop() > 0) return;

    const touch = 'touches' in e ? e.touches[0] : null;
    if (!touch) return;

    const deltaY = touch.clientY - startYRef.current;

    if (deltaY > 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        const distance = Math.min(deltaY * 0.5, maxPull); // 0.5 = resistencia
        setPullDistance(distance);
        setCanRefresh(distance >= threshold);
      });
    }
  }, [getScrollTop, isRefreshing, threshold, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(60); // mantener la animacion

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

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
