'use client';

import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useStore } from '@/lib/store';

/* ─── Custom Tooltip ─── */
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

export default function ModuleReportes() {
  const { dailyRevenue, monthlyRevenue, zoneOrders, riderPerformance, orderStatusDistribution, motos } = useStore();

  const totalOrders = useMemo(() => orderStatusDistribution.reduce((s, d) => s + d.value, 0), [orderStatusDistribution]);

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '16px 20px' }}>
      <h2 style={{ fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Reportes Avanzados</h2>

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

        {/* 4. Tendencia mensual - full width */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} style={{ color: 'var(--lf-accent)' }} /> Tendencia Mensual
            </h3>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>Últimos 12 meses</span>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={monthlyRevenue}>
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
              <Area type="monotone" dataKey="monto" name="Ingreso" stroke="#FF6600" strokeWidth={2.5} fill="url(#orangeGrad)" />
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

      {/* Responsive */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-reportes-grid > div {
            grid-column: 1 / -1 !important;
          }
        }
      `}</style>
    </div>
  );
}
