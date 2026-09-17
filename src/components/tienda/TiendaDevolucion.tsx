'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Trash2, Search, CheckCircle2 } from '@/components/icons';
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
  /** Se llama tras registrar: el POS recarga el catálogo para reflejar el stock nuevo. */
  onDevuelto: () => void | Promise<void>;
}

/**
 * Devolución de mercadería desde el POS.
 *
 * Reingresa unidades al inventario (Kardex `DEVOLUCION`) y registra el reembolso.
 * Solo acepta productos que gestionan stock (`stock !== null`): el resto no tiene
 * existencias que reingresar y la API lo rechazaría.
 */
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

  const sinControlDeStock = useMemo(
    () => (busqueda.trim() ? productos.filter((p) => p.stock === null || p.stock === undefined).length : 0),
    [busqueda, productos]
  );

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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 560,
          background: 'var(--surface)',
          borderRadius: 18,
          border: '1px solid var(--border)',
          padding: 20,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <h3 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800 }}>Devolución de mercadería</h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: 0 }}>
          Las unidades vuelven al inventario y quedan registradas en el Kardex.
        </p>

        {resultado ? (
          <div style={{ marginTop: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(34,197,94,.12)',
                border: '1px solid rgba(34,197,94,.35)',
                color: '#22C55E',
                fontWeight: 700,
                fontSize: 13.5,
              }}
            >
              <CheckCircle2 size={16} /> Devuelto — comprobante {resultado.numeroComprobante}
            </div>

            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {resultado.items.map((it) => (
                <div
                  key={it.nombreProducto}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    background: 'var(--bg-alt)',
                    border: '1px solid var(--border)',
                    fontSize: 13,
                  }}
                >
                  <span style={{ flex: 1 }}>{it.nombreProducto}</span>
                  <span style={{ color: 'var(--text-muted)' }}>+{it.cantidad}</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700 }}>
                    {it.stockAnterior} → {it.stockNuevo}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 800 }}>
              Total devuelto: C$ {resultado.totalDevuelto.toFixed(2)}
            </div>

            {resultado.alertasStockBajo.length > 0 && (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: 'rgba(245,158,11,.12)',
                  border: '1px solid rgba(245,158,11,.35)',
                  color: '#F59E0B',
                  fontSize: 12.5,
                  lineHeight: 1.5,
                }}
              >
                <b>Stock bajo:</b>{' '}
                {resultado.alertasStockBajo
                  .map((a) => `${a.nombreProducto} (${a.stockNuevo}/${a.stockMinimo})`)
                  .join(', ')}
              </div>
            )}

            <button
              onClick={onCerrar}
              style={{
                width: '100%',
                marginTop: 16,
                height: 42,
                borderRadius: 12,
                border: 'none',
                background: 'var(--bg-alt)',
                color: 'var(--text)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0 12px',
                height: 42,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)' }} />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar producto por nombre o código…"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 14 }}
              />
            </div>

            {busqueda.trim() !== '' && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {candidatos.length === 0 ? (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', padding: '6px 2px' }}>
                    Sin resultados con stock gestionado{sinControlDeStock > 0 ? ' (hay productos del catálogo que no controlan existencias)' : ''}.
                  </div>
                ) : (
                  candidatos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => agregar(p)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '9px 10px',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: 13,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span style={{ flex: 1 }}>{p.nombre}</span>
                      <span style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>stock {p.stock}</span>
                      <span style={{ fontWeight: 700 }}>C$ {p.precio.toFixed(2)}</span>
                    </button>
                  ))
                )}
              </div>
            )}

            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {lineas.length === 0 ? (
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>Aún no hay productos en la devolución.</div>
              ) : (
                lineas.map((l) => (
                  <div
                    key={l.producto.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ flex: 1, fontSize: 13.5, fontWeight: 600 }}>{l.producto.nombre}</span>
                      <button
                        onClick={() => cambiarCantidad(l.producto.id, -1)}
                        aria-label="Quitar una unidad"
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 800 }}>{l.cantidad}</span>
                      <button
                        onClick={() => cambiarCantidad(l.producto.id, 1)}
                        aria-label="Agregar una unidad"
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: 'pointer' }}
                      >
                        <Plus size={13} />
                      </button>
                      <button
                        onClick={() => quitar(l.producto.id)}
                        aria-label="Quitar de la devolución"
                        style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', color: '#EF4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      value={l.motivo}
                      onChange={(e) =>
                        setLineas((prev) =>
                          prev.map((x) => (x.producto.id === l.producto.id ? { ...x, motivo: e.target.value } : x))
                        )
                      }
                      placeholder="Motivo (opcional): dañado, talla equivocada…"
                      style={{
                        width: '100%',
                        marginTop: 8,
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="N.º de factura o referencia (opcional)"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
              <input
                value={clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value)}
                placeholder="Cliente (opcional)"
                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--bg-alt)', color: 'var(--text)', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total a devolver</span>
              <span style={{ fontSize: 18, fontWeight: 800 }}>C$ {total.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button
                onClick={onCerrar}
                style={{ flex: 1, height: 44, borderRadius: 12, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', fontWeight: 700, cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                onClick={enviar}
                disabled={enviando || lineas.length === 0}
                style={{
                  flex: 2,
                  height: 44,
                  borderRadius: 12,
                  border: 'none',
                  background: lineas.length === 0 || enviando ? '#2A2A33' : '#22C55E',
                  color: lineas.length === 0 || enviando ? 'var(--text-muted)' : '#06240F',
                  fontWeight: 800,
                  cursor: enviando || lineas.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {enviando ? 'Registrando…' : 'Registrar devolución'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
