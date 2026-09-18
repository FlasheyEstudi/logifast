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
    <div className="space-y-4 sm:space-y-5">
      {/* ─── KPI Dashboard Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
            <SlidersHorizontal size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-muted)]">Total Movimientos</p>
            <p className="text-lg sm:text-xl font-extrabold text-[var(--text)] font-mono">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <ArrowDownLeft size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-muted)]">Entradas (Stock)</p>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              +{stats.cantEntradas}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
            <ArrowUpRight size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-muted)]">Salidas / Ventas</p>
            <p className="text-lg sm:text-xl font-extrabold text-red-600 dark:text-red-400 font-mono">
              -{stats.cantSalidas}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <RotateCcw size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-[var(--text-muted)]">Ajustes Físicos</p>
            <p className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.cantAjustes}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Header & Controls ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text)] font-syne">
              Kardex de Inventario & Auditoría
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Registro inmutable de entradas por compra, ventas POS, despachos delivery y mermas
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={cargarDatos}
              className="h-11 min-h-[44px] px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-[var(--border)] text-[var(--text)] text-xs font-bold flex items-center gap-2 transition-all active:scale-95"
              title="Recargar movimientos"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin text-primary' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              className="h-11 min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Registrar Movimiento</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-[var(--border)]">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar por producto, SKU o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[var(--text)] text-xs sm:text-sm placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="w-6 h-6 rounded-full hover:bg-[var(--bg-alt)] text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'entradas', label: 'Entradas' },
                { id: 'salidas', label: 'Salidas' },
                { id: 'ajustes', label: 'Ajustes' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                className={`h-9 min-h-[36px] px-3.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filtroTipo === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Table or Card Stream ─── */}
      {loading ? (
        <div className="h-64 rounded-2xl bg-[var(--surface)] border border-[var(--border)] animate-pulse" />
      ) : movimientosFiltrados.length === 0 ? (
        <div className="py-20 text-center bg-[var(--surface)] border border-dashed border-[var(--border)] rounded-3xl p-6">
          <SlidersHorizontal size={44} className="mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-base font-bold text-[var(--text)] font-syne">
            No se encontraron movimientos
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Las ventas en caja POS, compras a proveedores o despachos registrarán movimientos aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-[var(--bg-alt)] border-b border-[var(--border)] text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  <th className="py-3 px-4">Fecha & Hora</th>
                  <th className="py-3 px-4">Producto / SKU</th>
                  <th className="py-3 px-4">Tipo Movimiento</th>
                  <th className="py-3 px-4 text-right">Cantidad</th>
                  <th className="py-3 px-4 text-center">Stock Ant.</th>
                  <th className="py-3 px-4 text-center">Nuevo Stock</th>
                  <th className="py-3 px-4">Motivo / Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {movimientosFiltrados.map((m) => {
                  const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
                  const esSalida =
                    m.tipo === 'SALIDA' ||
                    m.tipo === 'VENTA_POS' ||
                    m.tipo === 'VENTA_DELIVERY' ||
                    m.tipo === 'MERMA';

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 whitespace-nowrap text-xs text-[var(--text-muted)] font-mono">
                        {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-[var(--text)] block">
                          {m.producto?.nombre || 'Producto'}
                        </span>
                        {m.producto?.codigoBarras && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            SKU: {m.producto.codigoBarras}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            esEntrada
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : esSalida
                              ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.tipo}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={
                            esEntrada
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : esSalida
                              ? 'text-red-500'
                              : 'text-amber-500'
                          }
                        >
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[var(--text-muted)]">
                        {m.stockAnterior}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-extrabold text-primary">
                        {m.stockNuevo}
                      </td>

                      <td className="py-3 px-4 text-xs text-[var(--text-muted)] max-w-xs truncate">
                        {m.motivo || 'Operación comercial estándar'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal Registrar Movimiento Kardex ─── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text)] font-syne">
                  Registrar Movimiento Kardex
                </h3>
                <p className="text-xs text-slate-500">
                  Ajuste manual, compra a proveedor o merma física
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-[var(--bg-alt)] text-slate-500 flex items-center justify-center active:scale-95 transition-all"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={registrarMovimiento} className="space-y-4">
              {/* Selector de Producto */}
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Producto a Afectar *
                </label>
                <select
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                  required
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.stock ?? 0})
                    </option>
                  ))}
                </select>

                {prodSeleccionado && (
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">
                    Stock en sistema: <b>{prodSeleccionado.stock ?? 0} {prodSeleccionado.unidadMedida || 'und'}</b>
                  </p>
                )}
              </div>

              {/* Tipo de Movimiento */}
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Tipo de Movimiento *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ENTRADA', label: 'Entrada', desc: 'Compra / Ingreso', icon: <ArrowDownLeft size={14} className="text-[var(--exito)]" /> },
                    { id: 'SALIDA', label: 'Salida', desc: 'Merma / Baja', icon: <ArrowUpRight size={14} className="text-[var(--peligro)]" /> },
                    { id: 'AJUSTE', label: 'Ajuste', desc: 'Conteo Físico', icon: <RotateCcw size={14} className="text-[var(--warning)]" /> },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipo(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                        tipo === t.id
                          ? 'border-[var(--primario)] bg-[var(--primario-soft)] text-[var(--primario)] font-bold ring-1 ring-[var(--primario)]'
                          : 'border-[var(--border)] bg-[var(--bg-alt)]/60 text-[var(--text-muted)] hover:text-[var(--text)]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-xs font-bold">
                        {t.icon}
                        <span>{t.label}</span>
                      </span>
                      <span className="text-[10px] opacity-75 block mt-0.5">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantidad y Costo Unitario */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1">
                    Cantidad ({tipo === 'ENTRADA' ? '+ stock' : tipo === 'SALIDA' ? '- stock' : 'fijar'}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="10"
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1">
                    Costo Unitario (C$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    placeholder="C$ 0.00"
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="text-xs font-bold text-[var(--text)] block mb-1">
                  Motivo / Justificación
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Factura Proveedor #4092, Producto caducado, etc."
                  className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-11 min-h-[44px] px-4 rounded-xl border border-[var(--border)] text-[var(--text)] font-bold text-xs hover:bg-[var(--bg-alt)] active:scale-95 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <span>Registrar en Kardex</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
