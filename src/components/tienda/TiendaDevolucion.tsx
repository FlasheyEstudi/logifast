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
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-[var(--border)] pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--lf-card-radius)] bg-[var(--warning)]/10 text-[var(--warning)]">
                <RotateCcw size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="m-0 font-syne text-base font-semibold tracking-tight text-[var(--text)]">
                  Devolución de Mercadería
                </h3>
                <p className="mb-0 mt-0.5 text-xs text-[var(--text-muted)]">
                  Reingreso de unidades al inventario y registro en Kardex
                </p>
              </div>
            </div>

            <button
              onClick={onCerrar}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--bg-alt)] hover:text-[var(--text)]"
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
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Artículos Reingresados al Kardex
                </span>
                {resultado.items.map((it) => (
                  <div
                    key={it.nombreProducto}
                    className="flex items-center justify-between gap-3 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-[var(--text)]">
                        {it.nombreProducto}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        {it.stockAnterior} → <b className="font-bold text-[var(--text)]">{it.stockNuevo}</b>
                      </p>
                    </div>
                    <Badge className="shrink-0 rounded-full border-[var(--exito)] bg-[var(--exito)]/15 px-2.5 py-1 font-mono text-xs font-bold text-[var(--exito)]">
                      +{it.cantidad}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex items-baseline justify-between gap-3 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total Reembolsado:</span>
                <span className="shrink-0 font-mono text-xl font-black text-[var(--text)]">C$ {resultado.totalDevuelto.toFixed(2)}</span>
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
                className="w-full h-11 rounded-full text-sm font-bold shadow-[var(--lf-shadow-card)]"
              >
                Cerrar y Volver a Caja POS
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Buscador de productos cápsula */}
              <div className="relative flex items-center">
                <Search size={16} className="pointer-events-none absolute left-3.5 text-[var(--text-muted)]" />
                <Input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar producto por nombre o SKU a devolver…"
                  className="h-11 rounded-full border-[var(--border)] bg-[var(--bg-alt)] pl-10 pr-14 text-xs text-[var(--text)] shadow-[var(--lf-shadow-card)] focus-visible:ring-2 focus-visible:ring-[var(--primario)]"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text)]"
                    aria-label="Limpiar búsqueda"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Resultados de búsqueda */}
              {busqueda.trim() !== '' && (
                <div className="max-h-60 space-y-1 overflow-y-auto rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-1.5">
                  {candidatos.length === 0 ? (
                    <p className="py-3 text-center text-xs text-[var(--text-muted)]">
                      Sin resultados con stock gestionado
                    </p>
                  ) : (
                    candidatos.map((p) => {
                      const stockBajo = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);
                      return (
                        <button
                          key={p.id}
                          onClick={() => agregar(p)}
                          className="flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--lf-input-radius)] p-2.5 text-left transition-colors hover:bg-[var(--surface)]"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-xs font-bold text-[var(--text)]">{p.nombre}</p>
                            <Badge
                              className={`mt-1 rounded-full px-2 py-0.5 font-mono text-[11px] font-bold ${
                                stockBajo
                                  ? 'border-[var(--warning)] bg-[var(--warning)]/15 text-[var(--warning)]'
                                  : 'border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)]'
                              }`}
                            >
                              Stock: {p.stock}
                            </Badge>
                          </div>
                          <span className="shrink-0 font-mono text-xs font-bold text-[var(--primario)]">
                            C$ {p.precio.toFixed(2)}
                          </span>
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--primario)]">
                            <Plus size={15} />
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Lista de productos seleccionados para devolución */}
              <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
                {lineas.length === 0 ? (
                  <div className="rounded-[var(--lf-card-radius)] border border-dashed border-[var(--border)] px-4 py-8 text-center text-xs text-[var(--text-muted)]">
                    Usa el buscador para añadir los productos que el cliente devuelve
                  </div>
                ) : (
                  lineas.map((l) => (
                    <div
                      key={l.producto.id}
                      className="space-y-3 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] p-3.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold text-[var(--text)]">
                            {l.producto.nombre}
                          </p>
                          <p className="font-mono text-xs text-[var(--text-muted)]">
                            C$ {l.producto.precio.toFixed(2)} c/u
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-sm font-bold text-[var(--text)]">
                          C$ {(l.producto.precio * l.cantidad).toFixed(2)}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => cambiarCantidad(l.producto.id, -1)}
                            className="h-11 w-11 rounded-full border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-none"
                            aria-label="Disminuir"
                          >
                            <Minus size={16} />
                          </Button>
                          <span className="w-10 text-center font-mono text-sm font-bold text-[var(--text)]">
                            {l.cantidad}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => cambiarCantidad(l.producto.id, 1)}
                            className="h-11 w-11 rounded-full border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-none"
                            aria-label="Aumentar"
                          >
                            <Plus size={16} />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => quitar(l.producto.id)}
                          className="h-11 w-11 rounded-full text-[var(--peligro)] hover:bg-[var(--peligro)]/10 hover:text-[var(--peligro)]"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>

                      <Input
                        value={l.motivo}
                        onChange={(e) =>
                          setLineas((prev) =>
                            prev.map((x) => (x.producto.id === l.producto.id ? { ...x, motivo: e.target.value } : x))
                          )
                        }
                        placeholder="Motivo (opcional): dañado, vencido, talla equivocada…"
                        className="h-11 rounded-[var(--lf-input-radius)] border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--primario)]"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Referencia y Cliente */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Input
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="N.º Ticket o Referencia (opcional)"
                  className="h-11 rounded-[var(--lf-input-radius)] border-[var(--border)] bg-[var(--bg-alt)] text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--primario)]"
                />
                <Input
                  value={clienteNombre}
                  onChange={(e) => setClienteNombre(e.target.value)}
                  placeholder="Nombre del Cliente (opcional)"
                  className="h-11 rounded-[var(--lf-input-radius)] border-[var(--border)] bg-[var(--bg-alt)] text-xs text-[var(--text)] focus-visible:ring-2 focus-visible:ring-[var(--primario)]"
                />
              </div>

              {/* Total Reembolso */}
              <div className="flex items-baseline justify-between gap-3 rounded-[var(--lf-card-radius)] border border-[var(--border)] bg-[var(--bg-alt)] px-4 py-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Total a Reembolsar:</span>
                <span className="shrink-0 font-mono text-xl font-black text-[var(--text)]">
                  C$ {total.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <Button
                  variant="outline"
                  onClick={onCerrar}
                  className="h-11 flex-1 rounded-full border-[var(--border)] text-xs font-bold text-[var(--text-muted)] shadow-none"
                >
                  Cancelar
                </Button>

                <Button
                  onClick={enviar}
                  disabled={enviando || lineas.length === 0}
                  className="h-11 flex-[2] rounded-full text-xs font-bold gap-1.5 shadow-[var(--lf-shadow-card)]"
                >
                  {enviando ? (
                    <>
                      <RotateCcw size={16} className="animate-spin" />
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
