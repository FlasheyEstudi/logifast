'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, RotateCcw, FileSpreadsheet, Download, Clock, Calendar } from '@/components/icons';
import { notify } from '@/lib/notify';
import { descargarReporteTienda } from '@/lib/tienda/descarga-cliente';

interface Resumen {
  totalVendido: number;
  totalDescuentos: number;
  numVentas: number;
  ticketPromedio: number;
  devoluciones: number;
  montoDevuelto: number;
  totalItems: number;
  productosConStockBajo: number;
  mejorDia: { fecha: string; total: number } | null;
  horaPico: { hora: number; total: number } | null;
}

interface Comparacion {
  hayDatos: boolean;
  etiqueta: string;
  variacionVendido: number | null;
  variacionVentas: number | null;
  variacionTicket: number | null;
}

interface Datos {
  tienda: { id: string; nombre: string };
  rango: { dias: number };
  resumen: Resumen;
  comparacion: Comparacion;
  porDia: { fecha: string; total: number; ventas: number }[];
  porHora: { hora: number; total: number; ventas: number }[];
  porMetodo: { metodo: string; total: number; ventas: number }[];
  topProductos: { productoId: string | null; nombre: string; cantidad: number; monto: number }[];
  alertasStockBajo: { productoId: string; nombre: string; stock: number; stockMinimo: number }[];
}

const PERIODOS = [
  { dias: 1, label: 'Hoy' },
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 0, label: 'Todo' },
];

