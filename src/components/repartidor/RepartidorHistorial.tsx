'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Package, ShoppingBag, AlertTriangle, ChevronRight, Bike, Clock, DollarSign, Route as RouteIcon } from 'lucide-react';
import { useRepartidorStore, type ServicioHistorial } from '@/lib/repartidor-store';

/* ═══════════════════════════════════════════════
   TYPES & HELPERS
   ═══════════════════════════════════════════════ */

type Periodo = 'hoy' | 'semana' | 'mes';
type Filtro = 'todos' | 'envios' | 'compras' | 'incidencias';

const PERIODO_LABEL: Record<Periodo, string> = {
  hoy: 'Hoy',
  semana: 'Semana',
  mes: 'Mes',
};

const ESTADO_SERVICIO_COLOR: Record<string, string> = {
  entregado: 'var(--exito, #00C853)',
  incidencia: 'var(--peligro, #FF1744)',
  cancelado: '#9E9E9E',
};

function getBarData(periodo: Periodo) {
  if (periodo === 'hoy') {
    return [
      { x: '8h', v: 1 },
      { x: '9h', v: 1 },
      { x: '10h', v: 0 },
      { x: '11h', v: 1 },
      { x: '12h', v: 0 },
      { x: '13h', v: 1 },
      { x: '14h', v: 0 },
      { x: '15h', v: 0 },
    ];
  }
  if (periodo === 'semana') {
    return [
      { x: 'L', v: 5 },
      { x: 'M', v: 7 },
      { x: 'X', v: 6 },
      { x: 'J', v: 8 },
      { x: 'V', v: 9 },
      { x: 'S', v: 2 },
      { x: 'D', v: 1 },
    ];
  }
  return [
    { x: 'S1', v: 32 },
    { x: 'S2', v: 41 },
    { x: 'S3', v: 38 },
    { x: 'S4', v: 45 },
  ];
}

