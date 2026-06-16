'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Line, Legend,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, Download,
  Copy, FileDown, ImageIcon, BarChart3, Clock, MapPin, Percent,
  Truck, ChevronDown, X,
} from 'lucide-react';
import { useStore } from '@/lib/store';

/* ─── Toast hook ─── */
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type?: 'success' | 'info' | 'error' }>>([]);
  const showToast = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, showToast };
}

/* ─── Custom Tooltips ─── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#002A5C', color: '#fff', padding: '10px 14px', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>C${p.value?.toLocaleString()}</strong></span>
        </div>
      ))}
    </div>
  );
}

function CustomTooltipCount({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#002A5C', color: '#fff', padding: '10px 14px', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)', fontSize: 13,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
}

/* ─── Cost per KM table data ─── */
const COSTO_POR_KM = [
  { moto: 'Moto-01', costoTotal: 4500, km: 3200, costoKm: 1.41, anomaly: false },
  { moto: 'Moto-02', costoTotal: 6200, km: 2800, costoKm: 2.21, anomaly: true },
  { moto: 'Moto-03', costoTotal: 3800, km: 3100, costoKm: 1.23, anomaly: false },
  { moto: 'Moto-04', costoTotal: 5100, km: 2600, costoKm: 1.96, anomaly: true },
  { moto: 'Moto-05', costoTotal: 7200, km: 3500, costoKm: 2.06, anomaly: true },
];

/* ─── KPI Data ─── */
const KPI_DATA = [
  {
    label: 'Tiempo prom. entrega',
    value: 28,
    unit: 'min',
    trend: -3,
    trendLabel: 'vs sem. anterior',
    benchmark: '35 min (meta)',
    icon: Clock,
    color: '#002A5C',
  },
  {
    label: 'Distancia prom. envío',
    value: 4.2,
    unit: 'km',
    trend: 0.3,
    trendLabel: 'vs sem. anterior',
    benchmark: '5.0 km (prom. zona)',
    icon: MapPin,
    color: '#FF6600',
  },
  {
    label: 'Ingreso por km',
    value: 3.8,
    unit: 'C$/km',
    trend: 0.2,
    trendLabel: 'vs sem. anterior',
    benchmark: '3.5 C$/km (prom.)',
    icon: DollarSign,
    color: '#16A34A',
  },
  {
    label: 'Tasa de incidencias',
    value: 8,
    unit: '%',
    trend: 2,
    trendLabel: 'vs sem. anterior',
    benchmark: '5% (umbral)',
    icon: AlertTriangle,
    color: '#DC2626',
  },
  {
    label: 'Entrega a tiempo',
    value: 92,
    unit: '%',
    trend: 1,
    trendLabel: 'vs sem. anterior',
    benchmark: '90% (meta)',
    icon: Percent,
    color: '#002A5C',
  },
  {
    label: 'Utilización de flota',
    value: 58,
    unit: '%',
    trend: -4,
    trendLabel: 'vs sem. anterior',
    benchmark: '70% (óptimo)',
    icon: Truck,
    color: '#FF6600',
  },
];

/* ─── Pivot Table Data ─── */
const PIVOT_DATA = [
  { zona: 'Centro', ordenes: 45, ingresos: 5850, kmPromedio: 3.8, costoPromedio: 130 },
  { zona: 'Villa Fontana', ordenes: 32, ingresos: 4960, kmPromedio: 5.2, costoPromedio: 155 },
  { zona: 'Los Robles', ordenes: 28, ingresos: 3640, kmPromedio: 3.5, costoPromedio: 130 },
  { zona: 'Bello Horizonte', ordenes: 21, ingresos: 3360, kmPromedio: 6.1, costoPromedio: 160 },
  { zona: 'Monseñor Lezcano', ordenes: 15, ingresos: 1725, kmPromedio: 4.0, costoPromedio: 115 },
  { zona: 'Reparto Schick', ordenes: 12, ingresos: 1380, kmPromedio: 3.2, costoPromedio: 115 },
];

/* ─── Previous Period Data for Monthly Trend ─── */
function getPreviousPeriodData(monthlyRevenue: { mes: string; monto: number }[]) {
  return monthlyRevenue.map((d) => ({
    mes: d.mes,
    montoAnterior: Math.round(d.monto * 0.85),
  }));
}

