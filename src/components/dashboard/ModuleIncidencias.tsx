'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, Clock, MapPin, User, Bike, Check, X, ChevronRight,
  Filter, Shield, ArrowUpDown, FileText, RotateCcw, Eye,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Incident } from '@/lib/store';

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const TIPO_LABELS: Record<Incident['tipo'], string> = {
  falla_mecanica: 'Falla mecánica',
  problema_cliente: 'Problema con cliente',
  accidente: 'Accidente',
  retraso: 'Retraso',
  paquete_danado: 'Paquete dañado',
};

const GRAVEDAD_CONFIG: Record<Incident['gravedad'], { label: string; bg: string; color: string }> = {
  alta: { label: 'Alta', bg: 'rgba(220,38,38,0.12)', color: '#DC2626' },
  media: { label: 'Media', bg: 'rgba(249,115,22,0.12)', color: '#F97316' },
  baja: { label: 'Baja', bg: 'rgba(234,179,8,0.12)', color: '#EAB308' },
};

function timeElapsed(timestamp: string): string {
  const then = new Date(timestamp).getTime();
  const now = new Date('2026-06-10T16:00:00').getTime();
  const diffMin = Math.max(0, Math.floor((now - then) / 60000));
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m > 0 ? `Hace ${h}h ${m}min` : `Hace ${h}h`;
}

