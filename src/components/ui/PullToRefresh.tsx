'use client';

import React from 'react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { scrollRef, pullDistance, isRefreshing, canRefresh, handlers } = usePullToRefresh({
    onRefresh,
    threshold: 75,
    maxPull: 110,
  });

  return (
    <div
      ref={scrollRef}
      className="pull-refresh-container scroll-optimized scroll-container"
      style={{ position: 'relative', width: '100%' }}
      {...handlers}
    >
      {/* Indicador de pull flotante con cristal líquido */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: pullDistance,
          opacity: Math.min(1, pullDistance / 45),
          pointerEvents: 'none',
          zIndex: 40,
          overflow: 'hidden',
          transition: isRefreshing ? 'none' : 'opacity 0.2s ease',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 100,
            background: 'color-mix(in srgb, var(--surface, #ffffff) 88%, transparent)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: canRefresh ? '1px solid rgba(0, 122, 255, 0.4)' : '1px solid var(--border)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), inset 0 1px 1px rgba(255,255,255,0.4)',
            color: canRefresh ? '#007AFF' : 'var(--text-muted)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            fontWeight: 700,
            transform: `scale(${Math.min(1, 0.7 + (pullDistance / 150))})`,
            transition: 'all 0.15s ease',
          }}
        >
          {/* Spinner icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
              transform: isRefreshing ? 'none' : `rotate(${pullDistance * 3.6}deg)`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
          <span>
            {isRefreshing
              ? 'Actualizando...'
              : canRefresh
              ? 'Soltar para actualizar'
              : 'Desliza para actualizar'}
          </span>
        </div>
      </div>

      {/* Contenido con desplazamiento elástico suave */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isRefreshing ? 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)' : 'transform 0.15s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}
