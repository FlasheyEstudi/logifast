'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

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
  const isDraggingRef = useRef(false);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.key === activeKey)
  );

  // Motion values para el indicador físico
  const pillX = useMotionValue(0);
  const pillWidth = useMotionValue(0);

  // Springs con física exacta de iOS (rápido, sin oscilación excesiva, amortiguación alta)
  const springX = useSpring(pillX, { stiffness: 420, damping: 34, mass: 0.7 });
  const springWidth = useSpring(pillWidth, { stiffness: 420, damping: 34, mass: 0.7 });

  // Actualizar posición de la píldora al cambiar la pestaña activa
  const updatePillPosition = useCallback(
    (index: number, immediate = false) => {
      const el = itemRefs.current[index];
      if (!el || !containerRef.current) return;

      const targetX = el.offsetLeft;
      const targetWidth = el.offsetWidth;

      if (immediate) {
        springX.jump(targetX);
        springWidth.jump(targetWidth);
      } else {
        pillX.set(targetX);
        pillWidth.set(targetWidth);
      }
    },
    [pillX, pillWidth, springX, springWidth]
  );

  // Sincronizar en montaje y cuando cambie activeKey o resize
  useEffect(() => {
    updatePillPosition(activeIndex);

    const handleResize = () => updatePillPosition(activeIndex, true);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeIndex, updatePillPosition]);

  // Haptic feedback nativo de respuesta táctil
  const triggerHaptic = useCallback(() => {
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    } catch {}
  }, []);

  // Encontrar la pestaña más cercana a una coordenada X
  const findClosestIndex = useCallback(
    (clientX: number): number => {
      if (!containerRef.current) return activeIndex;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = clientX - rect.left;

      let closestIdx = 0;
      let minDistance = Infinity;

      itemRefs.current.forEach((el, idx) => {
        if (!el) return;
        const center = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(relativeX - center);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
      });

      return closestIdx;
    },
    [activeIndex]
  );

  // Manejo de gestos táctiles (Drag / Glide en tiempo real)
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    const closest = findClosestIndex(e.clientX);
    if (closest !== activeIndex) {
      triggerHaptic();
      onChange(items[closest].key);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = Math.max(4, Math.min(rect.width - 4, e.clientX - rect.left));

    // Desplazar píldora en tiempo real siguiendo el dedo
    const currentW = pillWidth.get() || 50;
    pillX.set(relativeX - currentW / 2);

    const closest = findClosestIndex(e.clientX);
    if (closest !== activeIndex) {
      triggerHaptic();
      onChange(items[closest].key);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    updatePillPosition(activeIndex);
  };

  return (
    <nav
      ref={containerRef}
      role="tablist"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`select-none touch-none ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px',
        borderRadius: 100,
        background: isDark ? 'rgba(18, 20, 28, 0.82)' : 'rgba(255, 255, 255, 0.85)',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.85)',
        boxShadow: isDark
          ? 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.16), 0 16px 40px rgba(0,0,0,0.55)'
          : 'inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.95), 0 14px 34px rgba(0, 102, 255, 0.10)',
        backdropFilter: 'blur(32px) saturate(190%)',
        WebkitBackdropFilter: 'blur(32px) saturate(190%)',
        boxSizing: 'border-box',
        zIndex: 9990,
      }}
    >
      {/* ─── PÍLDORA DESLIZANTE NATIVA CON FÍSICA SPRING DE IPHONE ─── */}
      <motion.div
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          x: springX,
          width: springWidth,
          borderRadius: 100,
          background: accentColor,
          boxShadow: `0 4px 14px color-mix(in srgb, ${accentColor} 55%, transparent)`,
          zIndex: 1,
          pointerEvents: 'none',
          willChange: 'transform, width',
        }}
      />

      {/* ─── BOTONES DE PESTAÑAS ─── */}
      {items.map((item, idx) => {
        const isActive = activeKey === item.key;
        const showBadge = (item.badge || 0) > 0;

        return (
          <button
            key={item.key}
            ref={(el) => { itemRefs.current[idx] = el; }}
            role="tab"
            aria-selected={isActive}
            aria-label={item.label}
            onClick={(e) => {
              e.stopPropagation();
              triggerHaptic();
              onChange(item.key);
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isActive ? 6 : 0,
              padding: '7px 12px',
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
              zIndex: 2,
              flexShrink: 0,
              flex: 1,
              transition: 'color 0.2s ease',
            }}
          >
            <span
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
                transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
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
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
                style={{
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
