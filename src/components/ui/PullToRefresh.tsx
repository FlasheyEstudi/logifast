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
    threshold: 80,
    maxPull: 120
  });

  return (
    <div
      ref={scrollRef}
      className="pull-refresh-container scroll-optimized scroll-container"
      {...handlers}
    >
      {/* Indicador de pull */}
      <div
        className="pull-refresh-indicator"
        style={{
          height: pullDistance,
          opacity: Math.min(1, pullDistance / 60)
        }}
      >
        <div className={`pull-refresh-spinner ${isRefreshing ? 'spinning' : ''}`}>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke={canRefresh ? 'var(--lf-primario)' : 'var(--text-muted)'}
            strokeWidth="2"
            style={{
              transform: `rotate(${pullDistance * 3}deg)`,
              transition: isRefreshing ? 'transform 0.8s linear' : 'none'
            }}
          >
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
        </div>
        <span className="pull-refresh-text">
          {isRefreshing ? 'Actualizando...' : canRefresh ? 'Soltar para actualizar' : 'Arrastra para actualizar'}
        </span>
      </div>

      {/* Contenido */}
      <div style={{ transform: `translateY(${pullDistance}px)`, transition: isRefreshing ? 'none' : 'transform 0.2s ease' }}>
        {children}
      </div>
    </div>
  );
}
