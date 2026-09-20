'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

export interface SlidingTabItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface SlidingPillTabBarProps {
  items: SlidingTabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  isDark: boolean;
  accentColor?: string; // Default: var(--primario)
  className?: string;
  ariaLabel?: string;
}

export default function SlidingPillTabBar({
  items,
  activeKey,
  onChange,
  isDark,
  accentColor = 'var(--primario)',
  className = '',
  ariaLabel = 'Barra de navegación',
}: SlidingPillTabBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Estado local para seguimiento visual dinámico sin saturar la app
  const [previewKey, setPreviewKey] = useState(activeKey);
  const previewKeyRef = useRef(activeKey);
  const isDraggingRef = useRef(false);
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const lastPointerUpTimeRef = useRef(0);

  // Mantener previewKeyRef sincronizado
  useEffect(() => {
    previewKeyRef.current = previewKey;
  }, [previewKey]);

  // Sincronizar estado visual si activeKey cambia externamente (ej: navegación interna)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPreviewKey(activeKey);
      previewKeyRef.current = activeKey;
    }
  }, [activeKey]);

  // Encontrar el índice de la pestaña sobre la cual está la coordenada X
  const getTabIndexAtX = useCallback(
    (clientX: number): number => {
      if (!containerRef.current || items.length === 0) return -1;

      // 1. Detección por límites geométricos exactos de cada botón
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (clientX >= rect.left && clientX <= rect.right) {
            return i;
          }
        }
      }

      // 2. Si el dedo se sale ligeramente hacia los extremos, encontrar el más cercano
      let closestIdx = 0;
      let minDistance = Infinity;
      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const center = rect.left + rect.width / 2;
        const dist = Math.abs(clientX - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      return closestIdx;
    },
    [items.length]
  );

  // ─── GESTOS TÁCTILES ESTILO IPHONE (SCRUBBING FLUIDO) ───
  // Mientras arrastras: la cápsula visual sigue tu dedo suavemente.
  // Al soltar: se confirma el módulo seleccionado de forma fija e instantánea.
  // Al tocar: respuesta inmediata sin retraso.
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    isDraggingRef.current = false;

    // Feedback visual inmediato en el punto de contacto inicial
    const initialIdx = getTabIndexAtX(e.clientX);
    if (initialIdx >= 0 && initialIdx < items.length) {
      const initialKey = items[initialIdx].key;
      setPreviewKey(initialKey);
      previewKeyRef.current = initialKey;
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return;
    const deltaX = Math.abs(e.clientX - startXRef.current);
    const deltaY = Math.abs(e.clientY - (startYRef.current ?? 0));

    // Si el usuario desliza verticalmente de forma predominante, cancelar gesto
    if (!isDraggingRef.current && deltaY > 15 && deltaY > deltaX) return;

    // Solo activar scrubbing si el movimiento horizontal supera 10px
    if (deltaX > 10) {
      isDraggingRef.current = true;
      const targetIdx = getTabIndexAtX(e.clientX);
      if (targetIdx >= 0 && targetIdx < items.length) {
        const targetKey = items[targetIdx].key;
        if (previewKeyRef.current !== targetKey) {
          previewKeyRef.current = targetKey;
          setPreviewKey(targetKey);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    lastPointerUpTimeRef.current = Date.now();

    // Determinar la clave final a fijar
    let finalKey = previewKeyRef.current;
    if (!isDraggingRef.current) {
      const targetIdx = getTabIndexAtX(e.clientX);
      if (targetIdx >= 0 && targetIdx < items.length) {
        finalKey = items[targetIdx].key;
      }
    }

    if (finalKey) {
      setPreviewKey(finalKey);
      previewKeyRef.current = finalKey;
      onChange(finalKey);
    }

    startXRef.current = null;
    startYRef.current = null;
    isDraggingRef.current = false;
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    startXRef.current = null;
    startYRef.current = null;
    if (isDraggingRef.current) {
      setPreviewKey(activeKey);
      previewKeyRef.current = activeKey;
      isDraggingRef.current = false;
    }
  };

  // Toque de respaldo (ratón o accesibilidad) si no fue procesado por pointerup
  const handleTabClick = (key: string) => {
    if (Date.now() - lastPointerUpTimeRef.current < 400) return;
    setPreviewKey(key);
    previewKeyRef.current = key;
    onChange(key);
  };

  const layoutId = `pill-${ariaLabel.replace(/[^a-zA-Z0-9]/g, '-')}`;

  return (
    <nav
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`select-none ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px',
        borderRadius: 100,
        background: isDark ? 'rgba(18, 20, 28, 0.84)' : 'rgba(255, 255, 255, 0.88)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: isDark
          ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 16px 40px rgba(0,0,0,0.55)'
          : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), 0 14px 34px rgba(0, 102, 255, 0.10)',
        backdropFilter: 'blur(32px) saturate(190%)',
        WebkitBackdropFilter: 'blur(32px) saturate(190%)',
        boxSizing: 'border-box',
        zIndex: 9990,
        touchAction: 'none',
      }}
    >
      {items.map((item, idx) => {
        const isSelected = previewKey === item.key;
        const showBadge = (item.badge || 0) > 0;

        return (
          <button
            key={item.key}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-label={item.label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTabClick(item.key);
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isSelected ? 6 : 0,
              padding: '8px 12px',
              minHeight: 44,
              borderRadius: 100,
              border: 'none',
              background: 'transparent',
              color: isSelected
                ? '#FFFFFF'
                : isDark
                ? 'rgba(255, 255, 255, 0.65)'
                : 'rgba(28, 28, 30, 0.65)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 700,
              fontFamily: 'var(--ios-font, -apple-system, BlinkMacSystemFont, sans-serif)',
              WebkitTapHighlightColor: 'transparent',
              flexShrink: 0,
              flex: 1,
              zIndex: 2,
              touchAction: 'none',
              transition: 'color 0.18s ease',
            }}
          >
            {/* ─── PÍLDORA DESLIZANTE NATIVA CON FÍSICA SPRING DE IPHONE (GPU ACCELERATED) ─── */}
            {isSelected && (
              <motion.div
                layoutId={layoutId}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 100,
                  background: accentColor,
                  boxShadow: isDark
                    ? '0 4px 16px rgba(0, 102, 255, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.25)'
                    : '0 4px 16px rgba(0, 102, 255, 0.28), inset 0 1px 1.5px rgba(255, 255, 255, 0.4)',
                  zIndex: 0,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 550,
                  damping: 38,
                  mass: 0.5,
                }}
              />
            )}

            {/* Icono con badge */}
            <span
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              {item.icon}

              {showBadge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -7,
                    minWidth: 15,
                    height: 15,
                    borderRadius: 10,
                    background: '#FF3B30',
                    color: '#FFF',
                    fontSize: 8,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    border: isDark ? '2px solid #14141C' : '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(255, 59, 48, 0.4)',
                  }}
                >
                  {(item.badge || 0) > 9 ? '9+' : item.badge}
                </span>
              )}
            </span>

            {/* Texto de la pestaña */}
            {isSelected && (
              <motion.span
                initial={{ opacity: 0, scale: 0.92, x: -3 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.01em',
                }}
              >
                {item.label}
              </motion.span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
