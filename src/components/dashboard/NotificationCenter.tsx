'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, Bike, Users, AlertTriangle, Settings, DollarSign,
  Bell, CheckCheck,
} from 'lucide-react';
import { useStore, type ActivityEvent } from '@/lib/store';

/* ─── Props ─── */

interface NotificationCenterProps {
  isOpen?: boolean;
  onClose?: () => void;
}

/* ─── Type icon & colour maps ─── */

const TYPE_ICON_MAP: Record<string, typeof Package> = {
  orden: Package,
  flota: Bike,
  repartidor: Users,
  incidencia: AlertTriangle,
  config: Settings,
  finanzas: DollarSign,
};

const TYPE_COLOR_MAP: Record<string, string> = {
  orden: '#FF6600',
  flota: '#16A34A',
  repartidor: '#3B82F6',
  incidencia: '#DC2626',
  config: '#8B5CF6',
  finanzas: '#D97706',
};

/* ─── Filter type ─── */

type FilterType = 'all' | ActivityEvent['tipo'];

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'orden', label: 'Órdenes' },
  { key: 'flota', label: 'Flota' },
  { key: 'incidencia', label: 'Incidencias' },
  { key: 'finanzas', label: 'Finanzas' },
];

/* ─── Relative time formatter ─── */

function formatRelativeTime(ts: string): string {
  const now = new Date('2026-06-10T15:30:00');
  const d = new Date(ts);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `Hace ${diffMin} min`;

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `Hace ${diffHrs}h`;

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays === 1) return 'Ayer';
  return `Hace ${diffDays}d`;
}

/* ─── Day group label ─── */

function getDayGroup(ts: string): string {
  const d = new Date(ts);
  const ref = new Date('2026-06-10T15:30:00');
  const dStr = d.toDateString();
  const refStr = ref.toDateString();

  if (dStr === refStr) return 'Hoy';

  const yesterday = new Date(ref);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dStr === yesterday.toDateString()) return 'Ayer';

  // Same year – use "Día de Mes" format
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  return `${days[d.getDay()]} ${d.getDate()} de ${months[d.getMonth()]}`;
}

/* ─── Timestamp display ─── */

function formatTimestamp(ts: string): string {
  const now = new Date('2026-06-10T15:30:00');
  const d = new Date(ts);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMin / 60);

  const time = d.toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });

  const dStr = d.toDateString();
  const refStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dStr === refStr) {
    // Today: show "Hace X min" for recent, "Hoy HH:MM" otherwise
    if (diffMin < 60) return formatRelativeTime(ts);
    return `Hoy ${time}`;
  }
  if (dStr === yesterday.toDateString()) {
    return `Ayer ${time}`;
  }
  return time;
}

