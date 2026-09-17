'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, AlertTriangle, RotateCcw } from '@/components/icons';

interface Resumen {
  totalVendido: number;
  totalDescuentos: number;
  numVentas: number;
  ticketPromedio: number;
  devoluciones: number;
  montoDevuelto: number;
  totalItems: number;
  productosConStockBajo: number;
}

interface Datos {
  resumen: Resumen;
  porDia: { fecha: string; total: number; ventas: number }[];
  porHora: { hora: number; total: number; ventas: number }[];
  topProductos: { productoId: string | null; nombre: string; cantidad: number; monto: number }[];
  alertasStockBajo: { productoId: string; nombre: string; stock: number; stockMinimo: number }[];
}

const PERIODOS = [
  { dias: 1, label: 'Hoy' },
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 0, label: 'Todo' },
];

const money = (n: number) =>
  `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Estadísticas de tienda: ventas, horas pico y top de productos.
 *
 * Los números salen del mismo libro que la exportación CSV (`VentaPOS` + items) y las
 * devoluciones entran como ventas negativas, así que el total es el dinero real.
 */
export function TiendaEstadisticas({ isDark }: { isDark: boolean }) {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tienda/estadisticas?dias=${dias}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || 'No se pudieron calcular las estadísticas');
        setDatos(null);
        return;
      }
      setDatos(data as Datos);
    } catch {
      setError('Error de red al cargar las estadísticas');
      setDatos(null);
    } finally {
      setLoading(false);
    }
  }, [dias]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const muted = isDark ? '#98989D' : '#8E8E93';
  const grid = isDark ? 'rgba(84,84,88,0.36)' : 'rgba(60,60,67,0.12)';
  const serie = isDark ? '#0A84FF' : '#007AFF';

  const card = (label: string, valor: string, sub?: string, color?: string) => (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '14px 16px',
        minWidth: 150,
        flex: '1 1 160px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 4, color: color || 'var(--text)' }}>{valor}</div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );

  const panel: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <TrendingUp size={19} /> Estadísticas
        </h2>
        <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              onClick={() => setDias(p.dias)}
              style={{
                height: 34,
                padding: '0 14px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: dias === p.dias ? 'var(--primary)' : 'var(--bg-alt)',
                color: dias === p.dias ? '#FFFFFF' : 'var(--text)',
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '6px 0 0' }}>
        Mismo origen que la exportación de ventas del POS; las devoluciones entran como ventas negativas.
      </p>

      {loading && <div style={{ ...panel, color: 'var(--text-muted)', fontSize: 13.5 }}>Calculando…</div>}

      {!loading && error && (
        <div style={{ ...panel, borderColor: 'rgba(239,68,68,.4)', color: '#EF4444', fontSize: 13.5 }}>{error}</div>
      )}

      {!loading && !error && datos && (
        <>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14 }}>
            {card('Vendido', money(datos.resumen.totalVendido))}
            {card('Ventas', String(datos.resumen.numVentas), `${datos.resumen.totalItems} artículos`)}
            {card('Ticket promedio', money(datos.resumen.ticketPromedio))}
            {card(
              'Devuelto',
              money(datos.resumen.montoDevuelto),
              `${datos.resumen.devoluciones} devoluciones`,
              datos.resumen.montoDevuelto > 0 ? '#F59E0B' : undefined
            )}
          </div>

          {datos.resumen.numVentas === 0 ? (
            <div style={{ ...panel, textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Todavía no hay ventas en este período</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                Las cifras aparecen en cuanto registres ventas en la Caja POS (o devoluciones).
              </div>
            </div>
          ) : (
            <>
              <div style={panel}>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Ventas por hora</div>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datos.porHora} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                      <XAxis
                        dataKey="hora"
                        tickFormatter={(h) => `${h}h`}
                        tick={{ fill: muted, fontSize: 10.5 }}
                        axisLine={{ stroke: grid }}
                        tickLine={false}
                        interval={1}
                      />
                      <YAxis tick={{ fill: muted, fontSize: 10.5 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(v) => money(Number(v))}
                        labelFormatter={(h) => `${h}:00 – ${h}:59`}
                        contentStyle={{ background: 'var(--surface)', border: `1px solid ${grid}`, borderRadius: 10, fontSize: 12 }}
                      />
                      <Bar dataKey="total" fill={serie} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {datos.porDia.length > 1 && (
                <div style={panel}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Ventas por día</div>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={datos.porDia} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradVentasTienda" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={serie} stopOpacity={0.45} />
                            <stop offset="100%" stopColor={serie} stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fill: muted, fontSize: 10.5 }} axisLine={{ stroke: grid }} tickLine={false} />
                        <YAxis tick={{ fill: muted, fontSize: 10.5 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          formatter={(v) => money(Number(v))}
                          contentStyle={{ background: 'var(--surface)', border: `1px solid ${grid}`, borderRadius: 10, fontSize: 12 }}
                        />
                        <Area type="monotone" dataKey="total" stroke={serie} strokeWidth={2} fill="url(#gradVentasTienda)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              <div style={panel}>
                <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Top 10 productos</div>
                {datos.topProductos.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin artículos vendidos en el período.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {datos.topProductos.map((p) => {
                      const max = Math.max(...datos.topProductos.map((x) => Math.abs(x.monto)), 1);
                      const pct = Math.max(3, (Math.abs(p.monto) / max) * 100);
                      return (
                        <div key={p.productoId || p.nombre} style={{ fontSize: 12.5 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.nombre}
                            </span>
                            <span style={{ color: 'var(--text-muted)' }}>{p.cantidad} u.</span>
                            <span style={{ fontWeight: 700, minWidth: 86, textAlign: 'right' }}>{money(p.monto)}</span>
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: 'var(--bg-alt)', marginTop: 4 }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: serie }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {datos.alertasStockBajo.length > 0 && (
            <div style={{ ...panel, borderColor: 'rgba(245,158,11,.35)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B' }}>
                <AlertTriangle size={16} /> Stock en o bajo el mínimo
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {datos.alertasStockBajo.map((a) => (
                  <div key={a.productoId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                    <span>{a.nombre}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                      {a.stock} / {a.stockMinimo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={cargar}
            style={{
              marginTop: 14,
              height: 40,
              padding: '0 16px',
              borderRadius: 12,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              color: 'var(--text)',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <RotateCcw size={15} /> Actualizar
          </button>
        </>
      )}
    </div>
  );
}

export default TiendaEstadisticas;
