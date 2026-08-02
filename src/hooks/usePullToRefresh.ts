import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number; // pixeles para activar
  maxPull?: number; // maximo pixeles de pull
}

/**
 * Hook de pull-to-refresh con soporte iOS Safari (P0-37).
 * - Detecta el contenedor scrolleable real (scrollRef o window/body).
 * - Usa requestAnimationFrame para throttle de setState (evita re-renders excesivos).
 */
export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, maxPull = 120 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Función helper para detectar el scrollTop real (P0-37)
  const getScrollTop = useCallback(() => {
    const el = scrollRef.current;
    if (el) return el.scrollTop;
    // Fallback: body o window scroll (iOS Safari suele usar body)
    if (typeof window !== 'undefined') {
      return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }
    return 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (getScrollTop() > 0 || isRefreshing) return;
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    },
    [getScrollTop, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const deltaY = e.touches[0].clientY - startYRef.current;

      if (deltaY > 0) {
        // Throttle con requestAnimationFrame (evita 60 setState/seg)
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const distance = Math.min(deltaY * 0.5, maxPull); // 0.5 = resistance
          setPullDistance(distance);
          setCanRefresh(distance >= threshold);
        });
      }
    },
    [isRefreshing, threshold, maxPull]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;

    // Cancelar cualquier rAF pendiente
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

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

  // Cleanup del rAF al desmontar
  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
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
      onTouchEnd: handleTouchEnd,
    },
  };
}