/* ═══════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════ */

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const {
    notificationsOpen,
    setNotificationsOpen,
    activityEvents,
    markEventsAsRead,
  } = useStore();

  // Resolve open state from props or store
  const open = isOpen ?? notificationsOpen;
  const close = onClose ?? (() => setNotificationsOpen(false));

  const [filter, setFilter] = useState<FilterType>('all');
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = activityEvents.filter((e) => !e.leido).length;

  /* ── Close on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        close();
      }
    };
    if (open) {
      setTimeout(() => document.addEventListener('mousedown', handler), 0);
    }
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  /* ── Filtered & grouped events ── */
  const filtered = useMemo(
    () =>
      filter === 'all'
        ? [...activityEvents].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
          )
        : [...activityEvents]
            .filter((e) => e.tipo === filter)
            .sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
            ),
    [activityEvents, filter],
  );

  const grouped = useMemo(() => {
    const groups: { label: string; events: ActivityEvent[] }[] = [];
    const map = new Map<string, ActivityEvent[]>();

    for (const ev of filtered) {
      const day = getDayGroup(ev.timestamp);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(ev);
    }

    map.forEach((events, label) => {
      groups.push({ label, events });
    });

    return groups;
  }, [filtered]);

  /* ── Render ── */
  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell trigger (only shown when props are NOT provided — i.e. standalone mode) */}
      {isOpen === undefined && (
        <button
          onClick={() => setNotificationsOpen(!notificationsOpen)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            border: '1px solid var(--lf-border)',
            background: 'var(--lf-surface)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            color: 'var(--lf-muted)',
            transition: 'all 0.15s',
          }}
          aria-label="Notificaciones"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: '#DC2626',
                color: '#fff',
                fontSize: 9,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
                lineHeight: 1,
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: isOpen === undefined ? 44 : 0,
              right: 0,
              width: 380,
              background: 'var(--lf-surface)',
              border: '1px solid var(--lf-border)',
              borderRadius: 12,
              boxShadow:
                '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              overflow: 'hidden',
              zIndex: 200,
            }}
          >
            {/* ── Header ── */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: '1px solid var(--lf-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} style={{ color: 'var(--lf-accent)' }} />
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: 'var(--lf-text)',
                  }}
                >
                  Notificaciones
                </span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: 'var(--lf-accent-soft)',
                      color: 'var(--lf-accent)',
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markEventsAsRead}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--lf-border)',
                    background: 'transparent',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--lf-muted)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--lf-accent-soft)';
                    e.currentTarget.style.color = 'var(--lf-accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--lf-muted)';
                  }}
                >
                  <CheckCheck size={13} />
                  Marcar todo como leído
                </button>
              )}
            </div>

            {/* ── Filter pills ── */}
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '10px 16px',
                borderBottom: '1px solid var(--lf-border)',
                flexWrap: 'wrap',
              }}
            >
              {FILTER_OPTIONS.map((opt) => {
                const isActive = filter === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFilter(opt.key)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      border: '1px solid',
                      borderColor: isActive
                        ? 'var(--lf-accent)'
                        : 'var(--lf-border)',
                      background: isActive
                        ? 'var(--lf-accent)'
                        : 'transparent',
                      color: isActive ? '#fff' : 'var(--lf-muted)',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      lineHeight: '16px',
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {/* ── Event list ── */}
            <div
              style={{ maxHeight: 400, overflowY: 'auto' }}
              className="lf-scrollbar"
            >
              {grouped.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--lf-muted)',
                    fontSize: 13,
                  }}
                >
                  No hay notificaciones
                </div>
              )}

              {grouped.map(({ label, events }) => (
                <div key={label}>
                  {/* Day header */}
                  <div
                    style={{
                      padding: '10px 16px 4px',
                      fontSize: 11,
                      fontWeight: 700,
                      color: 'var(--lf-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {label}
                  </div>

                  {/* Events */}
                  {events.map((ev) => {
                    const Icon = TYPE_ICON_MAP[ev.tipo] || Package;
                    const color = TYPE_COLOR_MAP[ev.tipo] || '#6B7280';

                    return (
                      <div
                        key={ev.id}
                        style={{
                          display: 'flex',
                          gap: 12,
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--lf-border)',
                          background: ev.leido
                            ? 'transparent'
                            : 'rgba(59,130,246,0.04)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                          position: 'relative',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            'var(--lf-accent-soft)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = ev.leido
                            ? 'transparent'
                            : 'rgba(59,130,246,0.04)';
                        }}
                      >
                        {/* Unread dot */}
                        {!ev.leido && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 16,
                              left: 6,
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: '#3B82F6',
                              flexShrink: 0,
                            }}
                          />
                        )}

                        {/* Type icon */}
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: `${color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={15} style={{ color }} />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 14,
                              color: 'var(--lf-text)',
                              lineHeight: 1.3,
                            }}
                          >
                            {ev.titulo}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: 'var(--lf-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: 2,
                            }}
                          >
                            {ev.detalle}
                          </div>
                        </div>

                        {/* Timestamp */}
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--lf-muted)',
                            flexShrink: 0,
                            whiteSpace: 'nowrap',
                            marginTop: 2,
                            fontFamily:
                              'ui-monospace, SFMono-Regular, Menlo, monospace',
                          }}
                        >
                          {formatTimestamp(ev.timestamp)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* ── Footer ── */}
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid var(--lf-border)',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--lf-muted)',
                  fontWeight: 500,
                }}
              >
                {filtered.length} notificación{filtered.length !== 1 ? 'es' : ''}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
