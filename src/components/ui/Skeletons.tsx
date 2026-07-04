'use client';

import React from 'react';

// Skeleton del mapa
export function MapLoadingSkeleton() {
  return (
    <div className="skeleton-map">
      <div className="skeleton-map-tiles" />
      <div className="skeleton-map-center">
        <div className="skeleton-pulse-circle" />
      </div>
    </div>
  );
}

// Skeleton del bottom sheet
export function SheetSkeleton() {
  return (
    <div className="skeleton-sheet">
      <div className="skeleton-handle" />
      <div className="skeleton-lines">
        <div className="lf-skeleton lf-skeleton-title" style={{ height: 24, width: '60%', margin: '0 auto' }} />
        <div className="lf-skeleton lf-skeleton-text" style={{ height: 16, width: '80%', margin: '0 auto' }} />
        <div className="lf-skeleton lf-skeleton-text short" style={{ height: 16, width: '40%', margin: '0 auto' }} />
      </div>
      <div className="skeleton-timeline" style={{ display: 'flex', justifyContent: 'space-around', margin: '20px 0' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-timeline-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="lf-skeleton" style={{ width: 28, height: 28, borderRadius: '50%' }} />
            <div className="lf-skeleton" style={{ width: 48, height: 10, borderRadius: 4 }} />
          </div>
        ))}
      </div>
      <div className="lf-skeleton lf-skeleton-btn" style={{ height: 52, width: '100%', borderRadius: 16 }} />
    </div>
  );
}

// Skeleton del historial
export function HistorialSkeleton() {
  return (
    <div className="skeleton-historial" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats */}
      <div className="skeleton-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="lf-skeleton" style={{ height: 80, borderRadius: 16 }} />
        ))}
      </div>
      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton-historial-item" style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div className="skeleton-historial-timeline" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
              <div className="lf-skeleton" style={{ width: 40, height: 12 }} />
              <div className="lf-skeleton" style={{ width: 10, height: 10, borderRadius: '50%' }} />
              <div className="lf-skeleton" style={{ width: 2, height: 40 }} />
            </div>
            <div className="skeleton-historial-content" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="lf-skeleton lf-skeleton-text" style={{ height: 16, width: '70%' }} />
              <div className="lf-skeleton lf-skeleton-text short" style={{ height: 14, width: '90%' }} />
              <div className="lf-skeleton lf-skeleton-text shorter" style={{ height: 12, width: '40%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton del chat
export function ChatSkeleton() {
  return (
    <div className="skeleton-chat" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`skeleton-chat-msg ${i % 2 === 0 ? 'left' : 'right'}`}
          style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end' }}
        >
          <div className="lf-skeleton" style={{
            width: 140 + (i * 20),
            height: 38,
            borderRadius: 18
          }} />
        </div>
      ))}
    </div>
  );
}

// Skeleton del perfil
export function PerfilSkeleton() {
  return (
    <div className="skeleton-perfil" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="lf-skeleton" style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto' }} />
      <div className="lf-skeleton lf-skeleton-title" style={{ width: 140, height: 20, margin: '0 auto' }} />
      <div className="lf-skeleton" style={{ width: 80, height: 24, borderRadius: 100, margin: '0 auto' }} />
      <div className="skeleton-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="lf-skeleton" style={{ height: 80, borderRadius: 16 }} />
        ))}
      </div>
    </div>
  );
}