export default function ModuleReportes() {
  const { dailyRevenue, monthlyRevenue, zoneOrders, riderPerformance, orderStatusDistribution, motos } = useStore();
  const { toasts, showToast } = useToast();

  const totalOrders = useMemo(() => orderStatusDistribution.reduce((s, d) => s + d.value, 0), [orderStatusDistribution]);

  /* ─── Period comparison state ─── */
  const [comparePeriod, setComparePeriod] = useState(false);

  /* ─── Export dropdown state ─── */
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    if (exportOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [exportOpen]);

  /* ─── Merged chart data for period comparison ─── */
  const mergedMonthlyData = useMemo(() => {
    const prev = getPreviousPeriodData(monthlyRevenue);
    return monthlyRevenue.map((d, i) => ({
      mes: d.mes,
      monto: d.monto,
      montoAnterior: comparePeriod ? prev[i]?.montoAnterior : undefined,
    }));
  }, [monthlyRevenue, comparePeriod]);

  /* ─── Period diff ─── */
  const periodDiffPercent = useMemo(() => {
    const currentTotal = monthlyRevenue.reduce((s, d) => s + d.monto, 0);
    const prev = getPreviousPeriodData(monthlyRevenue);
    const prevTotal = prev.reduce((s, d) => s + d.montoAnterior, 0);
    if (prevTotal === 0) return 0;
    return Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
  }, [monthlyRevenue]);

  /* ─── Export: CSV ─── */
  const handleExportCSV = useCallback(() => {
    const headers = 'Día,Monto (C$)\n';
    const rows = dailyRevenue.map((d) => `${d.dia},${d.monto}`).join('\n');
    const csv = headers + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reporte_ingresos_diarios.csv';
    link.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
    showToast('CSV descargado correctamente', 'success');
  }, [dailyRevenue, showToast]);

  /* ─── Export: Clipboard ─── */
  const handleCopyData = useCallback(async () => {
    const text = dailyRevenue.map((d) => `${d.dia}: C$${d.monto.toLocaleString()}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      showToast('Datos copiados al portapapeles', 'success');
    } catch {
      showToast('Error al copiar datos', 'error');
    }
    setExportOpen(false);
  }, [dailyRevenue, showToast]);

  /* ─── Export: Image (placeholder) ─── */
  const handleExportImage = useCallback(() => {
    showToast('Exportar imagen — próximamente', 'info');
    setExportOpen(false);
  }, [showToast]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 20px' }} className="lf-scrollbar">
      {/* ─── Header with Export ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-serif, Georgia, serif)' }}>Reportes Avanzados</h2>
        <div ref={exportRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, border: '1px solid var(--lf-border)',
              background: 'var(--lf-surface)', color: 'var(--lf-text-main)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Download size={14} />
            Exportar
            <ChevronDown size={12} style={{ transform: exportOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>
          {exportOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: 'var(--lf-surface)', border: '1px solid var(--lf-border)',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              zIndex: 50, minWidth: 200, overflow: 'hidden',
            }}>
              <button onClick={handleCopyData} style={dropdownItemStyle}>
                <Copy size={14} /> Copiar datos
              </button>
              <button onClick={handleExportCSV} style={dropdownItemStyle}>
                <FileDown size={14} /> Descargar CSV
              </button>
              <button onClick={handleExportImage} style={dropdownItemStyle}>
                <ImageIcon size={14} /> Descargar imagen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ENHANCEMENT 1: Efficiency KPI Cards
          ═══════════════════════════════════════════ */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: 12,
        marginBottom: 16,
      }} className="kpi-grid">
        {KPI_DATA.map((kpi) => {
          const Icon = kpi.icon;
          const isPositiveTrend = kpi.trend > 0;
          const isNegativeGood = kpi.label === 'Tasa de incidencias' || kpi.label === 'Tiempo prom. entrega';
          const trendIsGood = isNegativeGood ? kpi.trend < 0 : kpi.trend > 0;
          return (
            <div key={kpi.label} style={{
              background: 'var(--lf-surface)',
              border: '1px solid var(--lf-border)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--lf-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{kpi.label}</span>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `${kpi.color}14`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} style={{ color: kpi.color }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span className="font-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--lf-text-main)', lineHeight: 1 }}>
                  {typeof kpi.value === 'number' && kpi.value % 1 !== 0 ? kpi.value.toFixed(1) : kpi.value}
                </span>
                <span style={{ fontSize: 12, color: 'var(--lf-text-muted)', fontWeight: 500 }}>{kpi.unit}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {kpi.trend !== 0 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    fontSize: 11, fontWeight: 600,
                    color: trendIsGood ? 'var(--lf-success)' : 'var(--lf-danger)',
                  }}>
                    {isPositiveTrend ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {isPositiveTrend ? '+' : ''}{kpi.trend}{kpi.unit === '%' ? 'pp' : kpi.unit === 'C$/km' ? ' C$/km' : kpi.unit}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--lf-text-muted)', borderTop: '1px solid var(--lf-border)', paddingTop: 4, marginTop: 2 }}>
                {kpi.benchmark}
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════
          ENHANCEMENT 2: Anomaly Alert Banner
          ═══════════════════════════════════════════ */}
      <div style={{
        background: 'rgba(251,191,36,0.08)',
        border: '1px solid rgba(251,191,36,0.4)',
        borderLeft: '4px solid var(--lf-warning, #FBBF24)',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8,
          background: 'rgba(251,191,36,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <AlertTriangle size={18} style={{ color: 'var(--lf-warning, #FBBF24)' }} />
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--lf-text-main)' }}>
            Tasa de incidencias 8% — por encima del umbral del 5%
          </div>
          <div style={{ fontSize: 11, color: 'var(--lf-text-muted)', marginTop: 2 }}>
            Revisar incidencias activas para reducir la tasa debajo del umbral aceptable
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CHARTS (existing — kept intact)
          ═══════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* 1. Ingresos diarios - full width */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <DollarSign size={16} style={{ color: 'var(--lf-accent)' }} /> Ingresos Diarios
            </h3>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Esta semana</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis dataKey="dia" tick={{ fontSize: 12, fill: 'var(--lf-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} tickFormatter={(v) => `C$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="monto" name="Ingreso" radius={[6, 6, 0, 0]}>
                {dailyRevenue.map((_, i) => (
                  <Cell key={i} fill="#FF6600" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 2. Ordenes por zona */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--lf-primary)' }} /> Órdenes por Zona
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneOrders} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} />
              <YAxis dataKey="zona" type="category" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} width={90} />
              <Tooltip content={<CustomTooltipCount />} />
              <Bar dataKey="cantidad" name="Órdenes" radius={[0, 6, 6, 0]}>
                {zoneOrders.map((_, i) => (
                  <Cell key={i} fill="#002A5C" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. Desempeño repartidores */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} style={{ color: 'var(--lf-accent)' }} /> Desempeño Repartidores
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riderPerformance} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} />
              <YAxis dataKey="nombre" type="category" tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} width={70} />
              <Tooltip content={<CustomTooltipCount />} />
              <Bar dataKey="entregas" name="Entregas" radius={[0, 6, 6, 0]}>
                {riderPerformance.map((_, i) => (
                  <Cell key={i} fill="#FF6600" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 4. Tendencia mensual - full width — ENHANCED with period comparison */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={16} style={{ color: 'var(--lf-accent)' }} /> Tendencia Mensual
              </h3>
              {comparePeriod && (
                <span className="font-mono" style={{
                  fontSize: 12, fontWeight: 700,
                  color: periodDiffPercent >= 0 ? 'var(--lf-success)' : 'var(--lf-danger)',
                  background: periodDiffPercent >= 0 ? 'rgba(22,163,74,0.1)' : 'rgba(220,38,38,0.1)',
                  padding: '2px 8px', borderRadius: 6,
                }}>
                  {periodDiffPercent >= 0 ? '+' : ''}{periodDiffPercent}% vs periodo anterior
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Period Comparison Toggle */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontSize: 12, color: 'var(--lf-text-muted)', cursor: 'pointer',
                userSelect: 'none',
              }}>
                <div style={{
                  width: 36, height: 20, borderRadius: 10,
                  background: comparePeriod ? '#FF6600' : 'var(--lf-border)',
                  position: 'relative', transition: 'background 0.2s',
                  flexShrink: 0,
                }} onClick={() => setComparePeriod(!comparePeriod)}>
                  <div style={{
                    width: 16, height: 16, borderRadius: 8,
                    background: '#fff',
                    position: 'absolute', top: 2,
                    left: comparePeriod ? 18 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }} />
                </div>
                Comparar con periodo anterior
              </label>
              <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Últimos 12 meses</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={mergedMonthlyData}>
              <defs>
                <linearGradient id="orangeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6600" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#FF6600" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--lf-border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--lf-text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--lf-text-muted)' }} tickFormatter={(v) => `C$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              {comparePeriod && (
                <Line
                  type="monotone"
                  dataKey="montoAnterior"
                  name="Periodo Anterior"
                  stroke="#002A5C"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={false}
                  activeDot={{ r: 4, fill: '#002A5C' }}
                />
              )}
              <Area type="monotone" dataKey="monto" name="Ingreso" stroke="#FF6600" strokeWidth={2.5} fill="url(#orangeGrad)" />
              {comparePeriod && <Legend />}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 5. Distribución estados */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            Distribución de Estados
          </h3>
          <div style={{ position: 'relative' }}>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={orderStatusDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                  {orderStatusDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipCount />} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              textAlign: 'center', pointerEvents: 'none',
            }}>
              <div className="font-mono" style={{ fontWeight: 700, fontSize: 24, color: 'var(--lf-text-main)' }}>{totalOrders}</div>
              <div style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>Total</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8 }}>
            {orderStatusDistribution.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                <span style={{ fontSize: 11, color: 'var(--lf-text-muted)' }}>{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Costo por KM */}
        <div style={{ background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} style={{ color: 'var(--lf-warning)' }} /> Costo por KM
          </h3>
          <div style={{ overflow: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--lf-border)' }}>
                  {['Moto', 'Costo Total', 'KM', 'C$/KM', ''].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COSTO_POR_KM.map((row) => (
                  <tr key={row.moto} style={{
                    borderBottom: '1px solid var(--lf-border)',
                    background: row.anomaly ? 'rgba(251,191,36,0.06)' : 'transparent',
                  }}>
                    <td className="font-mono" style={{ padding: '8px 10px', fontWeight: 600, fontSize: 13 }}>{row.moto}</td>
                    <td className="font-mono" style={{ padding: '8px 10px', fontSize: 13 }}>C${row.costoTotal.toLocaleString()}</td>
                    <td className="font-mono" style={{ padding: '8px 10px', fontSize: 13 }}>{row.km.toLocaleString()}</td>
                    <td className="font-mono" style={{ padding: '8px 10px', fontSize: 13, fontWeight: 700, color: row.anomaly ? 'var(--lf-danger)' : 'var(--lf-success)' }}>
                      C${row.costoKm.toFixed(2)}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {row.anomaly && <AlertTriangle size={14} style={{ color: 'var(--lf-warning)' }} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ENHANCEMENT 5: Pivot Table (simplified)
          ═══════════════════════════════════════════ */}
      <div style={{
        background: 'var(--lf-surface)',
        border: '1px solid var(--lf-border)',
        borderRadius: 14,
        padding: 20,
        marginTop: 16,
      }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <BarChart3 size={16} style={{ color: '#002A5C' }} /> Resumen por Zona
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--lf-border)' }}>
                <th style={pivotThStyle}>Zona</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>Órdenes</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>Ingresos</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>KM Promedio</th>
                <th style={{ ...pivotThStyle, textAlign: 'right' }}>Costo Promedio</th>
              </tr>
            </thead>
            <tbody>
              {PIVOT_DATA.map((row, i) => (
                <tr key={row.zona} style={{
                  borderBottom: '1px solid var(--lf-border)',
                  background: i % 2 === 1 ? 'rgba(0,42,92,0.03)' : 'transparent',
                }}>
                  <td style={{ ...pivotTdStyle, fontWeight: 600 }}>{row.zona}</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>{row.ordenes}</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>C${row.ingresos.toLocaleString()}</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>{row.kmPromedio.toFixed(1)} km</td>
                  <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right' }}>C${row.costoPromedio}</td>
                </tr>
              ))}
              {/* Totals row */}
              <tr style={{
                borderTop: '2px solid var(--lf-border)',
                background: 'rgba(0,42,92,0.06)',
              }}>
                <td style={{ ...pivotTdStyle, fontWeight: 700, fontSize: 13 }}>Total</td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  {PIVOT_DATA.reduce((s, r) => s + r.ordenes, 0)}
                </td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  C${PIVOT_DATA.reduce((s, r) => s + r.ingresos, 0).toLocaleString()}
                </td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  {(PIVOT_DATA.reduce((s, r) => s + r.kmPromedio, 0) / PIVOT_DATA.length).toFixed(1)} km
                </td>
                <td className="font-mono" style={{ ...pivotTdStyle, textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                  C${Math.round(PIVOT_DATA.reduce((s, r) => s + r.costoPromedio, 0) / PIVOT_DATA.length)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Toasts ─── */}
      <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            padding: '10px 18px', borderRadius: 10,
            background: t.type === 'error' ? 'var(--lf-danger, #DC2626)' : t.type === 'info' ? '#002A5C' : '#16A34A',
            color: '#fff', fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', gap: 8,
            animation: 'slideInRight 0.3s ease',
          }}>
            {t.type === 'error' ? <X size={14} /> : <Copy size={14} />}
            {t.msg}
          </div>
        ))}
      </div>

      {/* ─── Responsive Styles ─── */}
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .kpi-grid {
          grid-template-columns: repeat(6, 1fr);
        }

        @media (max-width: 1024px) {
          .kpi-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }

        @media (max-width: 640px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: 1fr 1fr"] > div {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}

/* ─── Shared Styles ─── */
const dropdownItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '10px 16px', width: '100%',
  background: 'transparent', border: 'none',
  color: 'var(--lf-text-main)', fontSize: 13,
  cursor: 'pointer', textAlign: 'left',
  transition: 'background 0.15s',
};

const pivotThStyle: React.CSSProperties = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--lf-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
};

const pivotTdStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13,
  color: 'var(--lf-text-main)',
};