function formatDate(ts: string): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hour}:${min}`;
}

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: 'success' | 'info' }>>([]);
  const idRef = useRef(0);
  const showToast = useCallback((msg: string, type: 'success' | 'info' = 'success') => {
    const id = ++idRef.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, showToast };
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

type TabKey = 'activas' | 'historial';
type SortCol = 'fecha' | 'tipo' | 'orden' | 'repartidor' | 'resolucion' | 'tiempo';
type SortDir = 'asc' | 'desc';

export default function ModuleIncidencias() {
  const {
    incidents, riders, resolveIncident, addActivityEvent,
    reassignRider, setActiveModule,
  } = useStore();

  const { toasts, showToast } = useToast();

  /* ─── State ─── */
  const [activeTab, setActiveTab] = useState<TabKey>('activas');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Historial filters
  const [filterTipo, setFilterTipo] = useState<Incident['tipo'] | 'all'>('all');
  const [filterGravedad, setFilterGravedad] = useState<Incident['gravedad'] | 'all'>('all');
  const [filterPeriod, setFilterPeriod] = useState<'hoy' | 'semana' | 'mes' | 'todos'>('todos');
  const [sortCol, setSortCol] = useState<SortCol>('fecha');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  /* ─── Derived data ─── */
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.estado === 'activa'),
    [incidents]
  );

  const resolvedIncidents = useMemo(
    () => incidents.filter((i) => i.estado === 'resuelta'),
    [incidents]
  );

  // Metrics
  const totalThisMonth = incidents.length;
  const avgResolutionTime = useMemo(() => {
    const resolved = incidents.filter((i) => i.tiempoResolucion);
    if (resolved.length === 0) return '—';
    // Parse resolution times like "35 min" or "2h 15min"
    let totalMin = 0;
    for (const inc of resolved) {
      const t = inc.tiempoResolucion!;
      const hMatch = t.match(/(\d+)h/);
      const mMatch = t.match(/(\d+)\s*min/);
      totalMin += (hMatch ? parseInt(hMatch[1]) * 60 : 0) + (mMatch ? parseInt(mMatch[1]) : 0);
    }
    const avg = Math.round(totalMin / resolved.length);
    if (avg < 60) return `${avg} min`;
    return `${Math.floor(avg / 60)}h ${avg % 60}min`;
  }, [incidents]);

  const riderWithMostIncidents = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const inc of incidents) {
      counts[inc.repartidor] = (counts[inc.repartidor] || 0) + 1;
    }
    let maxRider = '—';
    let maxCount = 0;
    for (const [rider, count] of Object.entries(counts)) {
      if (count > maxCount) { maxRider = rider; maxCount = count; }
    }
    return maxRider;
  }, [incidents]);

  const activeCount = activeIncidents.length;
  const resolvedCount = resolvedIncidents.length;

  /* ─── Historial filtered + sorted ─── */
  const filteredHistorial = useMemo(() => {
    let list = [...incidents];

    if (filterTipo !== 'all') list = list.filter((i) => i.tipo === filterTipo);
    if (filterGravedad !== 'all') list = list.filter((i) => i.gravedad === filterGravedad);

    if (filterPeriod === 'hoy') {
      list = list.filter((i) => i.timestamp.startsWith('2026-06-10'));
    } else if (filterPeriod === 'semana') {
      list = list.filter((i) => {
        const d = new Date(i.timestamp);
        return d >= new Date('2026-06-04') && d <= new Date('2026-06-10T23:59:59');
      });
    } else if (filterPeriod === 'mes') {
      list = list.filter((i) => i.timestamp.startsWith('2026-06'));
    }

    list.sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'fecha': cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(); break;
        case 'tipo': cmp = a.tipo.localeCompare(b.tipo); break;
        case 'orden': cmp = a.orderId.localeCompare(b.orderId); break;
        case 'repartidor': cmp = a.repartidor.localeCompare(b.repartidor); break;
        case 'resolucion': cmp = (a.resolucion || '').localeCompare(b.resolucion || ''); break;
        case 'tiempo': {
          const parseMin = (t?: string) => {
            if (!t) return 0;
            const hm = t.match(/(\d+)h/);
            const mm = t.match(/(\d+)\s*min/);
            return (hm ? parseInt(hm[1]) * 60 : 0) + (mm ? parseInt(mm[1]) : 0);
          };
          cmp = parseMin(a.tiempoResolucion) - parseMin(b.tiempoResolucion);
          break;
        }
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [incidents, filterTipo, filterGravedad, filterPeriod, sortCol, sortDir]);

  /* ─── Handlers ─── */
  const handleResolve = (id: string) => {
    if (!resolutionText.trim()) return;
    const inc = incidents.find((i) => i.id === id);
    resolveIncident(id, resolutionText.trim());
    addActivityEvent({
      tipo: 'incidencia',
      titulo: `Incidencia resuelta: ${inc?.titulo || id}`,
      detalle: `${inc?.tipo ? TIPO_LABELS[inc.tipo] : ''} · ${inc?.repartidor || ''} · ${resolutionText.trim()}`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
    setResolutionText('');
    setResolvingId(null);
    showToast(`✓ Incidencia ${id} resuelta`);
  };

  const handleReassign = (inc: Incident) => {
    const availableRiders = riders.filter((r) => r.conectado && r.status === 'available');
    if (availableRiders.length === 0) {
      showToast('No hay repartidores disponibles', 'info');
      return;
    }
    const newRider = availableRiders[0];
    reassignRider(inc.orderId, newRider.nombre, newRider.initials);
    addActivityEvent({
      tipo: 'incidencia',
      titulo: `Orden ${inc.orderId} reasignada`,
      detalle: `De ${inc.repartidor} a ${newRider.nombre} por incidencia`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
    showToast(`✓ ${inc.orderId} reasignada a ${newRider.nombre}`);
  };

  const handleViewMap = () => {
    setActiveModule('overview');
  };

  const handleCreateReport = (inc: Incident) => {
    addActivityEvent({
      tipo: 'incidencia',
      titulo: `Reporte creado: ${inc.titulo}`,
      detalle: `Reporte para orden ${inc.orderId} · ${TIPO_LABELS[inc.tipo]} · Gravedad: ${GRAVEDAD_CONFIG[inc.gravedad].label}`,
      timestamp: new Date().toISOString(),
      leido: false,
    });
    showToast(`📝 Reporte creado para ${inc.id}`, 'info');
  };

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 20px',
        overflow: 'hidden',
      }}
    >
      {/* ═══ HEADER ═══ */}
      <div style={{ marginBottom: 16, flexShrink: 0 }}>
        <h2
          className="font-serif"
          style={{
            fontWeight: 700,
            fontSize: 22,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: 'var(--lf-text-main)',
            letterSpacing: '-0.02em',
          }}
        >
          <Shield size={22} style={{ color: '#DC2626' }} />
          Gestión de Incidencias
        </h2>
        <p style={{ fontSize: 13, color: 'var(--lf-text-muted)', marginTop: 4 }}>
          Monitoreo y resolución de incidencias en tiempo real
        </p>
      </div>

      {/* ═══ METRICS STRIP ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 16,
          flexShrink: 0,
        }}
        className="lf-inc-metrics-grid"
      >
        {[
          { label: 'Total este mes', value: totalThisMonth, icon: AlertTriangle, color: '#DC2626' },
          { label: 'Tiempo prom. resolución', value: avgResolutionTime, icon: Clock, color: '#FF6600' },
          { label: 'Más incidencias', value: riderWithMostIncidents.split(' ')[0], icon: User, color: '#002A5C' },
          { label: 'Activas / Resueltas', value: `${activeCount} / ${resolvedCount}`, icon: Shield, color: activeCount > 0 ? '#DC2626' : '#16A34A' },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: 'var(--lf-surface)',
              border: '1px solid var(--lf-border)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${m.color}10`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <m.icon size={18} style={{ color: m.color }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted)', fontWeight: 600, marginBottom: 2 }}>
                {m.label}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'var(--lf-text-main)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {m.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ TABS ═══ */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          flexShrink: 0,
          borderBottom: '1px solid var(--lf-border)',
          paddingBottom: 0,
        }}
      >
        {[
          { key: 'activas' as TabKey, label: 'Incidencias Activas', count: activeCount, color: '#DC2626' },
          { key: 'historial' as TabKey, label: 'Historial', count: incidents.length, color: '#FF6600' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 700,
              background: activeTab === tab.key ? 'var(--lf-surface)' : 'transparent',
              color: activeTab === tab.key ? tab.color : 'var(--lf-text-muted)',
              borderBottom: activeTab === tab.key ? `2px solid ${tab.color}` : '2px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.15s',
            }}
          >
            {tab.key === 'activas' ? <AlertTriangle size={14} /> : <Clock size={14} />}
            {tab.label}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: 99,
                background: activeTab === tab.key ? `${tab.color}15` : 'var(--lf-bg-base)',
                color: activeTab === tab.key ? tab.color : 'var(--lf-text-muted)',
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'activas' ? (
            <motion.div
              key="activas"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', overflowY: 'auto', paddingRight: 4 }}
              className="lf-scrollbar"
            >
              {/* Empty state */}
              {activeIncidents.length === 0 && (
                <div
                  style={{
                    padding: 60,
                    textAlign: 'center',
                    color: 'var(--lf-text-muted)',
                  }}
                >
                  <Check
                    size={48}
                    style={{ margin: '0 auto 16px', opacity: 0.3, color: '#16A34A' }}
                  />
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6, color: 'var(--lf-text-main)' }}>
                    No hay incidencias activas
                  </div>
                  <div style={{ fontSize: 13 }}>
                    Todas las incidencias han sido resueltas
                  </div>
                </div>
              )}

              {/* Active incident cards */}
              {activeIncidents.map((inc, idx) => {
                const grav = GRAVEDAD_CONFIG[inc.gravedad];
                const isExpanded = expandedId === inc.id;
                const isResolving = resolvingId === inc.id;

                return (
                  <motion.div
                    key={inc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    style={{
                      background: '#DC262608',
                      border: '1px solid rgba(220,38,38,0.12)',
                      borderLeft: '4px solid #DC2626',
                      borderRadius: 12,
                      padding: '16px 18px',
                      marginBottom: 10,
                      transition: 'box-shadow 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(220,38,38,0.08)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
                    }}
                  >
                    {/* Row 1: Title + Severity badge */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <AlertTriangle size={18} style={{ color: '#DC2626', flexShrink: 0 }} />
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: 'var(--lf-text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {TIPO_LABELS[inc.tipo]}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: grav.bg,
                          color: grav.color,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        {grav.label}
                      </span>
                    </div>

                    {/* Row 2: Description */}
                    <div
                      style={{
                        fontSize: 13,
                        color: 'var(--lf-text-muted)',
                        marginBottom: 10,
                        lineHeight: 1.4,
                      }}
                    >
                      {inc.descripcion}
                    </div>

                    {/* Row 3: Info grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                        gap: '6px 16px',
                        fontSize: 12,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--lf-text-muted)' }}>
                        <span className="font-mono" style={{ fontSize: 11, fontWeight: 700, color: '#002A5C' }}>{inc.orderId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--lf-text-muted)' }}>
                        <User size={12} style={{ flexShrink: 0 }} />
                        <span>{inc.repartidor}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--lf-text-muted)' }}>
                        <Bike size={12} style={{ flexShrink: 0 }} />
                        <span>{inc.motoId}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--lf-text-muted)' }}>
                        <MapPin size={12} style={{ flexShrink: 0 }} />
                        <span>{inc.lat.toFixed(4)}, {inc.lng.toFixed(4)}</span>
                      </div>
                    </div>

                    {/* Row 4: Time elapsed */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#DC2626',
                        marginBottom: 12,
                      }}
                    >
                      <Clock size={12} />
                      {timeElapsed(inc.timestamp)}
                    </div>

                    {/* Row 5: Actions */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      <button
                        onClick={() => handleReassign(inc)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--lf-border)',
                          background: 'var(--lf-surface)',
                          color: 'var(--lf-text-main)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#FF6600';
                          (e.currentTarget as HTMLButtonElement).style.color = '#FF6600';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lf-border)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--lf-text-main)';
                        }}
                      >
                        <RotateCcw size={12} /> Reasignar orden
                      </button>

                      <button
                        onClick={() => {
                          setResolvingId(isResolving ? null : inc.id);
                          setResolutionText('');
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: `1px solid ${isResolving ? '#16A34A' : 'var(--lf-border)'}`,
                          background: isResolving ? 'rgba(22,163,74,0.06)' : 'var(--lf-surface)',
                          color: isResolving ? '#16A34A' : 'var(--lf-text-main)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                      >
                        <Check size={12} /> {isResolving ? 'Cancelar' : 'Marcar como resuelta'}
                      </button>

                      <button
                        onClick={handleViewMap}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--lf-border)',
                          background: 'var(--lf-surface)',
                          color: 'var(--lf-text-main)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#002A5C';
                          (e.currentTarget as HTMLButtonElement).style.color = '#002A5C';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lf-border)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--lf-text-main)';
                        }}
                      >
                        <Eye size={12} /> Ver en mapa
                      </button>

                      <button
                        onClick={() => handleCreateReport(inc)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: '1px solid var(--lf-border)',
                          background: 'var(--lf-surface)',
                          color: 'var(--lf-text-main)',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = '#8B5CF6';
                          (e.currentTarget as HTMLButtonElement).style.color = '#8B5CF6';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--lf-border)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--lf-text-main)';
                        }}
                      >
                        <FileText size={12} /> Crear reporte
                      </button>
                    </div>

                    {/* Inline resolution input */}
                    <AnimatePresence>
                      {isResolving && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div
                            style={{
                              marginTop: 12,
                              padding: 12,
                              borderRadius: 10,
                              background: 'rgba(22,163,74,0.04)',
                              border: '1px solid rgba(22,163,74,0.15)',
                            }}
                          >
                            <label
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: '#16A34A',
                                marginBottom: 6,
                                display: 'block',
                              }}
                            >
                              Resolución de la incidencia
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                type="text"
                                value={resolutionText}
                                onChange={(e) => setResolutionText(e.target.value)}
                                placeholder="Describa la resolución aplicada..."
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: 8,
                                  border: '1px solid var(--lf-border)',
                                  background: 'var(--lf-surface)',
                                  color: 'var(--lf-text-main)',
                                  fontSize: 13,
                                  outline: 'none',
                                  fontFamily: 'inherit',
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleResolve(inc.id);
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleResolve(inc.id)}
                                disabled={!resolutionText.trim()}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: 8,
                                  border: 'none',
                                  background: resolutionText.trim() ? '#16A34A' : 'var(--lf-border)',
                                  color: resolutionText.trim() ? '#fff' : 'var(--lf-text-muted)',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: resolutionText.trim() ? 'pointer' : 'not-allowed',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  transition: 'all 0.15s',
                                }}
                              >
                                <Check size={14} /> Confirmar
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            /* ═══ HISTORIAL TAB ═══ */
            <motion.div
              key="historial"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              {/* Filters bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  marginBottom: 12,
                  flexShrink: 0,
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--lf-text-muted)' }}>
                  <Filter size={14} />
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Filtros:</span>
                </div>

                {/* Type filter */}
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value as Incident['tipo'] | 'all')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--lf-border)',
                    background: 'var(--lf-surface)',
                    color: 'var(--lf-text-main)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="all">Todos los tipos</option>
                  <option value="falla_mecanica">Falla mecánica</option>
                  <option value="problema_cliente">Problema con cliente</option>
                  <option value="accidente">Accidente</option>
                  <option value="retraso">Retraso</option>
                  <option value="paquete_danado">Paquete dañado</option>
                </select>

                {/* Severity filter */}
                <select
                  value={filterGravedad}
                  onChange={(e) => setFilterGravedad(e.target.value as Incident['gravedad'] | 'all')}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--lf-border)',
                    background: 'var(--lf-surface)',
                    color: 'var(--lf-text-main)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="all">Toda gravedad</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>

                {/* Period filter */}
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value as typeof filterPeriod)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--lf-border)',
                    background: 'var(--lf-surface)',
                    color: 'var(--lf-text-main)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="todos">Todo el tiempo</option>
                  <option value="hoy">Hoy</option>
                  <option value="semana">Esta semana</option>
                  <option value="mes">Este mes</option>
                </select>

                <span
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--lf-text-muted)',
                    marginLeft: 'auto',
                  }}
                >
                  {filteredHistorial.length} resultado{filteredHistorial.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Table */}
              <div style={{ flex: 1, overflow: 'auto' }} className="lf-scrollbar">
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 13,
                    minWidth: 700,
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: '2px solid var(--lf-border)',
                        position: 'sticky',
                        top: 0,
                        background: 'var(--lf-bg-base)',
                        zIndex: 2,
                      }}
                    >
                      {[
                        { col: 'fecha' as SortCol, label: 'Fecha' },
                        { col: 'tipo' as SortCol, label: 'Tipo' },
                        { col: 'orden' as SortCol, label: 'Orden' },
                        { col: 'repartidor' as SortCol, label: 'Repartidor' },
                        { col: 'resolucion' as SortCol, label: 'Resolución' },
                        { col: 'tiempo' as SortCol, label: 'Tiempo res.' },
                      ].map((h) => (
                        <th
                          key={h.col}
                          onClick={() => toggleSort(h.col)}
                          style={{
                            padding: '8px 12px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'var(--lf-text-muted)',
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            userSelect: 'none',
                            whiteSpace: 'nowrap',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableCellElement).style.color = 'var(--lf-accent)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableCellElement).style.color = 'var(--lf-text-muted)';
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {h.label}
                            <ArrowUpDown
                              size={10}
                              style={{
                                opacity: sortCol === h.col ? 1 : 0.3,
                                transform: sortCol === h.col && sortDir === 'asc' ? 'scaleY(-1)' : 'none',
                                transition: 'all 0.15s',
                              }}
                            />
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistorial.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            padding: 40,
                            textAlign: 'center',
                            color: 'var(--lf-text-muted)',
                            fontSize: 14,
                          }}
                        >
                          No se encontraron incidencias con estos filtros
                        </td>
                      </tr>
                    )}
                    {filteredHistorial.map((inc) => {
                      const grav = GRAVEDAD_CONFIG[inc.gravedad];
                      return (
                        <tr
                          key={inc.id}
                          style={{
                            borderBottom: '1px solid var(--lf-border)',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = 'var(--lf-accent-soft)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                          }}
                        >
                          <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                            <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-main)' }}>
                              {formatDate(inc.timestamp)}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {inc.estado === 'activa' ? (
                                <AlertTriangle size={12} style={{ color: '#DC2626', flexShrink: 0 }} />
                              ) : (
                                <Check size={12} style={{ color: '#16A34A', flexShrink: 0 }} />
                              )}
                              <span style={{ fontWeight: 600, color: 'var(--lf-text-main)' }}>
                                {TIPO_LABELS[inc.tipo]}
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 99,
                                  background: grav.bg,
                                  color: grav.color,
                                }}
                              >
                                {grav.label}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color: '#002A5C' }}>
                              {inc.orderId}
                            </span>
                          </td>
                          <td style={{ padding: '10px 12px', color: 'var(--lf-text-main)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <User size={11} style={{ flexShrink: 0, color: 'var(--lf-text-muted)' }} />
                              {inc.repartidor}
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            {inc.resolucion ? (
                              <span style={{ color: '#16A34A', fontSize: 12, fontWeight: 600 }}>
                                {inc.resolucion}
                              </span>
                            ) : (
                              <span style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <AlertTriangle size={11} /> Pendiente
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '10px 12px' }}>
                            <span className="font-mono" style={{ fontSize: 12, color: inc.tiempoResolucion ? 'var(--lf-text-main)' : 'var(--lf-text-muted)' }}>
                              {inc.tiempoResolucion || '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ TOASTS ═══ */}
      <div
        style={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 300,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: t.type === 'success' ? '#16A34A' : '#002A5C',
                color: '#fff',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                boxShadow: `0 4px 16px ${t.type === 'success' ? 'rgba(22,163,74,0.3)' : 'rgba(0,42,92,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                maxWidth: 340,
              }}
            >
              {t.type === 'success' ? <Check size={14} /> : <AlertTriangle size={14} />}
              {t.msg}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ═══ RESPONSIVE STYLES ═══ */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-inc-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .lf-inc-metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
