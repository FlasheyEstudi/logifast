'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Trash2, Search, CheckCircle2, RotateCcw, X, AlertTriangle } from '@/components/icons';
import { notify } from '@/lib/notify';
import type { Producto } from './TiendaInventario';

interface LineaDevolucion {
  producto: Producto;
  cantidad: number;
  motivo: string;
}

interface ResultadoDevolucion {
  numeroComprobante: string;
  totalDevuelto: number;
  items: { nombreProducto: string; cantidad: number; stockAnterior: number; stockNuevo: number }[];
  alertasStockBajo: { nombreProducto: string; stockNuevo: number; stockMinimo: number }[];
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
  productos: Producto[];
  onDevuelto: () => void | Promise<void>;
}

export function TiendaDevolucion({ abierto, onCerrar, productos, onDevuelto }: Props) {
  const [busqueda, setBusqueda] = useState('');
  const [lineas, setLineas] = useState<LineaDevolucion[]>([]);
  const [referencia, setReferencia] = useState('');
  const [clienteNombre, setClienteNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoDevolucion | null>(null);

  useEffect(() => {
    if (!abierto) return;
    setResultado(null);
    setBusqueda('');
    setLineas([]);
    setReferencia('');
    setClienteNombre('');
  }, [abierto]);

  const candidatos = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return [];
    return productos
      .filter((p) => p.stock !== null && p.stock !== undefined)
      .filter((p) => p.nombre.toLowerCase().includes(q) || (p.codigoBarras && p.codigoBarras.includes(q)))
      .slice(0, 8);
  }, [busqueda, productos]);

  const total = lineas.reduce((s, l) => s + l.producto.precio * l.cantidad, 0);

  const agregar = (p: Producto) => {
    setBusqueda('');
    setLineas((prev) => {
      const existe = prev.find((l) => l.producto.id === p.id);
      if (existe) {
        return prev.map((l) => (l.producto.id === p.id ? { ...l, cantidad: l.cantidad + 1 } : l));
      }
      return [...prev, { producto: p, cantidad: 1, motivo: '' }];
    });
  };

  const cambiarCantidad = (productoId: string, delta: number) => {
    setLineas((prev) =>
      prev
        .map((l) => (l.producto.id === productoId ? { ...l, cantidad: l.cantidad + delta } : l))
        .filter((l) => l.cantidad > 0)
    );
  };

  const quitar = (productoId: string) => setLineas((prev) => prev.filter((l) => l.producto.id !== productoId));

  const enviar = async () => {
    if (lineas.length === 0) {
      notify.warning('Agrega al menos un producto a devolver');
      return;
    }
    setEnviando(true);
    try {
      const res = await fetch('/api/tienda/devoluciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: lineas.map((l) => ({
            productoId: l.producto.id,
            cantidad: l.cantidad,
            motivo: l.motivo.trim() || undefined,
          })),
          referencia: referencia.trim(),
          clienteNombre: clienteNombre.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        notify.error(data.error || 'No se pudo registrar la devolución');
        return;
      }
      setResultado(data.devolucion as ResultadoDevolucion);
      notify.success(`Devolución ${data.devolucion.numeroComprobante} registrada`);
      const alertas = data.devolucion.alertasStockBajo ?? [];
      if (alertas.length > 0) {
        notify.warning(
          alertas.length === 1
            ? `"${alertas[0].nombreProducto}" quedó en ${alertas[0].stockNuevo} (mínimo ${alertas[0].stockMinimo})`
            : `${alertas.length} productos quedaron en o bajo su stock mínimo`
        );
      }
      await onDevuelto();
    } catch {
      notify.error('Error de red al registrar la devolución');
    } finally {
      setEnviando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div
      onClick={onCerrar}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)] font-syne">
                Devolución de Mercadería
              </h3>
              <p className="text-xs text-slate-500">
                Reingreso de unidades al inventario y registro en Kardex
              </p>
            </div>
          </div>

          <button
            onClick={onCerrar}
            className="w-10 h-10 rounded-xl hover:bg-[var(--bg-alt)] text-slate-500 flex items-center justify-center active:scale-95 transition-all"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {resultado ? (
          <div className="space-y-4 animate-scale-up">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-2.5">
              <CheckCircle2 size={18} />
              <span>Devolución Exitosa — #{resultado.numeroComprobante}</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Artículos Reingresados al Kardex
              </span>
              {resultado.items.map((it) => (
                <div
                  key={it.nombreProducto}
                  className="p-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-[var(--text)] flex-1 truncate pr-2">
                    {it.nombreProducto}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold font-mono mr-3">
                    +{it.cantidad}
                  </span>
                  <span className="font-mono text-slate-500">
                    {it.stockAnterior} → <b className="text-primary">{it.stockNuevo}</b>
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-alt)] flex justify-between items-center text-sm font-bold">
              <span>Total Reembolsado:</span>
              <span className="font-mono text-base text-primary">C$ {resultado.totalDevuelto.toFixed(2)}</span>
            </div>

            {resultado.alertasStockBajo.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Aviso de Stock Mínimo: </span>
                  {resultado.alertasStockBajo
                    .map((a) => `${a.nombreProducto} (${a.stockNuevo}/${a.stockMinimo})`)
                    .join(', ')}
                </div>
              </div>
            )}

            <button
              onClick={onCerrar}
              className="w-full h-11 min-h-[44px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs active:scale-95 transition-all"
            >
              Cerrar y Volver a Caja POS
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Buscador de productos con stock */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <Search size={16} className="text-slate-400 shrink-0" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre o SKU a devolver…"
                className="w-full bg-transparent border-none outline-none text-[var(--text)] text-xs sm:text-sm placeholder:text-slate-400"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="w-6 h-6 rounded-full hover:bg-[var(--bg-alt)] text-slate-400 flex items-center justify-center shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Resultados de búsqueda */}
            {busqueda.trim() !== '' && (
              <div className="p-1 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] max-h-48 overflow-y-auto space-y-1">
                {candidatos.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">
                    Sin resultados con stock gestionado
                  </p>
                ) : (
                  candidatos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregar(p)}
                      className="w-full p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-700/60 text-left flex items-center justify-between text-xs transition-colors"
                    >
                      <span className="font-bold text-[var(--text)] truncate pr-2">
                        {p.nombre}
                      </span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-slate-400 font-mono">Stock: {p.stock}</span>
                        <span className="font-mono font-bold text-primary">C$ {p.precio.toFixed(2)}</span>
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                          <Plus size={14} />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Lista de productos seleccionados para devolución */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {lineas.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-[var(--border)] rounded-2xl">
                  Usa el buscador para añadir los productos que el cliente devuelve
                </div>
              ) : (
                lineas.map((l) => (
                  <div
                    key={l.producto.id}
                    className="p-3 rounded-2xl bg-[var(--bg-alt)] border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                          {l.producto.nombre}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          C$ {l.producto.precio.toFixed(2)} c/u
                        </p>
                      </div>

                      {/* Quantity Controls (Target >= 40px) */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => cambiarCantidad(l.producto.id, -1)}
                          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[var(--text)] flex items-center justify-center active:scale-95"
                          aria-label="Disminuir"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center font-bold text-sm font-mono">
                          {l.cantidad}
                        </span>
                        <button
                          onClick={() => cambiarCantidad(l.producto.id, 1)}
                          className="w-9 h-9 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[var(--text)] flex items-center justify-center active:scale-95"
                          aria-label="Aumentar"
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          onClick={() => quitar(l.producto.id)}
                          className="w-9 h-9 ml-1 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center active:scale-95"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <input
                      value={l.motivo}
                      onChange={(e) =>
                        setLineas((prev) =>
                          prev.map((x) => (x.producto.id === l.producto.id ? { ...x, motivo: e.target.value } : x))
                        )
                      }
                      placeholder="Motivo (opcional): dañado, vencido, talla equivocada…"
                      className="w-full h-9 px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none focus:border-primary"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Referencia y Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="N.º Ticket o Referencia (opcional)"
                className="w-full h-10 min-h-[40px] px-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] text-xs focus:outline-none focus:border-primary"
              />
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Nombre del Cliente (opcional)"
                className="w-full h-10 min-h-[40px] px-3 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] text-xs focus:outline-none focus:border-primary"
              />
            </div>

            {/* Total Reembolso */}
            <div className="p-3.5 rounded-2xl bg-[var(--bg-alt)] flex justify-between items-center text-sm font-bold">
              <span className="text-[var(--text-muted)]">Total a Reembolsar:</span>
              <span className="font-mono text-lg font-extrabold text-primary">
                C$ {total.toFixed(2)}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={onCerrar}
                className="flex-1 h-11 min-h-[44px] rounded-xl border border-[var(--border)] text-[var(--text)] font-bold text-xs hover:bg-[var(--bg-alt)] active:scale-95 transition-all"
              >
                Cancelar
              </button>

              <button
                onClick={enviar}
                disabled={enviando || lineas.length === 0}
                className="flex-[2] h-11 min-h-[44px] rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirmar Devolución</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
