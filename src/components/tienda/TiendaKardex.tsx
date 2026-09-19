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
    <div className="w-full space-y-4 sm:space-y-5">
      {/* ─── 1. KPI STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Movimientos — KPI secundario */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] py-0">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Total Movimientos
              </span>
              <span className="w-8 h-8 rounded-[var(--lf-input-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
                <SlidersHorizontal size={16} />
              </span>
            </div>
            <span className="text-lg font-bold font-mono tracking-tight text-[var(--text)]">{stats.total}</span>
          </CardContent>
        </Card>

        {/* Entradas — flujo principal */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] py-0">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Entradas (Stock)
              </span>
              <span className="w-8 h-8 rounded-[var(--lf-input-radius)] bg-[var(--exito)]/10 text-[var(--exito)] flex items-center justify-center shrink-0">
                <ArrowDownLeft size={16} />
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[var(--exito)]">+{stats.cantEntradas}</span>
          </CardContent>
        </Card>

        {/* Salidas — flujo principal */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] py-0">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Salidas / Ventas
              </span>
              <span className="w-8 h-8 rounded-[var(--lf-input-radius)] bg-[var(--peligro)]/10 text-[var(--peligro)] flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} />
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[var(--peligro)]">-{stats.cantSalidas}</span>
          </CardContent>
        </Card>

        {/* Ajustes — KPI secundario */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] py-0">
          <CardContent className="p-4 sm:p-5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Ajustes Físicos
              </span>
              <span className="w-8 h-8 rounded-[var(--lf-input-radius)] bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center shrink-0">
                <RotateCcw size={16} />
              </span>
            </div>
            <span className="text-lg font-bold font-mono tracking-tight text-[var(--text)]">{stats.cantAjustes}</span>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. HEADER & TOOLBAR DE AUDITORÍA ─── */}
      <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
        <CardContent className="p-4 sm:p-5 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold font-syne text-[var(--text)]">
                Kardex de Inventario & Auditoría
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Trazabilidad inmutable de entradas, salidas por ventas POS y ajustes de stock
              </p>
            </div>

            <div className="flex gap-2 items-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={cargarDatos}
                title="Recargar movimientos"
                className="h-11 rounded-full px-4 text-xs font-bold shadow-none"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin text-[var(--primario)]' : ''} />
                <span className="hidden sm:inline">Actualizar</span>
              </Button>

              <Button
                onClick={() => setModalOpen(true)}
                className="h-11 rounded-full px-5 text-xs font-bold shadow-[var(--lf-shadow-card)]"
              >
                <Plus size={16} />
                <span>Registrar Movimiento</span>
              </Button>
            </div>
          </div>

          {/* Buscador & Filtros */}
          <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--border)] sm:flex-row sm:items-center">
            <div className="relative flex w-full min-w-0 flex-1 items-center">
              <Search size={18} className="absolute left-4 text-[var(--text-muted)] pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por producto, SKU o motivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-11 pr-10 h-11 rounded-full text-xs sm:text-sm bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] shadow-none"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3.5 w-6 h-6 rounded-full hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="no-scrollbar -mx-1 flex items-center gap-1.5 overflow-x-auto px-1 sm:mx-0 sm:px-0">
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
                    variant={active ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setFiltroTipo(f.id)}
                    className={`h-11 sm:h-10 shrink-0 rounded-full px-4 text-xs font-bold shadow-none ${
                      active ? '' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                    }`}
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
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] h-[260px] flex items-center justify-center">
          <CardContent className="flex flex-col items-center gap-2.5 text-[var(--text-muted)] p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--primario)]/20 border-t-[var(--primario)]" />
            <span className="text-xs font-semibold">Cargando movimientos Kardex...</span>
          </CardContent>
        </Card>
      ) : movimientosFiltrados.length === 0 ? (
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] p-12 text-center">
          <CardContent className="flex flex-col items-center gap-2.5">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--bg-alt)] text-[var(--text-muted)] mx-auto">
              <SlidersHorizontal size={26} />
            </span>
            <h3 className="text-base font-semibold font-syne text-[var(--text)]">
              No se encontraron movimientos
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Las compras, ventas POS y ajustes de stock quedarán registrados aquí automáticamente.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════
              VISTA MÓVIL (Celular: Opción A - Tarjetas Táctiles)
              ═══════════════════════════════════════════════ */}
          <div className="block md:hidden space-y-3.5">
            {movimientosFiltrados.map((m) => {
              const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
              const esSalida =
                m.tipo === 'SALIDA' ||
                m.tipo === 'VENTA_POS' ||
                m.tipo === 'VENTA_DELIVERY' ||
                m.tipo === 'MERMA';

              return (
                <Card key={m.id} className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start gap-2.5">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text)] truncate">
                          {m.producto?.nombre || 'Producto'}
                        </h4>
                        {m.producto?.codigoBarras && (
                          <span className="text-xs font-mono text-[var(--text-muted)] block mt-0.5">
                            SKU: {m.producto.codigoBarras}
                          </span>
                        )}
                      </div>

                      {/* Badge Píldora */}
                      <Badge
                        variant="outline"
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${
                          esEntrada
                            ? 'border-[var(--exito)]/30 bg-[var(--exito)]/10 text-[var(--exito)]'
                            : esSalida
                            ? 'border-[var(--peligro)]/30 bg-[var(--peligro)]/10 text-[var(--peligro)]'
                            : 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]'
                        }`}
                      >
                        {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {m.tipo}
                      </Badge>
                    </div>

                    {/* Resumen Numérico en Cápsula */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)]/60 border border-[var(--border)] text-center">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Anterior</span>
                        <span className="text-xs font-bold font-mono text-[var(--text-muted)]">
                          {m.stockAnterior}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Cambio</span>
                        <span className={`text-sm font-black font-mono ${
                          esEntrada ? 'text-[var(--exito)]' : esSalida ? 'text-[var(--peligro)]' : 'text-[var(--warning)]'
                        }`}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Nuevo</span>
                        <span className="text-sm font-black font-mono text-[var(--primario)]">
                          {m.stockNuevo}
                        </span>
                      </div>
                    </div>

                    {/* Detalle y Fecha */}
                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-[var(--border)] text-[11px] text-[var(--text-muted)]">
                      <span className="font-mono font-bold text-[var(--text)]">
                        {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                      </span>
                      <span className="max-w-[180px] truncate text-right font-medium">
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
          <Card className="hidden md:block rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-[var(--border)] bg-[var(--bg-alt)] hover:bg-[var(--bg-alt)]">
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
                {movimientosFiltrados.map((m, idx) => {
                  const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
                  const esSalida =
                    m.tipo === 'SALIDA' ||
                    m.tipo === 'VENTA_POS' ||
                    m.tipo === 'VENTA_DELIVERY' ||
                    m.tipo === 'MERMA';
                  const fechaDia = new Date(m.createdAt).toLocaleDateString('es-NI');
                  const nuevoDia =
                    idx === 0 ||
                    fechaDia !== new Date(movimientosFiltrados[idx - 1].createdAt).toLocaleDateString('es-NI');

                  return (
                    <React.Fragment key={m.id}>
                      {nuevoDia && (
                        <TableRow className="border-b border-[var(--border)] bg-[var(--bg-alt)] hover:bg-[var(--bg-alt)]">
                          <TableCell colSpan={7} className="py-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                              {fechaDia}
                            </span>
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow className="border-b border-[var(--border)] hover:bg-[var(--bg-alt)]">
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          <span className="font-bold text-[var(--text)]">
                            {new Date(m.createdAt).toLocaleDateString('es-NI')}
                          </span>{' '}
                          <span className="text-[var(--text-muted)]">
                            {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                          </span>
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
                            variant="outline"
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${
                              esEntrada
                                ? 'border-[var(--exito)]/30 bg-[var(--exito)]/10 text-[var(--exito)]'
                                : esSalida
                                ? 'border-[var(--peligro)]/30 bg-[var(--peligro)]/10 text-[var(--peligro)]'
                                : 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]'
                            }`}
                          >
                            {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                            {m.tipo}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right font-mono font-extrabold">
                          <span className={esEntrada ? 'text-[var(--exito)]' : esSalida ? 'text-[var(--peligro)]' : 'text-[var(--warning)]'}>
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
                    </React.Fragment>
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
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[500px] max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-sheet)] rounded-[var(--lf-sheet-radius)]"
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
                  className="w-9 h-9 rounded-full border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--surface-elevated)] transition-colors shadow-[var(--lf-shadow-card)]"
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
                    className="w-full h-11 px-3.5 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)] text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primario)]"
                    required
                  >
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock actual: {p.stock ?? 0})
                      </option>
                    ))}
                  </select>
                  {prodSeleccionado && (
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5 font-mono">
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
                      { id: 'ENTRADA', label: 'Entrada', desc: 'Compra / Ingreso', color: 'border-[var(--exito)] text-[var(--exito)]', icon: <ArrowDownLeft size={14} /> },
                      { id: 'SALIDA', label: 'Salida', desc: 'Merma / Baja', color: 'border-[var(--peligro)] text-[var(--peligro)]', icon: <ArrowUpRight size={14} /> },
                      { id: 'AJUSTE', label: 'Ajuste', desc: 'Conteo Físico', color: 'border-[var(--warning)] text-[var(--warning)]', icon: <RotateCcw size={14} /> },
                    ].map((t) => {
                      const isSelected = tipo === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTipo(t.id as any)}
                          className={`p-3 rounded-[var(--lf-card-radius)] border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                            isSelected
                              ? `${t.color} border-2 bg-[var(--surface)] font-bold`
                              : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)]'
                          }`}
                        >
                          <span className="flex items-center gap-1 text-xs">
                            {t.icon} {t.label}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)]">{t.desc}</span>
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
                      className="font-mono text-xs h-11 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
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
                      className="font-mono text-xs h-11 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
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
                    className="text-xs h-11 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                  />
                </div>

                {/* Botones */}
                <div className="flex gap-2.5 pt-3 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 h-11 rounded-full text-xs font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 h-11 rounded-full text-xs font-semibold shadow-[var(--lf-shadow-card)]"
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
