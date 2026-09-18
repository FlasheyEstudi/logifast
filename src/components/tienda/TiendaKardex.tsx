'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Package,
  Search,
  X,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from '@/components/icons';
import { notify } from '@/lib/notify';
import type { Producto } from './TiendaInventario';

interface MovimientoKardex {
  id: string;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  costoUnitario?: number | null;
  precioVenta?: number | null;
  motivo?: string | null;
  createdAt: string;
  producto?: {
    id: string;
    nombre: string;
    codigoBarras?: string | null;
    unidadMedida?: string | null;
  };
}

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export function TiendaKardex({ isDark }: { isDark: boolean }) {
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entradas' | 'salidas' | 'ajustes'>('todos');

  // Form Movimiento
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [resKardex, resProds] = await Promise.all([
        fetch('/api/tienda/kardex'),
        fetch('/api/tienda/productos'),
      ]);

      if (resKardex.ok) {
        const dataK = await resKardex.json();
        if (dataK.ok) setMovimientos(dataK.movimientos || []);
      }

      if (resProds.ok) {
        const dataP = await resProds.json();
        if (dataP.ok) {
          setProductos(dataP.productos || []);
          if (dataP.productos.length > 0 && !productoId) {
            setProductoId(dataP.productos[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) {
      notify.error('Selecciona un producto');
      return;
    }
    if (!cantidad || Number(cantidad) <= 0) {
      notify.error('Ingresa una cantidad válida mayor a cero');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tienda/kardex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId,
          tipo,
          cantidad: Number(cantidad),
          motivo,
          costoUnitario: Number(costoUnitario) || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('Movimiento Kardex registrado exitosamente');
        setModalOpen(false);
        setCantidad('');
        setMotivo('');
        cargarDatos();
      } else {
        notify.error(data.error || 'Error al registrar movimiento');
      }
    } catch (err) {
      notify.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  // Resumen Kardex KPI
  const stats = useMemo(() => {
    let cantEntradas = 0;
    let cantSalidas = 0;
    let cantAjustes = 0;

    movimientos.forEach((m) => {
      if (m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE') {
        cantEntradas += m.cantidad;
      } else if (
        m.tipo === 'SALIDA' ||
        m.tipo === 'VENTA_POS' ||
        m.tipo === 'VENTA_DELIVERY' ||
        m.tipo === 'MERMA'
      ) {
        cantSalidas += m.cantidad;
      } else if (m.tipo === 'AJUSTE') {
        cantAjustes += m.cantidad;
      }
    });

    return {
      total: movimientos.length,
      cantEntradas,
      cantSalidas,
      cantAjustes,
    };
  }, [movimientos]);

  // Filtrado
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const matchBusqueda =
        (m.producto?.nombre && m.producto.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (m.producto?.codigoBarras && m.producto.codigoBarras.includes(busqueda)) ||
        (m.motivo && m.motivo.toLowerCase().includes(busqueda.toLowerCase()));

      let matchTipo = true;
      if (filtroTipo === 'entradas') {
        matchTipo = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
      } else if (filtroTipo === 'salidas') {
        matchTipo =
          m.tipo === 'SALIDA' ||
          m.tipo === 'VENTA_POS' ||
          m.tipo === 'VENTA_DELIVERY' ||
          m.tipo === 'MERMA';
      } else if (filtroTipo === 'ajustes') {
        matchTipo = m.tipo === 'AJUSTE';
      }

      return matchBusqueda && matchTipo;
    });
  }, [movimientos, busqueda, filtroTipo]);

  const prodSeleccionado = productos.find((p) => p.id === productoId);

  return (
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* ─── 1. KPI STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Movimientos */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-[var(--primario)] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[var(--primario-soft,rgba(0,122,255,0.1))] text-[var(--primario)] flex items-center justify-center shrink-0">
              <SlidersHorizontal size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Total Movimientos</span>
              <span className="text-xl font-extrabold font-mono text-[var(--text)]">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        {/* Entradas */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <ArrowDownLeft size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Entradas (Stock)</span>
              <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">+{stats.cantEntradas}</span>
            </div>
          </CardContent>
        </Card>

        {/* Salidas */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-red-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
              <ArrowUpRight size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Salidas / Ventas</span>
              <span className="text-xl font-extrabold font-mono text-red-600 dark:text-red-400">-{stats.cantSalidas}</span>
            </div>
          </CardContent>
        </Card>

        {/* Ajustes */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <RotateCcw size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Ajustes Físicos</span>
              <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">{stats.cantAjustes}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. HEADER & TOOLBAR DE AUDITORÍA ─── */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3.5">
            <div>
              <h2 className="text-lg font-bold font-syne text-[var(--text)]">
                Kardex de Inventario & Auditoría
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Trazabilidad inmutable de entradas, salidas por ventas POS y ajustes de stock
              </p>
            </div>

            <div className="flex gap-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={cargarDatos}
                title="Recargar movimientos"
                className="h-10 text-xs font-semibold"
              >
                <RefreshCw size={14} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>

              <Button
                onClick={() => setModalOpen(true)}
                className="h-10 text-sm font-semibold"
              >
                <Plus size={16} className="mr-1.5" />
                <span>Registrar Movimiento</span>
              </Button>
            </div>
          </div>

          {/* Buscador & Filtros */}
          <div className="flex gap-2.5 flex-wrap items-center pt-3.5 border-t border-[var(--border)]">
            <div className="relative flex-1 min-w-[240px] flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por producto, SKU o motivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 w-5 h-5 rounded-full hover:bg-[var(--surface)] text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {(
                [
                  { id: 'todos', label: 'Todos' },
                  { id: 'entradas', label: 'Entradas' },
                  { id: 'salidas', label: 'Salidas' },
                  { id: 'ajustes', label: 'Ajustes' },
                ] as const
              ).map((f) => {
                const active = filtroTipo === f.id;
                return (
                  <Button
                    key={f.id}
                    variant={active ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFiltroTipo(f.id)}
                    className="h-8 rounded-full text-xs font-semibold px-3"
                  >
                    {f.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. CONTENIDO KARDEX (MÓVIL CARDS + DESKTOP TABLA) ─── */}
      {loading ? (
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm h-[260px] flex items-center justify-center">
          <CardContent className="flex flex-col items-center gap-2.5 text-[var(--text-muted)] p-6">
            <div className="w-8 h-8 border-3 border-[var(--primario)]/20 border-t-[var(--primario)] rounded-full animate-spin" />
            <span className="text-xs font-semibold">Cargando movimientos Kardex...</span>
          </CardContent>
        </Card>
      ) : movimientosFiltrados.length === 0 ? (
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm p-12 text-center">
          <CardContent className="flex flex-col items-center gap-2.5">
            <SlidersHorizontal size={44} className="text-[var(--text-muted)] opacity-40" />
            <h3 className="text-base font-bold font-syne text-[var(--text)]">
              No se encontraron movimientos
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              Las compras, ventas POS y ajustes de stock quedarán registrados aquí automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════
              VISTA MÓVIL (Celular: Opción A - Tarjetas Táctiles)
              ═══════════════════════════════════════════════ */}
          <div className="block md:hidden space-y-3">
            {movimientosFiltrados.map((m) => {
              const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
              const esSalida =
                m.tipo === 'SALIDA' ||
                m.tipo === 'VENTA_POS' ||
                m.tipo === 'VENTA_DELIVERY' ||
                m.tipo === 'MERMA';

              return (
                <Card key={m.id} className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardContent className="p-3.5 space-y-2.5">
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">
                          {m.producto?.nombre || 'Producto'}
                        </h4>
                        {m.producto?.codigoBarras && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)] block">
                            SKU: {m.producto.codigoBarras}
                          </span>
                        )}
                      </div>

                      {/* Badge Píldora */}
                      <Badge
                        variant={esEntrada ? 'secondary' : esSalida ? 'destructive' : 'outline'}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                          esEntrada
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0'
                            : esSalida
                            ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-0'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0'
                        }`}
                      >
                        {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {m.tipo}
                      </Badge>
                    </div>

                    {/* Resumen Numérico */}
                    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-center">
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Anterior</span>
                        <span className="text-xs font-bold font-mono text-[var(--text-muted)]">
                          {m.stockAnterior}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Cambio</span>
                        <span className={`text-xs font-extrabold font-mono ${
                          esEntrada ? 'text-emerald-600 dark:text-emerald-400' : esSalida ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                        }`}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-[var(--text-muted)] block uppercase">Nuevo</span>
                        <span className="text-xs font-extrabold font-mono text-[var(--primario)]">
                          {m.stockNuevo}
                        </span>
                      </div>
                    </div>

                    {/* Detalle y Fecha */}
                    <div className="flex justify-between items-center text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border)]">
                      <span className="font-mono">
                        {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                      </span>
                      <span className="max-w-[180px] truncate text-right">
                        {m.motivo || 'Operación comercial'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════
              VISTA ESCRITORIO / TABLET (Opción B - Back-Office Tabla Densa)
              ═══════════════════════════════════════════════ */}
          <Card className="hidden md:block bg-[var(--surface)] border-[var(--border)] shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-alt)] hover:bg-[var(--bg-alt)]">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Fecha & Hora</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Producto / SKU</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Tipo Movimiento</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Cantidad</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Stock Ant.</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Nuevo Stock</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Motivo / Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movimientosFiltrados.map((m) => {
                  const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
                  const esSalida =
                    m.tipo === 'SALIDA' ||
                    m.tipo === 'VENTA_POS' ||
                    m.tipo === 'VENTA_DELIVERY' ||
                    m.tipo === 'MERMA';

                  return (
                    <TableRow key={m.id}>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-[var(--text-muted)]">
                        {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                      </TableCell>

                      <TableCell>
                        <span className="font-bold text-[var(--text)] block">
                          {m.producto?.nombre || 'Producto'}
                        </span>
                        {m.producto?.codigoBarras && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            SKU: {m.producto.codigoBarras}
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={esEntrada ? 'secondary' : esSalida ? 'destructive' : 'outline'}
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            esEntrada
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0'
                              : esSalida
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-0'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0'
                          }`}
                        >
                          {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.tipo}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right font-mono font-extrabold">
                        <span className={esEntrada ? 'text-emerald-600 dark:text-emerald-400' : esSalida ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </TableCell>

                      <TableCell className="text-center font-mono text-[var(--text-muted)]">
                        {m.stockAnterior}
                      </TableCell>

                      <TableCell className="text-center font-mono font-extrabold text-[var(--primario)]">
                        {m.stockNuevo}
                      </TableCell>

                      <TableCell className="text-[var(--text-muted)] text-xs">
                        {m.motivo || 'Operación comercial estándar'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* ─── MODAL REGISTRAR MOVIMIENTO KARDEX (ESTILO LOGIFAST 2.0) ─── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-[var(--surface)] border-[var(--border)] shadow-2xl rounded-3xl"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] mb-5">
                <div>
                  <h3 className="text-lg font-bold font-syne text-[var(--text)] m-0">
                    Registrar Movimiento Kardex
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
                    Ajuste manual, compra a proveedor o merma física
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--surface-elevated)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={registrarMovimiento} className="flex flex-col gap-4">
                {/* Producto */}
                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                    Producto a Afectar *
                  </label>
                  <select
                    value={productoId}
                    onChange={(e) => setProductoId(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--primario)]"
                    required
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock actual: {p.stock ?? 0})
                      </option>
                    ))}
                  </select>
                  {prodSeleccionado && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1 font-mono">
                      Stock en sistema: <b>{prodSeleccionado.stock ?? 0} {prodSeleccionado.unidadMedida || 'und'}</b>
                    </p>
                  )}
                </div>

                {/* Tipo */}
                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                    Tipo de Operación *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ENTRADA', label: 'Entrada', desc: 'Compra / Ingreso', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400', icon: <ArrowDownLeft size={14} /> },
                      { id: 'SALIDA', label: 'Salida', desc: 'Merma / Baja', color: 'border-red-500 text-red-600 dark:text-red-400', icon: <ArrowUpRight size={14} /> },
                      { id: 'AJUSTE', label: 'Ajuste', desc: 'Conteo Físico', color: 'border-amber-500 text-amber-600 dark:text-amber-400', icon: <RotateCcw size={14} /> },
                    ].map((t) => {
                      const isSelected = tipo === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTipo(t.id as any)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? `${t.color} border-2 bg-[var(--surface)] font-bold`
                              : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)]'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-xs">
                            {t.icon} {t.label}
                          </span>
                          <span className="text-[10px] opacity-80">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cantidad & Costo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Cantidad ({tipo === 'ENTRADA' ? '+ stock' : tipo === 'SALIDA' ? '- stock' : 'fijar'}) *
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      placeholder="10"
                      className="font-mono text-xs h-10 bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Costo Unitario (C$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={costoUnitario}
                      onChange={(e) => setCostoUnitario(e.target.value)}
                      placeholder="C$ 0.00"
                      className="font-mono text-xs h-10 bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                    />
                  </div>
                </div>

                {/* Motivo */}
                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                    Motivo / Justificación
                  </label>
                  <Input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ej: Factura Proveedor #4092, Conteo mensual..."
                    className="text-xs h-10 bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2.5 pt-3 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 h-10 text-xs font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-10 text-xs font-semibold"
                  >
                    {submitting ? 'Registrando...' : 'Registrar en Kardex'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TiendaKardex;
