'use client';

import React, { useRef, useCallback } from 'react';
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

  // Rastrear toques y arrastres táctiles de forma limpia
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const lastKeyRef = useRef(activeKey);
  lastKeyRef.current = activeKey;

  // Haptic feedback nativo ultrarrápido
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(12);
      }
    } catch {}
  }, []);

  // Encontrar el índice de la pestaña sobre la cual está la coordenada X
  const getTabIndexAtX = useCallback(
    (clientX: number): number => {
      if (!containerRef.current || items.length === 0) return -1;

      // 1. Detección directa por límites de cada botón
      for (let i = 0; i < itemRefs.current.length; i++) {
        const el = itemRefs.current[i];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (clientX >= rect.left && clientX <= rect.right) {
            return i;
          }
        }
      }

      // 2. Si el dedo se sale ligeramente, encontrar el centro más cercano
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

  // Cambio directo de pestaña (para toques inmediatos)
  const selectTab = useCallback(
    (key: string) => {
      if (key === activeKey) return;
      triggerHaptic();
      onChange(key);
    },
    [activeKey, onChange, triggerHaptic]
  );

  // ─── GESTOR DE TOQUES / ARRASTRE TÁCTIL ───
  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX;
    isDraggingRef.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (startXRef.current === null) return;
    const deltaX = Math.abs(e.clientX - startXRef.current);

    // Solo activar arrastre si supera 10px horizontales
    if (deltaX > 10) {
      isDraggingRef.current = true;
      const targetIdx = getTabIndexAtX(e.clientX);
      if (targetIdx >= 0 && targetIdx < items.length) {
        const targetKey = items[targetIdx].key;
        if (targetKey !== lastKeyRef.current) {
          triggerHaptic();
          onChange(targetKey);
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      const targetIdx = getTabIndexAtX(e.clientX);
      if (targetIdx >= 0 && targetIdx < items.length) {
        const targetKey = items[targetIdx].key;
        if (targetKey !== lastKeyRef.current) {
          triggerHaptic();
          onChange(targetKey);
        }
      }
    }
    startXRef.current = null;
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 40);
  };

  const handlePointerCancel = () => {
    startXRef.current = null;
    isDraggingRef.current = false;
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
        const isActive = activeKey === item.key;
        const showBadge = (item.badge || 0) > 0;

        return (
          <button
            key={item.key}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectTab(item.key);
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isActive ? 6 : 0,
              padding: '8px 12px',
              borderRadius: 100,
              border: 'none',
              background: 'transparent',
              color: isActive
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
            {isActive && (
              <motion.div
                layoutId={layoutId}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 100,
                  background: accentColor,
                  boxShadow: isDark
                    ? `0 4px 16px color-mix(in srgb, ${accentColor} 65%, transparent), inset 0 1px 1px rgba(255, 255, 255, 0.25)`
                    : `0 4px 16px color-mix(in srgb, ${accentColor} 45%, transparent), inset 0 1px 1.5px rgba(255, 255, 255, 0.4)`,
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
                transform: isActive ? 'scale(1.06)' : 'scale(1)',
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
            {isActive && (
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
