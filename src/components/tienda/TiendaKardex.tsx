'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SlidersHorizontal, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, Package } from '@/components/icons';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Kardex de Inventario (Entradas & Salidas)
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Historial de auditoría física de mercancías, compras a proveedores y mermas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              height: 40,
              borderRadius: 10,
              background: '#0066FF',
              color: 'white',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
            }}
          >
            <Plus size={16} />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Table of Kardex Movements */}
      {movimientos.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <SlidersHorizontal size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            No hay movimientos registrados en el Kardex
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Las ventas en POS y compras a proveedores registrarán movimientos aquí automáticamente.
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg-alt)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                }}
              >
                <th style={{ padding: '12px 16px' }}>Fecha & Hora</th>
                <th style={{ padding: '12px 16px' }}>Producto / SKU</th>
                <th style={{ padding: '12px 16px' }}>Tipo</th>
                <th style={{ padding: '12px 16px' }}>Cantidad</th>
                <th style={{ padding: '12px 16px' }}>Stock Anterior</th>
                <th style={{ padding: '12px 16px' }}>Nuevo Stock</th>
                <th style={{ padding: '12px 16px' }}>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movimientos.map((m) => {
                const esEntrada = m.tipo === 'ENTRADA';
                const esSalida = m.tipo === 'SALIDA' || m.tipo === 'VENTA_POS' || m.tipo === 'VENTA_DELIVERY';
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      color: 'var(--text)',
                    }}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 12 }}>
                      {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      {m.producto?.nombre || 'Producto'}
                      {m.producto?.codigoBarras && (
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>SKU: {m.producto.codigoBarras}</div>
                      )}
                    </td>

                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: esEntrada
                            ? 'rgba(52, 199, 89, 0.15)'
                            : esSalida
                            ? 'rgba(255, 59, 48, 0.15)'
                            : 'rgba(255, 149, 0, 0.15)',
                          color: esEntrada ? '#34C759' : esSalida ? '#FF3B30' : '#FF9500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {esEntrada ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                        {m.tipo}
                      </span>
                    </td>

                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                      {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                    </td>

                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{m.stockAnterior}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#0066FF' }}>{m.stockNuevo}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{m.motivo || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar Movimiento */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: 480,
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text)' }}>
              Registrar Movimiento de Inventario
            </h3>

            <form onSubmit={registrarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Producto *</label>
                <select
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    padding: '0 12px',
                    color: 'var(--text)',
                    marginTop: 4,
                  }}
                  required
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Tipo de Movimiento</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  >
                    <option value="ENTRADA">ENTRADA (Compra)</option>
                    <option value="SALIDA">SALIDA (Merma / Retiro)</option>
                    <option value="AJUSTE">AJUSTE (Conteo Físico)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Cantidad *</label>
                  <input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="10"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Motivo o Observación</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Factura de proveedor #4092, o Merma de insumos"
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    padding: '0 12px',
                    color: 'var(--text)',
                    marginTop: 4,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    height: 40,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    height: 40,
                    padding: '0 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#0066FF',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Registrando...' : 'Registrar Movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
