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

/**
 * Panel de la tienda.
 *
 * Construido con los mismos componentes del proyecto: clases Tailwind con los tokens
 * del sistema (--surface, --border, --text, --primario…), igual que el resto de los
 * módulos del portal. Sin estilos inline salvo lo que no se puede expresar en clases:
 * los colores de las series de las gráficas, que los necesita recharts en concreto.
 */

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

/** Paleta de las series: recharts exige colores concretos, no variables CSS. */
const PALETA = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#FF453A', '#64D2FF'];

const money = (n: number) => `C$ ${n.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const metodoLegible = (m: string) =>
  ({ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', devolucion: 'Devoluciones' }[m] || m);

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/ui/EmptyState';

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

  // Colores de gráficas: no se pueden pasar por clase, así que se calculan por tema.
  const eje = isDark ? '#98989D' : '#8E8E93';
  const rejilla = isDark ? 'rgba(84,84,88,0.36)' : 'rgba(60,60,67,0.12)';
  const serie = isDark ? '#0A84FF' : '#007AFF';

  const helper = { contentStyle: { background: 'var(--surface)', border: `1px solid ${rejilla}`, borderRadius: 12, fontSize: 12, color: 'var(--text)' } };

  const Variacion = ({ valor, etiqueta }: { valor: number | null; etiqueta: string }) => {
    if (valor === null || !Number.isFinite(valor)) {
      return <span className="text-[11px] text-[var(--text-muted)]">{etiqueta}</span>;
    }
    const sube = valor >= 0;
    return (
      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${sube ? 'text-[var(--exito)]' : 'text-[var(--peligro)]'}`}>
        {sube ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {sube ? '+' : ''}
        {valor.toFixed(1)}%
        <span className="font-medium text-[var(--text-muted)]">{etiqueta}</span>
      </span>
    );
  };

  // Un KPI = etiqueta micro arriba + cifra que manda + delta. Sin bordes internos.
  const Tarjeta = ({
    etiqueta,
    valor,
    pie,
    tono = 'text-[var(--text)]',
    principal = false,
    className = '',
  }: {
    etiqueta: string;
    valor: string;
    pie: React.ReactNode;
    tono?: string;
    principal?: boolean;
    className?: string;
  }) => (
    <Card
      className={`rounded-[var(--lf-card-radius)] border bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] transition-shadow hover:shadow-[var(--lf-shadow-float)] ${
        principal ? 'border-primary/40' : 'border-[var(--border)]'
      } ${className}`}
    >
      <CardContent className="flex h-full min-w-0 flex-col justify-center gap-1.5 p-4 sm:p-5">
        <span className="truncate text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
          {etiqueta}
        </span>
        <div
          className={`truncate font-mono tracking-tight ${
            principal ? 'text-2xl font-black' : 'text-lg font-bold'
          } ${tono}`}
        >
          {valor}
        </div>
        <div className="min-w-0">{pie}</div>
      </CardContent>
    </Card>
  );

  const etiquetaVariacion = datos?.comparacion.hayDatos ? datos.comparacion.etiqueta : 'sin datos previos';

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Encabezado del módulo: título + una sola acción primaria */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="w-11 h-11 rounded-[var(--lf-card-radius)] bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--text)]">
              Panel de Estadísticas
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Mismo origen que los reportes XLSX/PDF y la exportación CSV: las devoluciones restan.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:shrink-0 lg:justify-end">
          <Button
            onClick={() => descargar('xlsx')}
            disabled={descargando !== null}
            className="h-11 rounded-full px-5 text-xs font-bold gap-2 shadow-[var(--lf-shadow-card)]"
          >
            <FileSpreadsheet size={16} /> {descargando === 'xlsx' ? 'Generando…' : 'Reporte Excel'}
          </Button>
          <Button
            variant="outline"
            onClick={() => descargar('pdf')}
            disabled={descargando !== null}
            className="h-11 rounded-full px-5 text-xs font-bold gap-2 border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-alt)]"
          >
            <Download size={16} /> {descargando === 'pdf' ? 'Generando…' : 'Reporte PDF'}
          </Button>
          <Button
            variant="ghost"
            onClick={cargar}
            className="h-11 rounded-full px-5 text-xs font-bold gap-2 text-[var(--text-muted)] hover:bg-[var(--bg-alt)] hover:text-[var(--text)]"
          >
            <RotateCcw size={15} /> Actualizar
          </Button>
        </div>
      </div>

      {/* Rango de fechas: un solo grupo, con su marcador, no píldoras sueltas */}
      <div className="flex flex-wrap items-center gap-3 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] p-2.5 shadow-[var(--lf-shadow-card)] sm:p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)]">
          <Calendar size={15} />
        </span>
        <div className="inline-flex items-center p-1 rounded-full bg-[var(--bg-alt)] border border-[var(--border)]">
          {PERIODOS.map((p) => {
            const active = dias === p.dias;
            return (
              <button
                key={p.dias}
                type="button"
                onClick={() => setDias(p.dias)}
                className={`h-11 sm:h-10 px-3.5 sm:px-4 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                  active
                    ? 'bg-primary text-primary-foreground shadow-[var(--lf-shadow-card)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface)]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-[var(--text-muted)] sm:ml-auto">
          Los reportes salen con el logo y el nombre de tu tienda.
        </span>
      </div>

      {loading && (
        <div className="flex flex-col gap-3.5" aria-busy="true">
          <p className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <Clock size={14} />
            <span>Calculando estadísticas y métricas financieras…</span>
          </p>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className={`rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] ${
                  i === 0 ? 'sm:col-span-2' : ''
                }`}
              >
                <CardContent className="flex flex-col gap-2.5 p-4 sm:p-5">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-6 w-32 rounded-[var(--lf-input-radius)]" />
                  <Skeleton className="h-3 w-20 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <Card
                key={i}
                className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)]"
              >
                <CardContent className="flex flex-col gap-4 p-4 sm:p-5">
                  <Skeleton className="h-4 w-40 rounded-full" />
                  <Skeleton className="h-[210px] w-full rounded-[var(--lf-card-radius)]" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <Card className="rounded-[var(--lf-card-radius)] border border-[var(--peligro)] bg-[var(--peligro)]/5 shadow-[var(--lf-shadow-card)]">
          <CardContent className="p-8 text-center text-xs text-[var(--peligro)] font-semibold flex items-center justify-center gap-2">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && !error && datos && (
        <>
          {/* Una sola fila de KPIs: la etiqueta micro arriba, la cifra manda, el delta acompaña */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <Tarjeta
              etiqueta="Vendido neto"
              valor={money(datos.resumen.totalVendido)}
              principal
              className="sm:col-span-2"
              pie={<Variacion valor={datos.comparacion.variacionVendido} etiqueta={etiquetaVariacion} />}
            />
            <Tarjeta
              etiqueta="Comprobantes"
              valor={String(datos.resumen.numVentas)}
              pie={<Variacion valor={datos.comparacion.variacionVentas} etiqueta={etiquetaVariacion} />}
            />
            <Tarjeta
              etiqueta="Ticket promedio"
              valor={money(datos.resumen.ticketPromedio)}
              pie={<Variacion valor={datos.comparacion.variacionTicket} etiqueta={etiquetaVariacion} />}
            />
            <Tarjeta
              etiqueta="Devuelto"
              valor={money(datos.resumen.montoDevuelto)}
              pie={
                <span className="text-[11px] text-[var(--text-muted)]">
                  {datos.resumen.devoluciones} devolución(es) · {datos.resumen.totalItems} artículos
                </span>
              }
              tono={datos.resumen.montoDevuelto > 0 ? 'text-[var(--warning)]' : 'text-[var(--text)]'}
            />
            <Tarjeta
              etiqueta="Mejor día"
              valor={datos.resumen.mejorDia ? money(datos.resumen.mejorDia.total) : '—'}
              pie={
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Calendar size={13} /> {datos.resumen.mejorDia?.fecha || 'sin ventas aún'}
                </span>
              }
            />
            <Tarjeta
              etiqueta="Hora pico"
              valor={datos.resumen.horaPico ? `${datos.resumen.horaPico.hora}:00` : '—'}
              pie={
                <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                  <Clock size={13} /> {datos.resumen.horaPico ? money(datos.resumen.horaPico.total) : 'sin ventas aún'}
                </span>
              }
            />
            <Tarjeta
              etiqueta="Stock bajo mínimo"
              valor={String(datos.resumen.productosConStockBajo)}
              pie={
                <span className="text-[11px] text-[var(--text-muted)]">
                  {datos.resumen.productosConStockBajo > 0 ? 'Revisa Inventario' : 'Todo en orden'}
                </span>
              }
              tono={datos.resumen.productosConStockBajo > 0 ? 'text-[var(--warning)]' : 'text-[var(--exito)]'}
            />
          </div>

          {datos.resumen.numVentas === 0 ? (
            <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)]">
              <CardContent className="p-0">
                <EmptyState
                  icono={<TrendingUp size={26} />}
                  titulo="Todavía no hay ventas en este período"
                  descripcion="Las cifras y las gráficas aparecen en cuanto registres ventas en la Caja POS (o devoluciones)."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--primario)]/10 text-[var(--primario)]">
                        <Clock size={16} />
                      </span>
                      <h3 className="text-base font-semibold tracking-tight text-[var(--text)] m-0">Ventas por hora</h3>
                    </div>
                    <div className="h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={datos.porHora} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={rejilla} vertical={false} />
                          <XAxis
                            dataKey="hora"
                            tickFormatter={(h) => `${h}h`}
                            tick={{ fill: eje, fontSize: 10.5 }}
                            axisLine={{ stroke: rejilla }}
                            tickLine={false}
                            interval={1}
                          />
                          <YAxis tick={{ fill: eje, fontSize: 10.5 }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => money(Number(v))} labelFormatter={(h) => `${h}:00 – ${h}:59`} {...helper} />
                          <Bar dataKey="total" fill={serie} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    <div className="flex items-center gap-2.5 mb-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--exito)]/10 text-[var(--exito)]">
                        <Calendar size={16} />
                      </span>
                      <h3 className="text-base font-semibold tracking-tight text-[var(--text)] m-0">Ventas por día</h3>
                    </div>
                    <div className="h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={datos.porDia} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                          <defs>
                            <linearGradient id="gradPanelVentas" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={serie} stopOpacity={0.45} />
                              <stop offset="100%" stopColor={serie} stopOpacity={0.03} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke={rejilla} vertical={false} />
                          <XAxis dataKey="fecha" tick={{ fill: eje, fontSize: 10.5 }} axisLine={{ stroke: rejilla }} tickLine={false} />
                          <YAxis tick={{ fill: eje, fontSize: 10.5 }} axisLine={false} tickLine={false} />
                          <Tooltip formatter={(v) => money(Number(v))} {...helper} />
                          <Area type="monotone" dataKey="total" stroke={serie} strokeWidth={2} fill="url(#gradPanelVentas)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--text)] mb-4">Top 10 productos</h3>
                    {datos.topProductos.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <TrendingDown size={22} className="text-[var(--text-muted)]" />
                        <p className="text-xs text-[var(--text-muted)]">Sin artículos vendidos en el período.</p>
                      </div>
                    ) : (
                      <div className="h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={datos.topProductos.map((p) => ({
                              nombre: p.nombre.length > 20 ? `${p.nombre.slice(0, 19)}…` : p.nombre,
                              monto: p.monto,
                              cantidad: p.cantidad,
                            }))}
                            layout="vertical"
                            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={rejilla} horizontal={false} />
                            <XAxis type="number" tick={{ fill: eje, fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="nombre" width={124} tick={{ fill: eje, fontSize: 10.5 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              formatter={(v, _n, item) => [
                                `${money(Number(v))} · ${(item?.payload as { cantidad?: number })?.cantidad ?? 0} u.`,
                                'Vendido',
                              ]}
                              {...helper}
                            />
                            <Bar dataKey="monto" fill={serie} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--surface)] py-0 shadow-[var(--lf-shadow-card)] overflow-hidden">
                  <CardContent className="p-4 sm:p-5">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--text)] mb-4">Formas de pago</h3>
                    {datos.porMetodo.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                        <Calendar size={22} className="text-[var(--text-muted)]" />
                        <p className="text-xs text-[var(--text-muted)]">Sin cobros registrados en el período.</p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="h-[190px] w-[190px] shrink-0">
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
                              <Tooltip formatter={(v) => money(Number(v))} {...helper} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
                          {datos.porMetodo.map((m, i) => (
                            <li key={m.metodo} className="flex items-center gap-2 text-xs text-[var(--text)]">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETA[i % PALETA.length] }} />
                              <span className="flex-1 truncate font-medium">{metodoLegible(m.metodo)}</span>
                              <span className="text-[11px] text-[var(--text-muted)]">{m.ventas} ops</span>
                              <span className="font-bold font-mono">{money(m.total)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {datos.alertasStockBajo.length > 0 && (
            <Card className="rounded-[var(--lf-card-radius)] border border-[var(--warning)] bg-[var(--warning)]/5 py-0 shadow-[var(--lf-shadow-card)] overflow-hidden">
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-center gap-2.5 text-[var(--warning)] mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--warning)]/10 flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight m-0">
                    Stock en o bajo el mínimo
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
                  {datos.alertasStockBajo.map((a) => (
                    <div
                      key={a.productoId}
                      className="flex justify-between items-center gap-3 px-3 py-2.5 rounded-[var(--lf-input-radius)] bg-[var(--bg-alt)] text-xs text-[var(--text)]"
                    >
                      <span className="font-bold truncate">{a.nombre}</span>
                      <Badge
                        variant="outline"
                        className="shrink-0 rounded-full border-[var(--warning)] bg-[var(--surface)] text-[var(--warning)] font-mono font-bold tabular-nums"
                      >
                        {a.stock} / {a.stockMinimo} min
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </>
      )}
    </div>
  );
}

export default TiendaEstadisticas;
