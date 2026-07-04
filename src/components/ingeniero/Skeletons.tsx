// components/ingeniero/Skeletons.tsx
import React from 'react'

export function DashboardSkeleton() {
  return (
    <div className="dashboard-pantalla">
      <div className="lf-skeleton" style={{ width: 200, height: 28, marginBottom: 8 }} />
      <div className="lf-skeleton" style={{ width: 140, height: 16, marginBottom: 24 }} />

      <div className="dashboard-kpis">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="lf-skeleton" style={{ height: 90, borderRadius: 16 }} />
        ))}
      </div>

      <div className="lf-skeleton" style={{ height: 100, borderRadius: 16, marginBottom: 24 }} />

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="lf-skeleton" style={{ height: 60, borderRadius: 14, marginBottom: 8 }} />
      ))}
    </div>
  )
}

export function FlotaSkeleton() {
  return (
    <div className="flota-pantalla" style={{ padding: '0 20px' }}>
      <div className="lf-skeleton" style={{ width: 120, height: 28, marginBottom: 16 }} />
      <div className="lf-skeleton" style={{ height: 48, borderRadius: 14, marginBottom: 16 }} />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="lf-skeleton" style={{ height: 80, borderRadius: 16, marginBottom: 10 }} />
      ))}
    </div>
  )
}

export function MantenimientosSkeleton() {
  return (
    <div className="mantenimientos-pantalla" style={{ padding: '0 20px' }}>
      <div className="lf-skeleton" style={{ width: 180, height: 28, marginBottom: 16 }} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="lf-skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 12 }} />
      ))}
    </div>
  )
}

export function PerfilSkeleton() {
  return (
    <div style={{ padding: '0 20px' }}>
      <div className="lf-skeleton" style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 12px' }} />
      <div className="lf-skeleton" style={{ width: 160, height: 24, margin: '0 auto 8px' }} />
      <div className="lf-skeleton" style={{ width: 100, height: 16, margin: '0 auto 24px' }} />
      <div className="skeleton-stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="lf-skeleton" style={{ height: 70, borderRadius: 14 }} />
        ))}
      </div>
    </div>
  )
}