/** Paleta fija: legible en claro y oscuro, sin depender de los tokens de tema. */
const PALETA = ['var(--primario)', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A', '#64D2FF'];

const money = (n: number) =>
  `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const metodoLegible = (m: string) =>
  ({ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', fiado: 'Fiado', devolucion: 'Devoluciones' }[m] || m);

/**
 * Panel de la tienda: cifras del período, comparación con el anterior, horas pico,
 * formas de pago, top de productos y alertas de inventario. Todo sale del mismo libro
 * que los reportes XLSX/PDF, así que la pantalla y el archivo siempre cuadran.
 */
export function TiendaEstadisticas({ isDark }: { isDark: boolean }) {
  const [dias, setDias] = useState(30);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);

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

  const descargar = async (formato: 'xlsx' | 'pdf') => {
    setDescargando(formato);
    try {
      const nombre = await descargarReporteTienda('ventas', formato, dias);
      notify.success(`Descargado: ${nombre}`);
    } catch {
      notify.error('No se pudo generar el reporte');
    } finally {
      setDescargando(null);
    }
  };

  const muted = isDark ? '#98989D' : '#8E8E93';
  const grid = isDark ? 'rgba(84,84,88,0.36)' : 'rgba(60,60,67,0.12)';
  const serie = isDark ? 'var(--primario)' : 'var(--primario)';

  const tooltip = {
    contentStyle: {
      background: 'var(--surface)',
      border: `1px solid ${grid}`,
      borderRadius: 10,
      fontSize: 12,
      color: 'var(--text)',
    },
  };

  const Variacion = ({ valor, etiqueta }: { valor: number | null; etiqueta: string }) => {
    if (valor === null || !Number.isFinite(valor)) {
      return <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{etiqueta}</span>;
    }
    const sube = valor >= 0;
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11.5,
          fontWeight: 700,
          color: sube ? 'var(--exito)' : 'var(--peligro)',
        }}
      >
        {sube ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {sube ? '+' : ''}
        {valor.toFixed(1)}%
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{etiqueta}</span>
      </span>
    );
  };

  const tarjeta = (
    etiqueta: string,
    valor: string,
    pie: React.ReactNode,
    color?: string
  ) => (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{etiqueta}</div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: color || 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {valor}
      </div>
      {pie}
    </div>
  );

  const panel: React.CSSProperties = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 16,
    minWidth: 0,
  };

  const etiquetaVariacion = datos?.comparacion.hayDatos ? datos.comparacion.etiqueta : 'sin datos previos';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ─── Encabezado y período ─── */}
      <div className="flex flex-wrap items-center gap-3">
        <div style={{ minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={19} /> Panel de la tienda
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
            Mismo origen que los reportes XLSX/PDF y la exportación CSV: las devoluciones restan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              onClick={() => setDias(p.dias)}
              style={{
                height: 44,
                padding: '0 16px',
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

      {loading && <div style={{ ...panel, color: 'var(--text-muted)', fontSize: 13.5 }}>Calculando…</div>}

      {!loading && error && (
        <div style={{ ...panel, borderColor: 'rgba(239,68,68,.4)', color: 'var(--peligro)', fontSize: 13.5 }}>{error}</div>
      )}

      {!loading && !error && datos && (
        <>
          {/* ─── Cifras principales ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {tarjeta(
              'Vendido neto',
              money(datos.resumen.totalVendido),
              <Variacion valor={datos.comparacion.variacionVendido} etiqueta={etiquetaVariacion} />
            )}
            {tarjeta(
              'Comprobantes',
              String(datos.resumen.numVentas),
              <Variacion valor={datos.comparacion.variacionVentas} etiqueta={etiquetaVariacion} />
            )}
            {tarjeta(
              'Ticket promedio',
              money(datos.resumen.ticketPromedio),
              <Variacion valor={datos.comparacion.variacionTicket} etiqueta={etiquetaVariacion} />
            )}
            {tarjeta(
              'Devuelto',
              money(datos.resumen.montoDevuelto),
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {datos.resumen.devoluciones} devolución(es) · {datos.resumen.totalItems} artículos vendidos
              </span>,
              datos.resumen.montoDevuelto > 0 ? '#F59E0B' : undefined
            )}
          </div>

          {/* ─── Datos secundarios ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tarjeta(
              'Mejor día',
              datos.resumen.mejorDia ? money(datos.resumen.mejorDia.total) : '—',
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Calendar size={13} /> {datos.resumen.mejorDia?.fecha || 'sin ventas aún'}
              </span>
            )}
            {tarjeta(
              'Hora pico',
              datos.resumen.horaPico ? `${datos.resumen.horaPico.hora}:00` : '—',
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} /> {datos.resumen.horaPico ? money(datos.resumen.horaPico.total) : 'sin ventas aún'}
              </span>
            )}
            {tarjeta(
              'Stock en o bajo el mínimo',
              String(datos.resumen.productosConStockBajo),
              <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                {datos.resumen.productosConStockBajo > 0 ? 'revisa Inventario' : 'todo en orden'}
              </span>,
              datos.resumen.productosConStockBajo > 0 ? '#F59E0B' : 'var(--exito)'
            )}
          </div>

          {datos.resumen.numVentas === 0 ? (
            <div style={{ ...panel, textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>Todavía no hay ventas en este período</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                Las cifras y las gráficas aparecen en cuanto registres ventas en la Caja POS (o devoluciones).
              </div>
            </div>
          ) : (
            <>
              {/* ─── Gráficas de tiempo ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
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
                        <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(h) => `${h}:00 – ${h}:59`} {...tooltip} />
                        <Bar dataKey="total" fill={serie} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div style={panel}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Ventas por día</div>
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={datos.porDia} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradPanelVentas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={serie} stopOpacity={0.45} />
                            <stop offset="100%" stopColor={serie} stopOpacity={0.03} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                        <XAxis dataKey="fecha" tick={{ fill: muted, fontSize: 10.5 }} axisLine={{ stroke: grid }} tickLine={false} />
                        <YAxis tick={{ fill: muted, fontSize: 10.5 }} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v) => money(Number(v))} {...tooltip} />
                        <Area type="monotone" dataKey="total" stroke={serie} strokeWidth={2} fill="url(#gradPanelVentas)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* ─── Top productos y formas de pago ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div style={panel}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Top 10 productos</div>
                  {datos.topProductos.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin artículos vendidos en el período.</div>
                  ) : (
                    <div style={{ height: Math.max(180, datos.topProductos.length * 26 + 20) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={datos.topProductos.map((p) => ({
                            nombre: p.nombre.length > 22 ? `${p.nombre.slice(0, 21)}…` : p.nombre,
                            monto: p.monto,
                            cantidad: p.cantidad,
                          }))}
                          layout="vertical"
                          margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                          <XAxis type="number" tick={{ fill: muted, fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis
                            type="category"
                            dataKey="nombre"
                            width={130}
                            tick={{ fill: muted, fontSize: 10.5 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            formatter={(v, _n, item) =>
                              [`${money(Number(v))} · ${(item?.payload as { cantidad?: number })?.cantidad ?? 0} u.`, 'Vendido']
                            }
                            {...tooltip}
                          />
                          <Bar dataKey="monto" fill={serie} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div style={panel}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 10 }}>Formas de pago</div>
                  {datos.porMetodo.length === 0 ? (
                    <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin cobros registrados en el período.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 190, height: 190, flex: '0 0 auto' }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={datos.porMetodo.map((m) => ({ name: metodoLegible(m.metodo), value: Math.abs(m.total) }))}
                              dataKey="value"
                              innerRadius={48}
                              outerRadius={78}
                              paddingAngle={2}
                            >
                              {datos.porMetodo.map((_, i) => (
                                <Cell key={i} fill={PALETA[i % PALETA.length]} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v) => money(Number(v))} {...tooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ flex: '1 1 160px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {datos.porMetodo.map((m, i) => (
                          <div key={m.metodo} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: PALETA[i % PALETA.length],
                                flex: '0 0 auto',
                              }}
                            />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {metodoLegible(m.metodo)}
                            </span>
                            <span style={{ color: 'var(--text-muted)', fontSize: 11.5 }}>{m.ventas}</span>
                            <span style={{ fontWeight: 700 }}>{money(m.total)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ─── Alertas de inventario ─── */}
          {datos.alertasStockBajo.length > 0 && (
            <div style={{ ...panel, borderColor: 'rgba(245,158,11,.35)' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: '#F59E0B' }}>
                <AlertTriangle size={16} /> Stock en o bajo el mínimo
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" style={{ marginTop: 10 }}>
                {datos.alertasStockBajo.map((a) => (
                  <div key={a.productoId} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5 }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.nombre}</span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                      {a.stock} / {a.stockMinimo}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Descargas y refresco ─── */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => descargar('xlsx')}
              disabled={descargando !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 16px',
                borderRadius: 12,
                border: 'none',
                background: 'var(--primario)',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: 13,
                cursor: descargando ? 'wait' : 'pointer',
              }}
            >
              <FileSpreadsheet size={16} /> {descargando === 'xlsx' ? 'Generando…' : 'Reporte Excel'}
            </button>
            <button
              onClick={() => descargar('pdf')}
              disabled={descargando !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                color: 'var(--text)',
                fontWeight: 700,
                fontSize: 13,
                cursor: descargando ? 'wait' : 'pointer',
              }}
            >
              <Download size={16} /> {descargando === 'pdf' ? 'Generando…' : 'Reporte PDF'}
            </button>
            <button
              onClick={cargar}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 44,
                padding: '0 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={15} /> Actualizar
            </button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Los reportes salen con el logo y el nombre de tu tienda.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

export default TiendaEstadisticas;
