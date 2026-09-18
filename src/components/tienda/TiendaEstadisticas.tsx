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
  ({ efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia', fiado: 'Fiado', devolucion: 'Devoluciones' }[m] || m);

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
      <span className={`inline-flex items-center gap-1 text-[11.5px] font-bold ${sube ? 'text-[var(--exito)]' : 'text-[var(--peligro)]'}`}>
        {sube ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
        {sube ? '+' : ''}
        {valor.toFixed(1)}%
        <span className="font-medium text-[var(--text-muted)]">{etiqueta}</span>
      </span>
    );
  };

  const Tarjeta = ({
    etiqueta,
    valor,
    pie,
    tono = 'text-[var(--text)]',
  }: {
    etiqueta: string;
    valor: string;
    pie: React.ReactNode;
    tono?: string;
  }) => (
    <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
      <CardContent className="p-4 flex flex-col gap-1 min-w-0">
        <span className="text-xs font-semibold text-[var(--text-muted)]">{etiqueta}</span>
        <span className={`truncate text-xl font-extrabold ${tono}`}>{valor}</span>
        {pie}
      </CardContent>
    </Card>
  );

  const etiquetaVariacion = datos?.comparacion.hayDatos ? datos.comparacion.etiqueta : 'sin datos previos';

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Encabezado y período */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-syne text-xl font-extrabold text-[var(--text)]">
            <TrendingUp size={19} /> Panel de la tienda
          </h2>
          <p className="mt-1 text-[12.5px] text-[var(--text-muted)]">
            Mismo origen que los reportes XLSX/PDF y la exportación CSV: las devoluciones restan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto">
          {PERIODOS.map((p) => {
            const active = dias === p.dias;
            return (
              <Button
                key={p.dias}
                variant={active ? 'default' : 'secondary'}
                size="sm"
                onClick={() => setDias(p.dias)}
                className="h-8 rounded-full text-xs font-semibold px-3"
              >
                {p.label}
              </Button>
            );
          })}
        </div>
      </div>

      {loading && (
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
          <CardContent className="p-6 text-center text-xs text-[var(--text-muted)]">
            Calculando estadísticas…
          </CardContent>
        </Card>
      )}

      {!loading && error && (
        <Card className="bg-[var(--surface)] border-red-500/40 shadow-sm">
          <CardContent className="p-6 text-center text-xs text-red-500 font-medium">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && !error && datos && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Tarjeta
              etiqueta="Vendido neto"
              valor={money(datos.resumen.totalVendido)}
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
                <span className="text-[11.5px] text-[var(--text-muted)]">
                  {datos.resumen.devoluciones} devolución(es) · {datos.resumen.totalItems} artículos
                </span>
              }
              tono={datos.resumen.montoDevuelto > 0 ? 'text-[var(--warning)]' : 'text-[var(--text)]'}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tarjeta
              etiqueta="Mejor día"
              valor={datos.resumen.mejorDia ? money(datos.resumen.mejorDia.total) : '—'}
              pie={
                <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
                  <Calendar size={13} /> {datos.resumen.mejorDia?.fecha || 'sin ventas aún'}
                </span>
              }
            />
            <Tarjeta
              etiqueta="Hora pico"
              valor={datos.resumen.horaPico ? `${datos.resumen.horaPico.hora}:00` : '—'}
              pie={
                <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
                  <Clock size={13} /> {datos.resumen.horaPico ? money(datos.resumen.horaPico.total) : 'sin ventas aún'}
                </span>
              }
            />
            <Tarjeta
              etiqueta="Stock en o bajo el mínimo"
              valor={String(datos.resumen.productosConStockBajo)}
              pie={
                <span className="text-[11.5px] text-[var(--text-muted)]">
                  {datos.resumen.productosConStockBajo > 0 ? 'revisa Inventario' : 'todo en orden'}
                </span>
              }
              tono={datos.resumen.productosConStockBajo > 0 ? 'text-[var(--warning)]' : 'text-[var(--exito)]'}
            />
          </div>

          {datos.resumen.numVentas === 0 ? (
            <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm text-center">
              <CardContent className="p-8 space-y-1.5">
                <div className="text-base font-bold text-[var(--text)]">Todavía no hay ventas en este período</div>
                <div className="text-xs text-[var(--text-muted)]">
                  Las cifras y las gráficas aparecen en cuanto registres ventas en la Caja POS (o devoluciones).
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="mb-2.5 text-[13.5px] font-extrabold text-[var(--text)]">Ventas por hora</h3>
                    <div className="h-[200px]">
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

                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="mb-2.5 text-[13.5px] font-extrabold text-[var(--text)]">Ventas por día</h3>
                    <div className="h-[200px]">
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

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="mb-2.5 text-[13.5px] font-extrabold text-[var(--text)]">Top 10 productos</h3>
                    {datos.topProductos.length === 0 ? (
                      <p className="text-[13px] text-[var(--text-muted)]">Sin artículos vendidos en el período.</p>
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

                <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardContent className="p-5">
                    <h3 className="mb-2.5 text-[13.5px] font-extrabold text-[var(--text)]">Formas de pago</h3>
                    {datos.porMetodo.length === 0 ? (
                      <p className="text-[13px] text-[var(--text-muted)]">Sin cobros registrados en el período.</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
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
                        <ul className="flex min-w-0 flex-1 flex-col gap-2">
                          {datos.porMetodo.map((m, i) => (
                            <li key={m.metodo} className="flex items-center gap-2 text-[12.5px] text-[var(--text)]">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETA[i % PALETA.length] }} />
                              <span className="flex-1 truncate">{metodoLegible(m.metodo)}</span>
                              <span className="text-[11.5px] text-[var(--text-muted)]">{m.ventas}</span>
                              <span className="font-bold">{money(m.total)}</span>
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
            <Card className="bg-[var(--surface)] border-amber-500/40 shadow-sm">
              <CardContent className="p-5">
                <h3 className="flex items-center gap-2 text-[13.5px] font-extrabold text-[var(--warning)] m-0">
                  <AlertTriangle size={16} /> Stock en o bajo el mínimo
                </h3>
                <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {datos.alertasStockBajo.map((a) => (
                    <div key={a.productoId} className="flex justify-between gap-2.5 text-[12.5px] text-[var(--text)]">
                      <span className="truncate">{a.nombre}</span>
                      <span className="font-mono font-bold tabular-nums">
                        {a.stock} / {a.stockMinimo}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => descargar('xlsx')}
              disabled={descargando !== null}
              className="h-10 text-xs font-semibold gap-2"
            >
              <FileSpreadsheet size={16} /> {descargando === 'xlsx' ? 'Generando…' : 'Reporte Excel'}
            </Button>
            <Button
              variant="outline"
              onClick={() => descargar('pdf')}
              disabled={descargando !== null}
              className="h-10 text-xs font-semibold gap-2"
            >
              <Download size={16} /> {descargando === 'pdf' ? 'Generando…' : 'Reporte PDF'}
            </Button>
            <Button
              variant="outline"
              onClick={cargar}
              className="h-10 text-xs font-semibold gap-2"
            >
              <RotateCcw size={15} /> Actualizar
            </Button>
            <span className="text-xs text-[var(--text-muted)]">Los reportes salen con el logo y el nombre de tu tienda.</span>
          </div>
        </>
      )}
    </div>
  );
}

export default TiendaEstadisticas;