/* CountUp animation */
function useCountUp(target: number, duration = 800) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setVal(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setVal(target);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

function formatTiempo(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/* ═══════════════════════════════════════════════
   KPI CARD
   ═══════════════════════════════════════════════ */

interface KpiCardProps {
  label: string;
  value: number;
  format: (v: number) => string;
  trend: number;
  icon: React.ReactNode;
  color: string;
}

function KpiCard({ label, value, format, trend, icon, color }: KpiCardProps) {
  const animated = useCountUp(value, 800);
  const isUp = trend >= 0;
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: 'var(--md-surface)',
        boxShadow: 'var(--md-elevation-1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `color-mix(in srgb, ${color} 12%, transparent)`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </span>
      </div>
      <div
        className="font-mono"
        style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1.1 }}
      >
        {format(animated)}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: isUp ? 'var(--exito, #00C853)' : 'var(--peligro, #FF1744)',
          fontWeight: 600,
        }}
      >
        {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <span>
          {isUp ? '+' : ''}
          {trend}% vs anterior
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SERVICE TIMELINE ROW
   ═══════════════════════════════════════════════ */

function ServicioRow({
  servicio,
  isLast,
  onOpen,
}: {
  servicio: ServicioHistorial;
  isLast: boolean;
  onOpen: (s: ServicioHistorial) => void;
}) {
  const color = ESTADO_SERVICIO_COLOR[servicio.estado] || '#9E9E9E';
  const TipoIcon = servicio.tipo === 'compra' ? ShoppingBag : Package;

  return (
    <button
      onClick={() => onOpen(servicio)}
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '52px 18px 1fr',
        gap: 8,
        padding: '4px 0',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Time */}
      <div
        className="font-mono"
        style={{ fontSize: 13, color: 'var(--text-muted)', paddingTop: 4 }}
      >
        {servicio.hora}
      </div>
      {/* Dot + connector */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 6,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: color,
            boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)`,
            flexShrink: 0,
            zIndex: 1,
          }}
        />
        {!isLast && (
          <span
            style={{
              position: 'absolute',
              top: 16,
              bottom: -8,
              width: 2,
              background: 'var(--md-outline-variant)',
            }}
          />
        )}
      </div>
      {/* Content */}
      <div
        style={{
          padding: 12,
          borderRadius: 14,
          background: 'var(--md-surface)',
          border: '1px solid var(--md-outline-variant)',
          marginBottom: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}
          >
            {servicio.ordenId}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 8px',
              borderRadius: 100,
              background:
                servicio.tipo === 'compra'
                  ? 'var(--md-primary-container)'
                  : 'var(--md-secondary-container)',
              color:
                servicio.tipo === 'compra'
                  ? 'var(--md-on-primary-container)'
                  : 'var(--md-on-secondary-container)',
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            <TipoIcon size={11} />
            {servicio.tipo}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            color: 'var(--text)',
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {servicio.origen}
          </span>
          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {servicio.destino}
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <RouteIcon size={12} />
            <span className="font-mono">{servicio.kmRecorridos.toFixed(1)} km</span>
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <DollarSign size={12} />
            <span className="font-mono">C${servicio.ganancia}</span>
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
            }}
          >
            <Clock size={12} />
            <span className="font-mono">{servicio.tiempoTotal} min</span>
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 100,
                background: `color-mix(in srgb, ${color} 14%, transparent)`,
                color,
                fontSize: 10,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {servicio.estado}
            </span>
          </span>
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorHistorial() {
  const { serviciosHoy, obtenerStats, verServicioDetalle } = useRepartidorStore();
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const stats = obtenerStats(periodo);

  const barData = useMemo(() => getBarData(periodo), [periodo]);

  const serviciosFiltrados = useMemo(() => {
    return serviciosHoy.filter((s) => {
      if (filtro === 'todos') return true;
      if (filtro === 'envios') return s.tipo === 'envio';
      if (filtro === 'compras') return s.tipo === 'compra';
      if (filtro === 'incidencias') return s.estado === 'incidencia';
      return true;
    });
  }, [serviciosHoy, filtro]);

  const today = new Date();
  const fechaStr = today.toLocaleDateString('es-NI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleOpen = (s: ServicioHistorial) => verServicioDetalle(s);

  return (
    <div style={{ paddingBottom: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h1
          className="font-syne"
          style={{ fontSize: 24, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.5px' }}
        >
          {PERIODO_LABEL[periodo] === 'Hoy' ? 'Hoy' : PERIODO_LABEL[periodo]}
        </h1>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textTransform: 'capitalize',
            marginTop: 2,
          }}
        >
          {fechaStr}
        </p>
      </div>

      {/* Period selector pills */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          borderRadius: 100,
          background: 'var(--md-surface-variant)',
          marginBottom: 16,
        }}
      >
        {(['hoy', 'semana', 'mes'] as Periodo[]).map((p) => {
          const isActive = periodo === p;
          return (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 100,
                border: 'none',
                background: isActive ? 'var(--md-surface)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                fontSize: 13,
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                transition: 'background 0.2s ease, color 0.2s ease',
                boxShadow: isActive ? 'var(--md-elevation-1)' : 'none',
              }}
            >
              {PERIODO_LABEL[p]}
            </button>
          );
        })}
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <KpiCard
          label="Entregas"
          value={stats.entregas}
          format={(v) => Math.round(v).toString()}
          trend={12}
          icon={<Bike size={14} />}
          color="var(--primario)"
        />
        <KpiCard
          label="Km recorridos"
          value={stats.km}
          format={(v) => v.toFixed(1)}
          trend={8}
          icon={<RouteIcon size={14} />}
          color="var(--info, #2979FF)"
        />
        <KpiCard
          label="Ganancias"
          value={stats.ganancias}
          format={(v) => `C$${Math.round(v)}`}
          trend={15}
          icon={<DollarSign size={14} />}
          color="var(--exito, #00C853)"
        />
        <KpiCard
          label="Tiempo activo"
          value={stats.tiempoActivo}
          format={(v) => formatTiempo(Math.round(v))}
          trend={-3}
          icon={<Clock size={14} />}
          color="var(--warning, #FFB300)"
        />
      </div>

      {/* Bar chart */}
      <div
        style={{
          padding: 16,
          borderRadius: 16,
          background: 'var(--md-surface)',
          boxShadow: 'var(--md-elevation-1)',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div>
            <div
              className="font-syne"
              style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}
            >
              Entregas
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {periodo === 'hoy' ? 'Por hora' : periodo === 'semana' ? 'Por día' : 'Por semana'}
            </div>
          </div>
        </div>
        <div style={{ height: 120, width: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
              <XAxis
                dataKey="x"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--primario) 8%, transparent)' }}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid var(--md-outline-variant)',
                  background: 'var(--md-surface)',
                  fontSize: 12,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                labelStyle={{ color: 'var(--text)' }}
                formatter={(v: number) => [`${v} entregas`, '']}
              />
              <Bar dataKey="v" radius={[6, 6, 0, 0]} maxBarSize={32}>
                {barData.map((entry, i) => (
                  <Cell
                    key={`cell-${i}`}
                    fill={entry.v === 0 ? 'var(--md-outline-variant)' : 'var(--primario)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filter pills */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 12,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {([
          { k: 'todos' as Filtro, label: 'Todos', icon: null },
          { k: 'envios' as Filtro, label: 'Envíos', icon: <Package size={12} /> },
          { k: 'compras' as Filtro, label: 'Compras', icon: <ShoppingBag size={12} /> },
          { k: 'incidencias' as Filtro, label: 'Incidencias', icon: <AlertTriangle size={12} /> },
        ]).map((f) => {
          const isActive = filtro === f.k;
          return (
            <button
              key={f.k}
              onClick={() => setFiltro(f.k)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 100,
                border: `1px solid ${isActive ? 'var(--primario)' : 'var(--md-outline-variant)'}`,
                background: isActive ? 'color-mix(in srgb, var(--primario) 10%, transparent)' : 'transparent',
                color: isActive ? 'var(--primario)' : 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: isActive ? 700 : 500,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {f.icon}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Services list (timeline) */}
      <div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginBottom: 8,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {serviciosFiltrados.length} servicio{serviciosFiltrados.length !== 1 ? 's' : ''}
        </div>
        <div>
          {serviciosFiltrados.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: 13,
                borderRadius: 16,
                background: 'var(--md-surface)',
                border: '1px dashed var(--md-outline-variant)',
              }}
            >
              No hay servicios para este filtro.
            </div>
          )}
          {serviciosFiltrados.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
            >
              <ServicioRow
                servicio={s}
                isLast={i === serviciosFiltrados.length - 1}
                onOpen={handleOpen}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
