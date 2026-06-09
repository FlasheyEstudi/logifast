'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Package, Bike, Users, Zap, ArrowRight,
} from 'lucide-react';
import { useStore, type ModuleKey, type Order } from '@/lib/store';

/* ─── Types ─── */

interface SearchResult {
  id: string;
  type: 'order' | 'moto' | 'rider' | 'action';
  label: string;
  detail: string;
  secondary?: string;
  statusBadge?: string;
  statusColor?: string;
  module: ModuleKey;
  order?: Order;
  action?: () => void;
}

/* ─── Actions catalog ─── */

const ACTIONS: SearchResult[] = [
  { id: 'act-new-order', type: 'action', label: 'Crear orden', detail: 'Crear nueva orden de envío', module: 'pedidos' },
  { id: 'act-nueva-orden', type: 'action', label: 'Nueva orden', detail: 'Iniciar orden de entrega', module: 'pedidos' },
  { id: 'act-dispatch', type: 'action', label: 'Centro de despacho', detail: 'Despachar órdenes pendientes', module: 'despacho' },
  { id: 'act-reassign', type: 'action', label: 'Reasignar', detail: 'Reasignar repartidor a orden', module: 'pedidos' },
  { id: 'act-reports', type: 'action', label: 'Ver reportes', detail: 'Reportes avanzados', module: 'reportes' },
  { id: 'act-fleet', type: 'action', label: 'Ver flota', detail: 'Gestión de motos', module: 'flota' },
  { id: 'act-add-moto', type: 'action', label: 'Agregar moto', detail: 'Registrar nueva moto', module: 'flota' },
  { id: 'act-riders', type: 'action', label: 'Repartidores', detail: 'Gestión de repartidores', module: 'repartidores' },
  { id: 'act-finances', type: 'action', label: 'Finanzas', detail: 'Centro financiero', module: 'finanzas' },
  { id: 'act-clients', type: 'action', label: 'Clientes', detail: 'Gestión de clientes', module: 'clientes' },
  { id: 'act-config', type: 'action', label: 'Configuración', detail: 'Ajustes del sistema', module: 'config' },
];

/* ─── Lookup tables ─── */

const TYPE_ICON_MAP: Record<string, typeof Package> = {
  order: Package,
  moto: Bike,
  rider: Users,
  action: Zap,
};

const TYPE_COLOR_MAP: Record<string, string> = {
  order: '#FF6600',
  moto: '#16A34A',
  rider: '#3B82F6',
  action: '#8B5CF6',
};

const TYPE_LABEL_MAP: Record<string, string> = {
  order: 'Órdenes',
  moto: 'Motos',
  rider: 'Repartidores',
  action: 'Acciones',
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: 'Pendiente',
  encamino: 'En camino',
  recogido: 'Recogido',
  entregado: 'Entregado',
  incidencia: 'Incidencia',
  available: 'Disponible',
  'in-service': 'En servicio',
  maintenance: 'Mantenimiento',
  offline: 'Offline',
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: '#FBBF24',
  encamino: '#FF6600',
  recogido: '#3B82F6',
  entregado: '#16A34A',
  incidencia: '#DC2626',
  available: '#16A34A',
  'in-service': '#3B82F6',
  maintenance: '#F59E0B',
  offline: '#6B7280',
};

/* ─── Component ─── */

