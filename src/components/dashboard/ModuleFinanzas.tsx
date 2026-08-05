'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, BarChart3, Wallet,
  ArrowUpRight, ArrowDownRight, Check, Percent,
} from '@/components/icons';
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

/* ─── Dynamic Data Helpers ─── */
const GASTOS_BREAKDOWN = [
  { name: 'Mantenimiento', value: 35, color: '#002A5C' },
  { name: 'Combustible', value: 30, color: '#FF6600' },
  { name: 'Repuestos', value: 20, color: '#3B82F6' },
  { name: 'Otros', value: 15, color: '#6B7280' },
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
  const { paymentConciliations, conciliatePayment, clients, orders } = useStore();
  const { toasts, showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'valuation'>('overview');
  const [developmentMonths, setDevelopmentMonths] = useState(6);
  const [profitMargin, setProfitMargin] = useState(50);

  /* ─── Real financial stats from /api/admin/finanzas ─── */
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/finanzas')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  // Total monthly operating cost (USD). The /api/admin/finanzas endpoint
  // does not expose a direct USD costos operativos mensuales field yet, so
  // we display '-' per rule 3 until the API provides one.
  // TODO: conectar a /api/admin/finanzas cuando exponga costos operativos USD
  const costoOperativoMensualUsd: number | null =
    stats?.resumen?.totalCostosOperativosMensuales ?? null;

  // Total operational expenses (C$) derived from API revenue minus ganancia.
  const totalGastosReal: number | null = (() => {
    const resumen = stats?.resumen;
    if (!resumen || typeof resumen.totalIngresosEnvios !== 'number' || typeof resumen.totalGananciasEnvios !== 'number') {
      return null;
    }
    return Math.max(0, resumen.totalIngresosEnvios - resumen.totalGananciasEnvios);
  })();

  /* Dynamic financials from real orders */
  const totalIngresosReales = useMemo(
    () => orders.reduce((sum, o) => sum + (o.monto || 0), 0),
    [orders]
  );

  const totalGastosEstimados = useMemo(
    () => Math.round(totalIngresosReales * 0.3),
    [totalIngresosReales]
  );

  const gananciaNetaReales = totalIngresosReales - totalGastosEstimados;
  const margenNetoReal = totalIngresosReales > 0 ? Math.round((gananciaNetaReales / totalIngresosReales) * 100) : 0;

  const DAILY_FINANCIALS = useMemo(() => {
    const today = new Date();
    const days: Array<{ dia: string; ingresos: number; gastos: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
      const dayStr = d.toISOString().split('T')[0];
      const dayOrders = orders.filter((o) => o.fecha === dayStr);
      const ing = dayOrders.reduce((sum, o) => sum + (o.monto || 0), 0);
      const gas = Math.round(ing * 0.3);
      days.push({ dia: label, ingresos: ing, gastos: gas });
    }
    return days;
  }, [orders]);

  const FLUJO_CAJA = useMemo(() => [
    { semana: 'Sem 1', ingresos: Math.round(totalIngresosReales * 0.2), gastos: Math.round(totalGastosEstimados * 0.2), neto: Math.round(gananciaNetaReales * 0.2), acumulado: Math.round(gananciaNetaReales * 0.2) },
    { semana: 'Sem 2', ingresos: Math.round(totalIngresosReales * 0.25), gastos: Math.round(totalGastosEstimados * 0.25), neto: Math.round(gananciaNetaReales * 0.25), acumulado: Math.round(gananciaNetaReales * 0.45) },
    { semana: 'Sem 3', ingresos: Math.round(totalIngresosReales * 0.25), gastos: Math.round(totalGastosEstimados * 0.25), neto: Math.round(gananciaNetaReales * 0.25), acumulado: Math.round(gananciaNetaReales * 0.7) },
    { semana: 'Sem 4', ingresos: Math.round(totalIngresosReales * 0.3), gastos: Math.round(totalGastosEstimados * 0.3), neto: Math.round(gananciaNetaReales * 0.3), acumulado: gananciaNetaReales },
  ], [totalIngresosReales, totalGastosEstimados, gananciaNetaReales]);

  const ZONA_INGRESOS = useMemo(() => {
    const zones: Record<string, number> = {};
    orders.forEach((o) => {
      const z = (o.destino || 'Managua').split(',')[0].trim();
      zones[z] = (zones[z] || 0) + (o.monto || 0);
    });
    const result = Object.entries(zones).map(([zona, monto]) => ({ zona, monto }));
    return result.length > 0 ? result : [{ zona: 'Managua', monto: totalIngresosReales }];
  }, [orders, totalIngresosReales]);

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
      value: `C$ ${totalIngresosReales.toLocaleString()}`,
      label: 'Ingresos del mes',
      color: '#16A34A',
      trend: 'Calculado en vivo',
      trendUp: true,
    },
    {
      icon: TrendingDown,
      value: `C$ ${totalGastosEstimados.toLocaleString()}`,
      label: 'Gastos operativos',
      color: '#DC2626',
      trend: '30% estimado',
      trendUp: false,
    },
    {
      icon: DollarSign,
      value: `C$ ${gananciaNetaReales.toLocaleString()}`,
      label: 'Ganancia neta',
      color: '#002A5C',
      trend: `${margenNetoReal}% margen`,
      trendUp: true,
    },
    {
      icon: Percent,
      value: `${margenNetoReal}%`,
      label: 'Margen de ganancia',
      color: '#FF6600',
      trend: 'Eficiencia operativa',
      trendUp: true,
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

      {/* Tabs Selector */}
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--lf-border)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '3px solid #FF6600' : 'none',
            color: activeTab === 'overview' ? 'var(--lf-text-main)' : 'var(--lf-text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Resumen Financiero
        </button>
        <button
          onClick={() => setActiveTab('valuation')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'valuation' ? '3px solid #FF6600' : 'none',
            color: activeTab === 'valuation' ? 'var(--lf-text-main)' : 'var(--lf-text-muted)',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '13px',
          }}
        >
          Estructura & Valor Comercial (Req 15/16)
        </button>
      </div>

      {activeTab === 'valuation' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Cost Items Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {/* Monthly Operating Costs Sheet */}
            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>Estructura de Costos del Proyecto (Mensual)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--lf-border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>Programador Principal (Tecnológico)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>$1,500.00 USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--lf-border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>Director Logístico (Operaciones)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>$2,000.00 USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--lf-border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>Consumo API Google Maps (Rutas/GPS)</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>$350.00 USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--lf-border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>AWS Cloud Hosting & Base de Datos</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>$150.00 USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--lf-border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>Taller de Mantenimiento Preventivo</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>$250.00 USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--lf-border)', paddingBottom: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>Seguridad de Transacciones & SSL</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>$50.00 USD</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, color: '#FF6600' }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>Total Costos Operativos Mensuales</span>
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {costoOperativoMensualUsd !== null
                      ? `$${costoOperativoMensualUsd.toLocaleString()}.00 USD`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Valuation Slider Card */}
            <div style={cardStyle}>
              <h3 style={sectionTitleStyle}>📈 Simulador de Valor Comercial de la Plataforma</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--lf-text-main)', fontWeight: 600 }}>Meses de Desarrollo Tecnológico</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6600', fontFamily: "'JetBrains Mono', monospace" }}>{developmentMonths} meses</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="24"
                    value={developmentMonths}
                    onChange={(e) => setDevelopmentMonths(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#FF6600' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--lf-text-muted)', marginTop: 4 }}>
                    <span>3 meses</span>
                    <span>12 meses</span>
                    <span>24 meses</span>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--lf-text-main)', fontWeight: 600 }}>Margen Comercial de Venta (ROI)</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#FF6600', fontFamily: "'JetBrains Mono', monospace" }}>+{profitMargin}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="150"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#FF6600' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--lf-text-muted)', marginTop: 4 }}>
                    <span>20% (Mínimo)</span>
                    <span>80%</span>
                    <span>150% (Premium)</span>
                  </div>
                </div>

                <div style={{ borderTop: '1.5px solid var(--lf-border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--lf-text-muted)' }}>Costo Total Acumulado:</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>
                      {costoOperativoMensualUsd !== null
                        ? `$${(costoOperativoMensualUsd * developmentMonths).toLocaleString()} USD`
                        : '-'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--lf-text-main)' }}>Valor Estimado de Venta:</span>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#16A34A', fontFamily: "'JetBrains Mono', monospace" }}>
                      {costoOperativoMensualUsd !== null
                        ? `$${Math.round((costoOperativoMensualUsd * developmentMonths) * (1 + profitMargin / 100)).toLocaleString()} USD`
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Business Layers Overview Card */}
          <div style={cardStyle}>
            <h3 style={sectionTitleStyle}>🌐 Desglose Estratégico de las 4 Capas de Valor del Sistema</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12 }}>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--lf-surface-variant, rgba(0,0,0,0.02))', border: '1px solid var(--lf-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#FF6600', marginBottom: 6 }}>1. Capa Operativa</h4>
                <p style={{ fontSize: 11.5, color: 'var(--lf-text-muted)', lineHeight: 1.4 }}>
                  Módulo de despacho de órdenes, geolocalización en tiempo real, app dedicada para motoristas y panel para clientes comerciales.
                </p>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--lf-surface-variant, rgba(0,0,0,0.02))', border: '1px solid var(--lf-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#FF6600', marginBottom: 6 }}>2. Capa Financiera</h4>
                <p style={{ fontSize: 11.5, color: 'var(--lf-text-muted)', lineHeight: 1.4 }}>
                  Billetera digital de comisiones automáticas por pedido (15%), códigos únicos de recarga y espacio publicitario comercial de $10/mes.
                </p>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--lf-surface-variant, rgba(0,0,0,0.02))', border: '1px solid var(--lf-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#FF6600', marginBottom: 6 }}>3. Infraestructura</h4>
                <p style={{ fontSize: 11.5, color: 'var(--lf-text-muted)', lineHeight: 1.4 }}>
                  Sincronización de base de datos en la nube, consumo controlado de datos, balanceador de carga y APIs de ruteo de mapas integradas.
                </p>
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--lf-surface-variant, rgba(0,0,0,0.02))', border: '1px solid var(--lf-border)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#FF6600', marginBottom: 6 }}>4. Comercialización</h4>
                <p style={{ fontSize: 11.5, color: 'var(--lf-text-muted)', lineHeight: 1.4 }}>
                  Estructura replicable y empaquetada como producto tecnológico SaaS listo para comercialización o venta de franquicias a terceros.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
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

              {(kpi as any).breakdown && (
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--lf-text-muted)',
                    lineHeight: 1.5,
                    marginTop: 4,
                  }}
                >
                  {(kpi as any).breakdown}
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
              {totalGastosReal !== null ? `C$${totalGastosReal.toLocaleString()}` : '-'}
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
      </>
      )}

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
      <style dangerouslySetInnerHTML={{ __html: `
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
      ` }} />
    </div>
  );
}
