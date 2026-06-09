'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Wallet,
  ArrowUpRight, ArrowDownRight, Check,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Client } from '@/lib/store';

/* ─── Custom Tooltip ─── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#002A5C',
        color: '#fff',
        padding: '10px 14px',
        borderRadius: 10,
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        fontSize: 13,
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, opacity: 0.7 }}>
        {label}
      </div>
      {payload.map((p: any, i: number) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: i < payload.length - 1 ? 4 : 0,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: p.color,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12, opacity: 0.8 }}>{p.name}:</span>
          <strong style={{ fontSize: 13 }}>
            C${p.value?.toLocaleString()}
          </strong>
        </div>
      ))}
    </div>
  );
}

/* ─── Donut Center Label ─── */
function DonutCenterLabel({ viewBox, total }: any) {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--lf-text-main)">
        C${total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="var(--lf-text-muted)">
        Total gastos
      </text>
    </g>
  );
}

/* ─── Donut Legend ─── */
function DonutLegend({ payload }: any) {
  const amounts: Record<string, number> = {
    Mantenimiento: 15280,
    Combustible: 9550,
    Repuestos: 7640,
    Otros: 5730,
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        justifyContent: 'center',
        paddingLeft: 12,
      }}
    >
      {payload.map((entry: any, i: number) => {
        const name = entry.value;
        const amt = amounts[name] || 0;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: entry.color,
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--lf-text-main)', fontWeight: 600, minWidth: 90 }}>
              {name}
            </span>
            <span className="font-mono" style={{ color: 'var(--lf-text-muted)', fontSize: 11 }}>
              C${amt.toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Static data ─── */
const DAILY_FINANCIALS = [
  { dia: '1 Jun', ingresos: 4500, gastos: 1200 },
  { dia: '2 Jun', ingresos: 5200, gastos: 1450 },
  { dia: '3 Jun', ingresos: 4800, gastos: 1100 },
  { dia: '4 Jun', ingresos: 6100, gastos: 1800 },
  { dia: '5 Jun', ingresos: 5500, gastos: 1500 },
  { dia: '6 Jun', ingresos: 7200, gastos: 2100 },
  { dia: '7 Jun', ingresos: 6800, gastos: 1950 },
  { dia: '8 Jun', ingresos: 5900, gastos: 1600 },
  { dia: '9 Jun', ingresos: 8100, gastos: 2300 },
  { dia: '10 Jun', ingresos: 7400, gastos: 2000 },
  { dia: '11 Jun', ingresos: 6500, gastos: 1800 },
  { dia: '12 Jun', ingresos: 9200, gastos: 2600 },
  { dia: '13 Jun', ingresos: 8450, gastos: 2400 },
  { dia: '14 Jun', ingresos: 7100, gastos: 1900 },
  { dia: '15 Jun', ingresos: 8800, gastos: 2500 },
  { dia: '16 Jun', ingresos: 9500, gastos: 2700 },
  { dia: '17 Jun', ingresos: 10200, gastos: 2900 },
  { dia: '18 Jun', ingresos: 8900, gastos: 2500 },
  { dia: '19 Jun', ingresos: 7800, gastos: 2200 },
  { dia: '20 Jun', ingresos: 9100, gastos: 2600 },
  { dia: '21 Jun', ingresos: 10500, gastos: 3100 },
  { dia: '22 Jun', ingresos: 9800, gastos: 2800 },
  { dia: '23 Jun', ingresos: 11200, gastos: 3200 },
  { dia: '24 Jun', ingresos: 10100, gastos: 2900 },
  { dia: '25 Jun', ingresos: 12450, gastos: 3820 },
  { dia: '26 Jun', ingresos: 11800, gastos: 3500 },
  { dia: '27 Jun', ingresos: 10900, gastos: 3100 },
  { dia: '28 Jun', ingresos: 13200, gastos: 3800 },
  { dia: '29 Jun', ingresos: 12100, gastos: 3600 },
  { dia: '30 Jun', ingresos: 12800, gastos: 3700 },
];

const GASTOS_BREAKDOWN = [
  { name: 'Mantenimiento', value: 40, color: '#002A5C' },
  { name: 'Combustible', value: 25, color: '#FF6600' },
  { name: 'Repuestos', value: 20, color: '#3B82F6' },
  { name: 'Otros', value: 15, color: '#6B7280' },
];

const ZONA_INGRESOS = [
  { zona: 'Centro', monto: 28500 },
  { zona: 'Villa Fontana', monto: 21200 },
  { zona: 'Los Robles', monto: 18900 },
  { zona: 'Bello Horizonte', monto: 15600 },
  { zona: 'Mons. Lezcano', monto: 12400 },
  { zona: 'Reparto Schick', monto: 8900 },
];

const FLUJO_CAJA = [
  { semana: 'Semana 1', ingresos: 31200, gastos: 9800, neto: 21400, acumulado: 21400 },
  { semana: 'Semana 2', ingresos: 28500, gastos: 8600, neto: 19900, acumulado: 41300 },
  { semana: 'Semana 3', ingresos: 34800, gastos: 10500, neto: 24300, acumulado: 65600 },
  { semana: 'Semana 4', ingresos: 30000, gastos: 9300, neto: 20700, acumulado: 86300 },
];

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  const idRef = useRef(0);
  const showToast = useCallback((msg: string) => {
    const id = ++idRef.current;
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, showToast };
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function ModuleFinanzas() {
  const { paymentConciliations, conciliatePayment, clients } = useStore();
  const { toasts, showToast } = useToast();

  /* Top 10 clients by montoTotal from store */
  const topClientes = useMemo(
    () =>
      [...clients]
        .sort((a, b) => b.montoTotal - a.montoTotal)
        .slice(0, 10)
        .map((c) => ({ nombre: c.nombre, monto: c.montoTotal })),
    [clients]
  );

  const pendingPayments = useMemo(
    () => paymentConciliations.filter((p) => p.estado === 'pendiente'),
    [paymentConciliations]
  );
  const totalPendiente = useMemo(
    () => pendingPayments.reduce((sum, p) => sum + p.monto, 0),
    [pendingPayments]
  );

  /* ─── KPIs ─── */
  const kpis = [
    {
      icon: TrendingUp,
      value: 'C$ 124,500',
      label: 'Ingresos del mes',
      color: '#16A34A',
      trend: '+8% vs mes anterior',
      trendUp: true,
    },
    {
      icon: TrendingDown,
      value: 'C$ 38,200',
      label: 'Gastos operativos',
      color: '#DC2626',
      breakdown: 'Mantenimiento C$15,280 · Combustible C$9,550 · Repuestos C$7,640 · Otros C$5,730',
      trend: null,
      trendUp: false,
    },
    {
      icon: DollarSign,
      value: '69.4%',
      label: 'Margen neto',
      color: '#16A34A',
      trend: null,
      trendUp: true,
    },
    {
      icon: Wallet,
      value: 'C$ 87',
      label: 'Costo promedio por envío',
      color: '#3B82F6',
      trend: null,
      trendUp: false,
    },
  ];

  /* ─── Card wrapper ─── */
  const cardStyle: React.CSSProperties = {
    background: 'var(--lf-surface)',
    border: '1px solid var(--lf-border)',
    borderRadius: 14,
    padding: 20,
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 15,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: 'var(--lf-text-main)',
  };

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '16px 20px',
      }}
      className="lf-scrollbar"
    >
      {/* ─── Header ─── */}
      <h2
        style={{
          fontWeight: 700,
          fontSize: 18,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--lf-text-main)',
        }}
      >
        <DollarSign size={20} style={{ color: '#FF6600' }} /> Centro Financiero
      </h2>

      {/* ═══ KPI Cards ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
        className="lf-finanzas-kpis"
      >
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} style={{ ...cardStyle, padding: '16px 18px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: `${kpi.color}12`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={16} style={{ color: kpi.color }} />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--lf-text-muted)',
                    fontWeight: 500,
                  }}
                >
                  {kpi.label}
                </span>
              </div>

              <div
                className="font-mono"
                style={{
                  fontWeight: 700,
                  fontSize: 28,
                  color: kpi.color === '#DC2626' ? 'var(--lf-text-main)' : kpi.color,
                  lineHeight: 1.1,
                  marginBottom: 6,
                }}
              >
                {kpi.value}
              </div>

              {kpi.trend && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: 11,
                    fontWeight: 700,
                    color: kpi.trendUp ? '#16A34A' : '#DC2626',
                  }}
                >
                  {kpi.trendUp ? (
                    <ArrowUpRight size={12} />
                  ) : (
                    <ArrowDownRight size={12} />
                  )}
                  {kpi.trend}
                </div>
              )}

              {kpi.breakdown && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--lf-text-muted)',
                    lineHeight: 1.5,
                    marginTop: 4,
                  }}
                >
                  {kpi.breakdown}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ Charts Grid ═══ */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
        className="lf-finanzas-charts"
      >
        {/* 1. Ingresos vs Gastos - AreaChart (full width) */}
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={sectionTitleStyle}>
            <TrendingUp size={16} style={{ color: '#FF6600' }} /> Ingresos vs Gastos
            <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--lf-text-muted)', marginLeft: 4 }}>
              (30 días)
            </span>
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={DAILY_FINANCIALS}>
              <defs>
                <linearGradient id="ingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6600" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#FF6600" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gasGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#002A5C" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#002A5C" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 10, fill: 'var(--lf-text-muted)' }}
                interval={4}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }}
                tickFormatter={(v) => `C$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="ingresos"
                name="Ingresos"
                stroke="#FF6600"
                strokeWidth={2}
                fill="url(#ingGrad)"
              />
              <Area
                type="monotone"
                dataKey="gastos"
                name="Gastos"
                stroke="#002A5C"
                strokeWidth={2}
                fill="url(#gasGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Desglose de gastos - DonutChart */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Desglose de Gastos</h3>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ResponsiveContainer width="55%" height={220}>
              <PieChart>
                <Pie
                  data={GASTOS_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  paddingAngle={3}
                  stroke="none"
                >
                  {GASTOS_BREAKDOWN.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any) => [`${v}%`, '']}
                  contentStyle={{
                    background: '#002A5C',
                    border: 'none',
                    borderRadius: 10,
                    fontSize: 12,
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              <DonutLegend
                payload={GASTOS_BREAKDOWN.map((d) => ({
                  value: d.name,
                  color: d.color,
                }))}
              />
            </div>
          </div>
          <div
            style={{
              textAlign: 'center',
              marginTop: 12,
              fontSize: 12,
              color: 'var(--lf-text-muted)',
            }}
          >
            Total:{' '}
            <span className="font-mono" style={{ fontWeight: 700, color: 'var(--lf-text-main)' }}>
              C$38,200
            </span>
          </div>
        </div>

        {/* 3. Ingresos por zona - Horizontal BarChart */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Ingresos por Zona</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ZONA_INGRESOS} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }}
                tickFormatter={(v) => `C$${(v / 1000).toFixed(0)}k`}
              />
              <YAxis
                dataKey="zona"
                type="category"
                tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" name="Ingresos" radius={[0, 6, 6, 0]}>
                {ZONA_INGRESOS.map((_, i) => (
                  <Cell key={i} fill="#FF6600" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Top 10 clientes por facturación - Horizontal BarChart */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Top 10 Clientes por Facturación</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topClientes} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }}
                tickFormatter={(v) => `C$${(v / 1000).toFixed(1)}k`}
              />
              <YAxis
                dataKey="nombre"
                type="category"
                tick={{ fontSize: 10, fill: 'var(--lf-text-muted)' }}
                width={105}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" name="Facturación" radius={[0, 6, 6, 0]}>
                {topClientes.map((_, i) => (
                  <Cell key={i} fill="#002A5C" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Flujo de caja semanal - Table */}
        <div style={cardStyle}>
          <h3 style={sectionTitleStyle}>Flujo de Caja Semanal</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--lf-border)' }}>
                  {['Semana', 'Ingresos', 'Gastos', 'Neto', 'Acumulado'].map(
                    (h) => (
                      <th
                        key={h}
                        style={{
                          padding: '8px 10px',
                          textAlign: h === 'Semana' ? 'left' : 'right',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--lf-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {FLUJO_CAJA.map((row) => (
                  <tr
                    key={row.semana}
                    style={{ borderBottom: '1px solid var(--lf-border)' }}
                  >
                    <td
                      className="font-mono"
                      style={{
                        padding: '10px',
                        fontWeight: 600,
                        fontSize: 13,
                        color: 'var(--lf-text-main)',
                      }}
                    >
                      {row.semana}
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        padding: '10px',
                        fontSize: 13,
                        textAlign: 'right',
                        color: '#16A34A',
                      }}
                    >
                      C${row.ingresos.toLocaleString()}
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        padding: '10px',
                        fontSize: 13,
                        textAlign: 'right',
                        color: '#DC2626',
                      }}
                    >
                      C${row.gastos.toLocaleString()}
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        padding: '10px',
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: row.neto >= 0 ? '#16A34A' : '#DC2626',
                      }}
                    >
                      {row.neto >= 0 ? '+' : '-'}C$
                      {Math.abs(row.neto).toLocaleString()}
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        padding: '10px',
                        fontSize: 13,
                        fontWeight: 700,
                        textAlign: 'right',
                        color: '#FF6600',
                      }}
                    >
                      C${row.acumulado.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══ Payment Conciliation ═══ */}
      <div style={{ marginTop: 20, ...cardStyle }}>
        <h3
          style={{
            ...sectionTitleStyle,
            marginBottom: 12,
          }}
        >
          <Wallet size={16} style={{ color: '#FF6600' }} /> Conciliación de Pagos
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(251,191,36,0.1)',
              color: '#D97706',
              marginLeft: 4,
            }}
          >
            {pendingPayments.length} pendientes
          </span>
        </h3>

        {/* Summary row */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.15)',
          }}
        >
          <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>
            Total pendiente de conciliación:
          </span>
          <span
            className="font-mono"
            style={{
              fontWeight: 700,
              fontSize: 14,
              color: '#D97706',
            }}
          >
            C${totalPendiente.toLocaleString()}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--lf-border)' }}>
                {['Repartidor', 'Monto', 'Fecha', 'Estado', 'Acción'].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 10px',
                        textAlign: h === 'Acción' ? 'center' : 'left',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--lf-text-muted)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paymentConciliations.map((pc) => (
                <tr
                  key={pc.id}
                  style={{ borderBottom: '1px solid var(--lf-border)' }}
                >
                  <td
                    style={{
                      padding: '10px',
                      fontWeight: 600,
                      fontSize: 13,
                      color: 'var(--lf-text-main)',
                    }}
                  >
                    {pc.repartidor}
                  </td>
                  <td
                    className="font-mono"
                    style={{
                      padding: '10px',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--lf-text-main)',
                    }}
                  >
                    C${pc.monto.toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: '10px',
                      fontSize: 13,
                      color: 'var(--lf-text-muted)',
                    }}
                  >
                    {pc.fecha}
                  </td>
                  <td style={{ padding: '10px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background:
                          pc.estado === 'pendiente'
                            ? 'rgba(251,191,36,0.1)'
                            : 'rgba(22,163,74,0.1)',
                        color:
                          pc.estado === 'pendiente' ? '#D97706' : '#16A34A',
                      }}
                    >
                      {pc.estado === 'pendiente' ? 'Pendiente' : 'Conciliado'}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '10px',
                      textAlign: 'center',
                    }}
                  >
                    {pc.estado === 'pendiente' && (
                      <button
                        onClick={() => {
                          conciliatePayment(pc.id);
                          showToast(
                            `✓ Pago de ${pc.repartidor} conciliado (C$${pc.monto.toLocaleString()})`
                          );
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: 6,
                          border: '1px solid #16A34A',
                          background: 'transparent',
                          color: '#16A34A',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#16A34A';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#16A34A';
                        }}
                      >
                        <Check size={12} /> Marcar conciliado
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Toasts ─── */}
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
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: '#16A34A',
              color: '#fff',
              padding: '10px 16px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              maxWidth: 360,
            }}
          >
            <Check size={14} />
            {t.msg}
          </motion.div>
        ))}
      </div>

      {/* ─── Responsive styles ─── */}
      <style jsx global>{`
        @media (max-width: 1024px) {
          .lf-finanzas-kpis {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .lf-finanzas-kpis {
            grid-template-columns: 1fr !important;
          }
          .lf-finanzas-charts {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
