import { useState, useRef, useCallback, useEffect } from 'react';

interface SnapPoint {
  id: string;
  height: number; // vh
}

interface UseBottomSheetGestureOptions {
  snapPoints: SnapPoint[];
  initialSnap: string;
  onSnapChange?: (id: string) => void;
  resistanceFactor?: number; // 0-1, que tanto resiste al arrastrar mas alla del limite
}

export function useBottomSheetGesture(options: UseBottomSheetGestureOptions) {
  const { snapPoints, initialSnap, onSnapChange, resistanceFactor = 0.3 } = options;
  
  const [currentSnap, setCurrentSnap] = useState(initialSnap);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const startTimeRef = useRef(0);
  const startHeightRef = useRef(0);
  const velocityRef = useRef(0);

  const getSnapHeight = useCallback((id: string) => {
    if (typeof window === 'undefined') return 0;
    const snap = snapPoints.find(s => s.id === id);
    return snap ? (snap.height / 100) * window.innerHeight : 0;
  }, [snapPoints]);

  const startDrag = useCallback((clientY: number, target?: HTMLElement) => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Si el toque fue sobre un botón, input o elemento interactivo, no activar drag del sheet
    if (target && target.closest('button, a, input, select, textarea, [role="button"]')) {
      return;
    }

    // Permitir scroll normal si el usuario está scrolleando contenido interno
    const scrollableContent = sheet.querySelector('.sheet-scroll-content');
    if (scrollableContent && scrollableContent.scrollTop > 5) {
      return;
    }

    startYRef.current = clientY;
    currentYRef.current = clientY;
    startTimeRef.current = Date.now();
    startHeightRef.current = sheet.getBoundingClientRect().height;
    velocityRef.current = 0;
    isDraggingRef.current = true;
    setIsDragging(true);

    sheet.style.transition = 'none';
  }, []);

  const moveDrag = useCallback((clientY: number) => {
    if (!isDraggingRef.current || !sheetRef.current || typeof window === 'undefined') return;

    const deltaY = startYRef.current - clientY; // positivo = arriba
    
    const timeDelta = Date.now() - startTimeRef.current;
    if (timeDelta > 0) {
      velocityRef.current = (currentYRef.current - clientY) / timeDelta;
    }
    currentYRef.current = clientY;

    let newHeight = startHeightRef.current + deltaY;

    const minSnap = Math.min(...snapPoints.map(s => (s.height / 100) * window.innerHeight));
    const maxSnap = Math.max(...snapPoints.map(s => (s.height / 100) * window.innerHeight));

    if (newHeight < minSnap) {
      const overflow = minSnap - newHeight;
      newHeight = minSnap - overflow * resistanceFactor;
    }
    if (newHeight > maxSnap) {
      const overflow = newHeight - maxSnap;
      newHeight = maxSnap + overflow * resistanceFactor;
    }

    sheetRef.current.style.height = `${newHeight}px`;
  }, [snapPoints, resistanceFactor]);

  const endDrag = useCallback(() => {
    if (!isDraggingRef.current || !sheetRef.current || typeof window === 'undefined') return;
    isDraggingRef.current = false;
    setIsDragging(false);

    const sheet = sheetRef.current;
    sheet.style.transition = 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    const currentHeight = sheet.getBoundingClientRect().height;
    const velocity = velocityRef.current;

    const triggerHaptic = () => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          /* ignore */
        }
      }
    };

    if (Math.abs(velocity) > 0.2) {
      const currentIdx = snapPoints.findIndex(s => s.id === currentSnap);
      let targetIdx;

      if (velocity > 0.2) {
        targetIdx = Math.min(currentIdx + 1, snapPoints.length - 1);
      } else {
        targetIdx = Math.max(currentIdx - 1, 0);
      }

      const targetSnap = snapPoints[targetIdx] || snapPoints[0];
      const targetHeight = (targetSnap.height / 100) * window.innerHeight;
      sheet.style.height = `${targetHeight}px`;
      setCurrentSnap(targetSnap.id);
      triggerHaptic();
      onSnapChange?.(targetSnap.id);
      return;
    }

    const distances = snapPoints.map(s => ({
      id: s.id,
      dist: Math.abs(currentHeight - (s.height / 100) * window.innerHeight)
    }));

    const closest = distances.reduce((a, b) => a.dist < b.dist ? a : b);
    const targetHeight = getSnapHeight(closest.id);
    sheet.style.height = `${targetHeight}px`;
    setCurrentSnap(closest.id);
    triggerHaptic();
    onSnapChange?.(closest.id);
  }, [currentSnap, snapPoints, getSnapHeight, onSnapChange]);

  const snapTo = useCallback((id: string) => {
    if (!sheetRef.current || typeof window === 'undefined') return;
    const height = getSnapHeight(id);
    sheetRef.current.style.transition = 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    sheetRef.current.style.height = `${height}px`;
    setCurrentSnap(id);
    onSnapChange?.(id);
  }, [getSnapHeight, onSnapChange]);

  useEffect(() => {
    snapTo(initialSnap);
  }, [initialSnap, snapTo]);

  return {
    sheetRef,
    currentSnap,
    isDragging,
    snapTo,
    handlers: {
      onTouchStart: (e: React.TouchEvent) => startDrag(e.touches[0].clientY, e.target as HTMLElement),
      onTouchMove: (e: React.TouchEvent) => moveDrag(e.touches[0].clientY),
      onTouchEnd: () => endDrag(),
      onMouseDown: (e: React.MouseEvent) => startDrag(e.clientY, e.target as HTMLElement),
      onMouseMove: (e: React.MouseEvent) => moveDrag(e.clientY),
      onMouseUp: () => endDrag(),
    }
  };
}
