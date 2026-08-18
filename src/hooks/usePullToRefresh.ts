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
    if (typeof window !== 'undefined') {
      const winY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      if (winY > 5) return winY;
    }
    const el = scrollRef.current;
    if (el && el.scrollTop > 5) return el.scrollTop;
    return 0;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (getScrollTop() > 5 || isRefreshing) {
        isPullingRef.current = false;
        return;
      }
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    },
    [getScrollTop, isRefreshing]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startYRef.current;

      // Si el usuario desliza hacia arriba para ver el contenido inferior, liberar el gesto inmediatamente
      if (deltaY < 0) {
        isPullingRef.current = false;
        setPullDistance(0);
        setCanRefresh(false);
        return;
      }

      // Si el usuario está scrolleando contenido, no activar pull
      if (getScrollTop() > 5) {
        isPullingRef.current = false;
        setPullDistance(0);
        setCanRefresh(false);
        return;
      }

      if (deltaY > 0) {
        // Throttle con requestAnimationFrame (evita 60 setState/seg)
        if (rafRef.current !== null) return;
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          const distance = Math.min(deltaY * 0.4, maxPull); // 0.4 = resistencia elástica
          setPullDistance(distance);
          setCanRefresh(distance >= threshold);
        });
      }
    },
    [getScrollTop, isRefreshing, threshold, maxPull]
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