export default function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    orders,
    motos,
    riders,
    setActiveModule,
    setDetailOrder,
    setCreateOrderOpen,
    setAddMotoOpen,
  } = useStore();

  const [query, setQueryState] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Wrapped setter: always reset selection when query changes
  const setQuery = useCallback((val: string) => {
    setQueryState(val);
    setSelectedIdx(0);
  }, []);

  // Close handler: reset local state
  const closePalette = useCallback(() => {
    setCommandPaletteOpen(false);
    setQueryState('');
    setSelectedIdx(0);
  }, [setCommandPaletteOpen]);

  /* ── Build search results ── */
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return ACTIONS;
    const q = query.toLowerCase();
    const res: SearchResult[] = [];

    // Orders
    for (const o of orders) {
      if (
        o.id.toLowerCase().includes(q) ||
        o.cliente.toLowerCase().includes(q) ||
        o.destino.toLowerCase().includes(q)
      ) {
        res.push({
          id: o.id,
          type: 'order',
          label: o.id,
          detail: `${o.cliente} → ${o.destino}`,
          secondary: `C$ ${o.monto}`,
          statusBadge: STATUS_LABELS[o.estado] ?? o.estado,
          statusColor: STATUS_COLORS[o.estado] ?? '#6B7280',
          module: 'pedidos',
          order: o,
        });
      }
    }

    // Motos
    for (const m of motos) {
      if (
        m.id.toLowerCase().includes(q) ||
        m.nombre.toLowerCase().includes(q) ||
        m.placa.toLowerCase().includes(q) ||
        m.modelo.toLowerCase().includes(q)
      ) {
        res.push({
          id: m.id,
          type: 'moto',
          label: m.nombre,
          detail: `${m.modelo} · ${m.placa}`,
          secondary: m.repartidorAsignado ?? 'Sin asignar',
          statusBadge: STATUS_LABELS[m.status] ?? m.status,
          statusColor: STATUS_COLORS[m.status] ?? '#6B7280',
          module: 'flota',
        });
      }
    }

    // Riders
    for (const r of riders) {
      if (
        r.nombre.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      ) {
        res.push({
          id: r.id,
          type: 'rider',
          label: r.nombre,
          detail: r.email,
          secondary: `${r.entregasHoy} entregas hoy`,
          statusBadge: STATUS_LABELS[r.status] ?? r.status,
          statusColor: STATUS_COLORS[r.status] ?? '#6B7280',
          module: 'repartidores',
        });
      }
    }

    // Actions
    for (const a of ACTIONS) {
      if (a.label.toLowerCase().includes(q) || a.detail.toLowerCase().includes(q)) {
        res.push(a);
      }
    }

    return res.slice(0, 24);
  }, [query, orders, motos, riders]);

  /* ── Focus input when opening ── */
  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [commandPaletteOpen]);

  /* ── Global Cmd+K / Ctrl+K shortcut ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  /* ── Select / execute a result ── */
  const selectItem = useCallback(
    (item: SearchResult) => {
      closePalette();

      if (item.type === 'order') {
        setActiveModule('pedidos');
        if (item.order) setDetailOrder(item.order);
      } else if (item.type === 'moto') {
        setActiveModule('flota');
      } else if (item.type === 'rider') {
        setActiveModule('repartidores');
      } else if (item.type === 'action') {
        // Execute action-specific side-effects
        if (item.id === 'act-new-order' || item.id === 'act-nueva-orden') {
          setActiveModule('pedidos');
          setTimeout(() => setCreateOrderOpen(true), 250);
        } else if (item.id === 'act-add-moto') {
          setActiveModule('flota');
          setTimeout(() => setAddMotoOpen(true), 250);
        } else {
          setActiveModule(item.module);
        }
      }
    },
    [closePalette, setActiveModule, setDetailOrder, setCreateOrderOpen, setAddMotoOpen],
  );

  /* ── Keyboard navigation within the panel ── */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results.length > 0) {
      e.preventDefault();
      setSelectedIdx((idx) => {
        if (results[idx]) selectItem(results[idx]);
        return idx;
      });
    } else if (e.key === 'Escape') {
      closePalette();
    }
  }, [results, selectItem, closePalette]);

  /* ── Group results by type ── */
  const grouped = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    for (const r of results) {
      if (!groups[r.type]) groups[r.type] = [];
      groups[r.type].push(r);
    }
    return groups;
  }, [results]);

  const typeOrder = ['action', 'order', 'moto', 'rider'];

  /* ── Render ── */
  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '15vh',
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={() => closePalette()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{
              width: '100%',
              maxWidth: 600,
              background: 'var(--lf-surface)',
              borderRadius: 16,
              border: '1px solid var(--lf-border)',
              boxShadow:
                '0 25px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.05)',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Search header ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid var(--lf-border)',
              }}
            >
              <Search
                size={20}
                style={{ color: 'var(--lf-muted)', flexShrink: 0 }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar órdenes, motos, repartidores, acciones..."
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: 'var(--lf-text)',
                  fontSize: 18,
                  fontFamily: 'inherit',
                  fontWeight: 400,
                }}
              />
              <kbd
                style={{
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid var(--lf-border)',
                  fontSize: 11,
                  color: 'var(--lf-muted)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  lineHeight: 1,
                }}
              >
                ESC
              </kbd>
            </div>

            {/* ── Results ── */}
            <div
              style={{ maxHeight: 400, overflowY: 'auto' }}
              className="lf-scrollbar"
            >
              {results.length === 0 && (
                <div
                  style={{
                    padding: 40,
                    textAlign: 'center',
                    color: 'var(--lf-muted)',
                    fontSize: 14,
                  }}
                >
                  No se encontraron resultados para &quot;{query}&quot;
                </div>
              )}

              {typeOrder.map((type) => {
                const items = grouped[type];
                if (!items) return null;
                const Icon = TYPE_ICON_MAP[type];
                const color = TYPE_COLOR_MAP[type];

                return (
                  <div key={type}>
                    {/* Type header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '10px 20px 4px',
                        fontSize: 10,
                        fontWeight: 700,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.1em',
                        color: 'var(--lf-muted)',
                      }}
                    >
                      <Icon size={12} style={{ color }} />
                      {TYPE_LABEL_MAP[type]}
                    </div>

                    {/* Items */}
                    {items.map((item) => {
                      const globalIdx = results.indexOf(item);
                      const isActive = globalIdx === selectedIdx;
                      const itemColor = TYPE_COLOR_MAP[item.type];

                      return (
                        <div
                          key={`${item.type}-${item.id}`}
                          onClick={() => selectItem(item)}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 20px',
                            cursor: 'pointer',
                            background: isActive
                              ? 'var(--lf-accent-soft)'
                              : 'transparent',
                            transition: 'background 0.1s ease',
                          }}
                        >
                          {/* Type icon */}
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: `${itemColor}15`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <Icon size={15} style={{ color: itemColor }} />
                          </div>

                          {/* Text */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  fontSize: 14,
                                  color: 'var(--lf-text)',
                                }}
                              >
                                {item.label}
                              </span>
                              {item.statusBadge && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '1px 7px',
                                    borderRadius: 999,
                                    fontSize: 10,
                                    fontWeight: 600,
                                    lineHeight: '16px',
                                    color: item.statusColor ?? '#6B7280',
                                    background: `${item.statusColor ?? '#6B7280'}18`,
                                  }}
                                >
                                  {item.statusBadge}
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: 'var(--lf-muted)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.detail}
                            </div>
                          </div>

                          {/* Secondary info / arrow */}
                          {item.secondary && !isActive && (
                            <span
                              style={{
                                fontSize: 11,
                                color: 'var(--lf-muted)',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {item.secondary}
                            </span>
                          )}
                          {isActive && (
                            <ArrowRight
                              size={14}
                              style={{
                                color: 'var(--lf-accent)',
                                flexShrink: 0,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* ── Footer ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                padding: '10px 20px',
                borderTop: '1px solid var(--lf-border)',
                fontSize: 12,
                color: 'var(--lf-muted)',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              <span>↑↓ navegar</span>
              <span>↵ seleccionar</span>
              <span>esc cerrar</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
