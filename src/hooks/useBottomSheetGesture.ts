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

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Permitir scroll normal si el usuario está scrolleando contenido
    const scrollableContent = sheet.querySelector('.sheet-scroll-content');
    if (scrollableContent && scrollableContent.scrollTop > 5) {
      return;
    }

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    startHeightRef.current = sheet.getBoundingClientRect().height;
    velocityRef.current = 0;
    setIsDragging(true);

    sheet.style.transition = 'none';
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !sheetRef.current || typeof window === 'undefined') return;

    const currentY = e.touches[0].clientY;
    const deltaY = startYRef.current - currentY; // positivo = arrriba
    
    // Calcular velocidad
    const timeDelta = Date.now() - startTimeRef.current;
    if (timeDelta > 0) {
      velocityRef.current = (currentYRef.current - currentY) / timeDelta;
    }
    currentYRef.current = currentY;

    // Nueva altura propuesta
    let newHeight = startHeightRef.current + deltaY;

    // Límites
    const minSnap = Math.min(...snapPoints.map(s => (s.height / 100) * window.innerHeight));
    const maxSnap = Math.max(...snapPoints.map(s => (s.height / 100) * window.innerHeight));

    // Resistencia al pasar los límites
    if (newHeight < minSnap) {
      const overflow = minSnap - newHeight;
      newHeight = minSnap - overflow * resistanceFactor;
    }
    if (newHeight > maxSnap) {
      const overflow = newHeight - maxSnap;
      newHeight = maxSnap + overflow * resistanceFactor;
    }

    sheetRef.current.style.height = `${newHeight}px`;
  }, [isDragging, snapPoints, resistanceFactor]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging || !sheetRef.current || typeof window === 'undefined') return;
    setIsDragging(false);

    const sheet = sheetRef.current;
    sheet.style.transition = 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)';

    const currentHeight = sheet.getBoundingClientRect().height;
    const velocity = velocityRef.current; // px/ms

    // Vibración de snap
    const triggerHaptic = () => {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(8);
        } catch {
          /* ignore */
        }
      }
    };

    // Si la velocidad es alta, snap al siguiente punto en esa dirección
    if (Math.abs(velocity) > 0.3) {
      const currentIdx = snapPoints.findIndex(s => s.id === currentSnap);
      let targetIdx;

      if (velocity > 0.3) {
        // Swipe arriba -> snap más alto
        targetIdx = Math.min(currentIdx + 1, snapPoints.length - 1);
      } else {
        // Swipe abajo -> snap más bajo
        targetIdx = Math.max(currentIdx - 1, 0);
      }

      const targetSnap = snapPoints[targetIdx];
      const targetHeight = (targetSnap.height / 100) * window.innerHeight;
      sheet.style.height = `${targetHeight}px`;
      setCurrentSnap(targetSnap.id);
      triggerHaptic();
      onSnapChange?.(targetSnap.id);
      return;
    }

    // Si la velocidad es baja, snap al punto más cercano
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
  }, [isDragging, currentSnap, snapPoints, getSnapHeight, onSnapChange]);

  // Snap programático
  const snapTo = useCallback((id: string) => {
    if (!sheetRef.current || typeof window === 'undefined') return;
    const height = getSnapHeight(id);
    sheetRef.current.style.transition = 'height 0.35s cubic-bezier(0.16, 1, 0.3, 1)';
    sheetRef.current.style.height = `${height}px`;
    setCurrentSnap(id);
    onSnapChange?.(id);
  }, [getSnapHeight, onSnapChange]);

  // Inicializar altura
  useEffect(() => {
    snapTo(initialSnap);
  }, [initialSnap, snapTo]);

  return {
    sheetRef,
    currentSnap,
    isDragging,
    snapTo,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd
    }
  };
}
