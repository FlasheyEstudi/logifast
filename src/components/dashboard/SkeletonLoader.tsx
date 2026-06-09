'use client';

import { motion } from 'framer-motion';

/* ── Shared shimmer keyframe (injected once) ── */
const shimmerStyle = `
@keyframes lf-shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.lf-skeleton-bone {
  background: linear-gradient(90deg, var(--lf-surface) 25%, var(--lf-border) 37%, var(--lf-surface) 63%);
  background-size: 800px 100%;
  animation: lf-shimmer 1.4s ease-in-out infinite;
  border-radius: 6px;
}
`;

/* ── Reusable bone element ── */
function Bone({ width, height, style }: { width: number | string; height: number | string; style?: React.CSSProperties }) {
  return (
    <div
      className="lf-skeleton-bone"
      style={{ width, height, ...style }}
    />
  );
}

/* ═══════════════════════════════════════════════════
   SkeletonOverview — map rectangle + KPI pills + side panel
   ═══════════════════════════════════════════════════ */
export function SkeletonOverview() {
  return (
    <div style={{ display: 'flex', height: '100%', padding: 16, gap: 16 }}>
      <style>{shimmerStyle}</style>

      {/* Left: map area + KPI strip */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* KPI pills row */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[100, 120, 90, 110, 80].map((w, i) => (
            <Bone key={i} width={w} height={32} style={{ borderRadius: 20 }} />
          ))}
        </div>
        {/* Map placeholder */}
        <Bone width="100%" height="100%" style={{ borderRadius: 12, flex: 1, minHeight: 300 }} />
      </div>

      {/* Right panel */}
      <div style={{ width: 280, display: 'flex', flexDirection: 'column', gap: 12 }} className="lf-skeleton-side-panel">
        {/* Panel header */}
        <Bone width="60%" height={20} />
        {/* Lines */}
        {Array.from({ length: 8 }).map((_, i) => (
          <Bone key={i} width={`${70 + Math.random() * 30}%`} height={14} />
        ))}
        {/* Divider */}
        <div style={{ height: 1, background: 'var(--lf-border)', margin: '4px 0' }} />
        <Bone width="50%" height={20} />
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={`b${i}`} width={`${60 + Math.random() * 35}%`} height={14} />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SkeletonTable — header line + 5-8 row lines
   ═══════════════════════════════════════════════════ */
export function SkeletonTable() {
  const rows = 6;
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      <style>{shimmerStyle}</style>

      {/* Module heading */}
      <Bone width="30%" height={24} style={{ marginBottom: 16 }} />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[80, 100, 70, 90, 60].map((w, i) => (
          <Bone key={i} width={w} height={30} style={{ borderRadius: 20 }} />
        ))}
      </div>

      {/* Table header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 0.8fr',
          gap: 12,
          padding: '10px 0',
          borderBottom: '1px solid var(--lf-border)',
          marginBottom: 4,
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <Bone key={i} width="70%" height={14} />
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr 0.8fr',
            gap: 12,
            padding: '12px 0',
            borderBottom: '1px solid var(--lf-border)',
          }}
        >
          {Array.from({ length: 6 }).map((_, c) => (
            <Bone
              key={c}
              width={`${50 + ((r * 7 + c * 13) % 40)}%`}
              height={13}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SkeletonCards — 2x3 or 3x3 grid of card placeholders
   ═══════════════════════════════════════════════════ */
export function SkeletonCards() {
  return (
    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
      <style>{shimmerStyle}</style>

      {/* Module heading */}
      <Bone width="30%" height={24} />

      {/* Metric strip */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[140, 160, 130, 150].map((w, i) => (
          <Bone key={i} width={w} height={56} style={{ borderRadius: 10 }} />
        ))}
      </div>

      {/* Card grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 14,
          flex: 1,
          alignContent: 'start',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{
              borderRadius: 12,
              border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bone width={32} height={32} style={{ borderRadius: 8 }} />
              <Bone width="55%" height={16} />
            </div>
            {/* Card body lines */}
            <Bone width="80%" height={12} />
            <Bone width="60%" height={12} />
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <Bone width={60} height={24} style={{ borderRadius: 12 }} />
              <Bone width={70} height={24} style={{ borderRadius: 12 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Mapping helper: module → skeleton variant ── */
export type SkeletonVariant = 'overview' | 'table' | 'cards';

export function getSkeletonVariant(moduleKey: string): SkeletonVariant {
  switch (moduleKey) {
    case 'overview':
      return 'overview';
    case 'pedidos':
    case 'flota':
    case 'despacho':
    case 'incidencias':
    case 'config':
      return 'table';
    case 'repartidores':
    case 'finanzas':
    case 'clientes':
    case 'reportes':
    default:
      return 'cards';
  }
}

/* ── Wrapper component that selects the right skeleton ── */
export function SkeletonLoader({ variant }: { variant: SkeletonVariant }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{ height: '100%' }}
    >
      {variant === 'overview' && <SkeletonOverview />}
      {variant === 'table' && <SkeletonTable />}
      {variant === 'cards' && <SkeletonCards />}
    </motion.div>
  );
}
