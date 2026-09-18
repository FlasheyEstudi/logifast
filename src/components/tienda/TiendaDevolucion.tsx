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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

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
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
    >
      <Card
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--surface)] rounded-[var(--lf-card-radius)] border border-[var(--border)] shadow-[var(--lf-shadow-float)] max-h-[90vh] overflow-y-auto"
      >
        <CardContent className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-[var(--lf-card-radius)] bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center shrink-0">
                <RotateCcw size={20} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-[var(--text)] m-0">
                  Devolución de Mercadería
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 mb-0">
                  Reingreso de unidades al inventario y registro en Kardex
                </p>
              </div>
            </div>

            <button
              onClick={onCerrar}
              className="w-9 h-9 rounded-full hover:bg-[var(--bg-alt)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center justify-center transition-colors"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </div>

          {resultado ? (
            <div className="space-y-4">
              <div className="p-4 rounded-[var(--lf-card-radius)] bg-[var(--exito)]/10 border border-[var(--exito)] text-[var(--exito)] font-bold text-sm flex items-center gap-2.5">
                <CheckCircle2 size={18} />
                <span>Devolución Exitosa — #{resultado.numeroComprobante}</span>
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block ml-1">
                  Artículos Reingresados al Kardex
                </span>
                {resultado.items.map((it) => (
                  <div
                    key={it.nombreProducto}
                    className="p-3.5 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)]/70 border border-[var(--border)] flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-[var(--text)] flex-1 truncate pr-2">
                      {it.nombreProducto}
                    </span>
                    <span className="text-[var(--exito)] font-bold font-mono mr-3">
                      +{it.cantidad}
                    </span>
                    <span className="font-mono text-[var(--text-muted)]">
                      {it.stockAnterior} → <b className="text-primary">{it.stockNuevo}</b>
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)]/80 flex justify-between items-center text-sm font-bold border border-[var(--border)]">
                <span>Total Reembolsado:</span>
                <span className="font-mono text-base font-black text-primary">C$ {resultado.totalDevuelto.toFixed(2)}</span>
              </div>

              {resultado.alertasStockBajo.length > 0 && (
                <div className="p-3.5 rounded-[var(--lf-card-radius)] bg-[var(--warning)]/10 border border-[var(--warning)] text-[var(--warning)] text-xs flex items-start gap-2">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Aviso de Stock Mínimo: </span>
                    {resultado.alertasStockBajo
                      .map((a) => `${a.nombreProducto} (${a.stockNuevo}/${a.stockMinimo})`)
                      .join(', ')}
                  </div>
                </div>
              )}

              <Button
                onClick={onCerrar}
                className="w-full h-11 rounded-full text-xs font-bold shadow-[var(--lf-shadow-card)] shadow-primary/20"
              >
                Cerrar y Volver a Caja POS
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Buscador de productos cápsula */}
              <div className="relative flex items-center">
                <Search size={16} className="absolute left-3.5 text-[var(--text-muted)] pointer-events-none" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto por nombre o SKU a devolver…"
                  className="pl-10 pr-10 h-11 rounded-full text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary/20 shadow-[var(--lf-shadow-card)]"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 w-6 h-6 rounded-full hover:bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-muted)]/90 flex items-center justify-center"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* Resultados de búsqueda */}
              {busqueda.trim() !== '' && (
                <div className="p-1.5 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)] border border-[var(--border)] max-h-48 overflow-y-auto space-y-1">
                  {candidatos.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] text-center py-3">
                      Sin resultados con stock gestionado
                    </p>
                  ) : (
                    candidatos.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => agregar(p)}
                        className="w-full p-2.5 rounded-xl hover:bg-[var(--surface)] text-left flex items-center justify-between text-xs transition-colors cursor-pointer"
                      >
                        <span className="font-bold text-[var(--text)] truncate pr-2">
                          {p.nombre}
                        </span>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[var(--text-muted)] font-mono">Stock: {p.stock}</span>
                          <span className="font-mono font-bold text-primary">C$ {p.precio.toFixed(2)}</span>
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                            <Plus size={14} />
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Lista de productos seleccionados para devolución */}
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {lineas.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[var(--text-muted)] border border-dashed border-[var(--border)] rounded-[var(--lf-card-radius)]">
                    Usa el buscador para añadir los productos que el cliente devuelve
                  </div>
                ) : (
                  lineas.map((l) => (
                    <div
                      key={l.producto.id}
                      className="p-3.5 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)]/70 border border-[var(--border)] space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-[var(--text)] truncate">
                            {l.producto.nombre}
                          </p>
                          <p className="text-[11px] text-[var(--text-muted)] font-mono">
                            C$ {l.producto.precio.toFixed(2)} c/u
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => cambiarCantidad(l.producto.id, -1)}
                            className="w-8 h-8 rounded-full border-[var(--border)]"
                            aria-label="Disminuir"
                          >
                            <Minus size={13} />
                          </Button>
                          <span className="w-8 text-center font-bold text-sm font-mono">
                            {l.cantidad}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => cambiarCantidad(l.producto.id, 1)}
                            className="w-8 h-8 rounded-full border-[var(--border)]"
                            aria-label="Aumentar"
                          >
                            <Plus size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => quitar(l.producto.id)}
                            className="w-8 h-8 ml-0.5 rounded-full text-[var(--peligro)] hover:bg-[var(--peligro)]/10 hover:text-[var(--peligro)]/90"
                            aria-label="Eliminar"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>

                      <Input
                        value={l.motivo}
                        onChange={(e) =>
                          setLineas((prev) =>
                            prev.map((x) => (x.producto.id === l.producto.id ? { ...x, motivo: e.target.value } : x))
                          )
                        }
                        placeholder="Motivo (opcional): dañado, vencido, talla equivocada…"
                        className="h-10 rounded-xl text-xs bg-[var(--surface)] border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Referencia y Cliente */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <Input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="N.º Ticket o Referencia (opcional)"
                  className="h-11 rounded-[var(--lf-card-radius)] text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary/20"
                />
                <Input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del Cliente (opcional)"
                  className="h-11 rounded-[var(--lf-card-radius)] text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Total Reembolso */}
              <div className="p-4 rounded-[var(--lf-card-radius)] bg-[var(--bg-alt)]/80 border border-[var(--border)] flex justify-between items-center text-sm font-bold">
                <span className="text-[var(--text-muted)]">Total a Reembolsar:</span>
                <span className="font-mono text-lg font-black text-primary">
                  C$ {total.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  variant="outline"
                  onClick={onCerrar}
                  className="flex-1 h-11 rounded-full text-xs font-bold border-[var(--border)]"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={enviar}
                  disabled={enviando || lineas.length === 0}
                  className="flex-[2] h-11 rounded-full text-xs font-bold gap-1.5 bg-[var(--exito)] hover:bg-[var(--exito)]/90 text-white shadow-[var(--lf-shadow-card)] shadow-[var(--exito)]/20"
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
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
