'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CreditCard, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle2, User, Search, DollarSign } from '@/components/icons';
import { notify } from '@/lib/notify';
import type { Producto } from './TiendaInventario';

interface ItemCarritoPOS {
  producto: Producto;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

interface FacturaDatos {
  numeroComprobante: string;
  fecha: string;
  hora: string;
  tiendaNombre: string;
  tiendaRuc: string;
  razonSocial: string;
  regimenDgi: string;
  direccion: string;
  telefono: string;
  clienteNombre: string;
  clienteRuc: string;
  metodoPago: string;
  items: { nombreProducto: string; cantidad: number; precioUnitario: number; subtotal: number }[];
  subtotal: number;
  descuento: number;
  total: number;
  montoRecibido: number;
  cambioDado: number;
  saludoFactura: string;
  piePaginaFactura: string;
  pieMarcaLogifast: string;
}

export function TiendaPOS({ isDark }: { isDark: boolean }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarritoPOS[]>([]);

  // Datos Cliente / Pago POS
  const [clienteNombre, setClienteNombre] = useState('Cliente General');
  const [clienteRuc, setClienteRuc] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'fiado'>('efectivo');
  const [descuento, setDescuento] = useState('0');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Modal Factura / Imprimir
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaDatos | null>(null);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/productos');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setProductos(data.productos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const agregarAlCarrito = (p: Producto) => {
    setCarrito((prev) => {
      const existe = prev.find((it) => it.producto.id === p.id);
      if (existe) {
        return prev.map((it) =>
          it.producto.id === p.id
            ? { ...it, cantidad: it.cantidad + 1, subtotal: (it.cantidad + 1) * it.precioUnitario }
            : it
        );
      }
      return [
        ...prev,
        { producto: p, cantidad: 1, precioUnitario: p.precio, subtotal: p.precio },
      ];
    });
  };

  const modificarCantidad = (prodId: string, delta: number) => {
    setCarrito((prev) =>
      prev
        .map((it) => {
          if (it.producto.id === prodId) {
            const nuevaCant = it.cantidad + delta;
            if (nuevaCant <= 0) return null;
            return { ...it, cantidad: nuevaCant, subtotal: nuevaCant * it.precioUnitario };
          }
          return it;
        })
        .filter(Boolean) as ItemCarritoPOS[]
    );
  };

  const eliminarDelCarrito = (prodId: string) => {
    setCarrito((prev) => prev.filter((it) => it.producto.id !== prodId));
  };

  const subtotalSum = carrito.reduce((sum, it) => sum + it.subtotal, 0);
  const descNum = Math.max(0, Number(descuento) || 0);
  const totalSum = Math.max(0, subtotalSum - descNum);
  const recibidoNum = Number(montoRecibido) || totalSum;
  const cambio = Math.max(0, recibidoNum - totalSum);

  const procesarVenta = async () => {
    if (carrito.length === 0) {
      notify.error('El carrito de venta POS está vacío');
      return;
    }

    setProcesando(true);
    try {
      const res = await fetch('/api/tienda/pos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre,
          clienteRuc,
          metodoPago,
          descuento: descNum,
          montoRecibido: recibidoNum,
          items: carrito.map((it) => ({
            productoId: it.producto.id,
            nombreProducto: it.producto.nombre,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('¡Venta procesada con éxito!');
        setFacturaEmitida(data.factura);
        setCarrito([]);
        setMontoRecibido('');
        setClienteNombre('Cliente General');
        setClienteRuc('');
        cargarProductos();
      } else {
        notify.error(data.error || 'Error al registrar la venta POS');
      }
    } catch (err) {
      notify.error('Error de conexión');
    } finally {
      setProcesando(false);
    }
  };

  const imprimirFactura = () => {
    window.print();
  };

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(busqueda))
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
      {/* Columna Izquierda: Catálogo Visual POS con Imágenes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Search Bar */}
        <div
          style={{
            background: 'var(--surface)',
            padding: 14,
            borderRadius: 16,
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar por nombre o escanea SKU con lector..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text)',
              fontSize: 14,
              width: '100%',
            }}
          />
        </div>

        {/* Product Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 12,
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            paddingRight: 4,
          }}
        >
          {filtrados.map((p) => (
            <div
              key={p.id}
              onClick={() => agregarAlCarrito(p)}
              style={{
                background: 'var(--surface)',
                borderRadius: 14,
                border: '1px solid var(--border)',
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              className="hover:shadow-md hover:-translate-y-0.5"
            >
              <div style={{ height: 110, background: 'var(--bg-alt)', position: 'relative' }}>
                {p.imagenUrl || p.portadaUrl ? (
                  <img
                    src={p.imagenUrl || p.portadaUrl || ''}
                    alt={p.nombre}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-muted)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {p.nombre.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 6,
                    right: 6,
                    background: 'rgba(0,0,0,0.75)',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 6,
                  }}
                >
                  Stock: {p.stock ?? 0}
                </div>
              </div>

              <div style={{ padding: 10, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>
                  {p.nombre}
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0066FF', marginTop: 6 }}>
                  C$ {p.precio.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Columna Derecha: Carrito y Cobro POS */}
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: 20,
          border: '1px solid var(--border)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
          <ShoppingCart size={20} style={{ color: '#0066FF' }} />
          <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
            Caja Registradora POS
          </h3>
        </div>

        {/* Items List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 40, fontSize: 13 }}>
              Haz clic en los productos para agregarlos a la venta
            </div>
          ) : (
            carrito.map((it) => (
              <div
                key={it.producto.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'var(--bg-alt)',
                  padding: 10,
                  borderRadius: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                    {it.producto.nombre}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    C$ {it.precioUnitario.toFixed(2)} c/u
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => modificarCantidad(it.producto.id, -1)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus size={12} />
                  </button>

                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', width: 20, textAlign: 'center' }}>
                    {it.cantidad}
                  </span>

                  <button
                    onClick={() => modificarCantidad(it.producto.id, 1)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 6,
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                      color: 'var(--text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={12} />
                  </button>

                  <button
                    onClick={() => eliminarDelCarrito(it.producto.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#FF453A',
                      cursor: 'pointer',
                      marginLeft: 4,
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Customer & Payment Form */}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <input
              type="text"
              placeholder="Nombre del Cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              style={{
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 8px',
                fontSize: 12,
                color: 'var(--text)',
              }}
            />
            <input
              type="text"
              placeholder="RUC / Cédula Cliente"
              value={clienteRuc}
              onChange={(e) => setClienteRuc(e.target.value)}
              style={{
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 8px',
                fontSize: 12,
                color: 'var(--text)',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
              style={{
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 8px',
                fontSize: 12,
                color: 'var(--text)',
              }}
            >
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta Débito/Crédito</option>
              <option value="transferencia">Transferencia Bancaria</option>
              <option value="fiado">Crédito / Fiado</option>
            </select>

            <input
              type="number"
              placeholder="Efectivo Recibido (C$)"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              style={{
                height: 34,
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 8px',
                fontSize: 12,
                color: 'var(--text)',
              }}
            />
          </div>

          {/* Totals */}
          <div style={{ background: 'var(--bg-alt)', padding: 10, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>C$ {subtotalSum.toFixed(2)}</span>
            </div>
            {metodoPago === 'efectivo' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#34C759', fontWeight: 600 }}>
                <span>Cambio a devolver:</span>
                <span>C$ {cambio.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: '#0066FF', marginTop: 4 }}>
              <span>TOTAL COBRAR:</span>
              <span>C$ {totalSum.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={procesarVenta}
            disabled={procesando || carrito.length === 0}
            style={{
              height: 44,
              borderRadius: 12,
              border: 'none',
              background: '#0066FF',
              color: 'white',
              fontSize: 15,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,102,255,0.4)',
            }}
          >
            {procesando ? 'Procesando Venta...' : 'Cobrar & Generar Factura'}
          </button>
        </div>
      </div>

      {/* Modal Factura / Imprimir Ticket */}
      {facturaEmitida && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              color: '#000000',
              width: 380,
              borderRadius: 16,
              padding: 24,
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: 12,
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
            className="printable-ticket"
          >
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{facturaEmitida.tiendaNombre}</div>
              <div>{facturaEmitida.razonSocial}</div>
              <div>RUC: {facturaEmitida.tiendaRuc}</div>
              <div>DGI: {facturaEmitida.regimenDgi}</div>
              <div>{facturaEmitida.direccion}</div>
              {facturaEmitida.telefono && <div>Tel: {facturaEmitida.telefono}</div>}
              <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />
              <div>COMPROBANTE POS #{facturaEmitida.numeroComprobante}</div>
              <div>{facturaEmitida.fecha} - {facturaEmitida.hora}</div>
              <div>Cliente: {facturaEmitida.clienteNombre}</div>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {facturaEmitida.items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{it.cantidad}x {it.nombreProducto}</span>
                  <span>C${it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>TOTAL:</span>
              <span>C$ {facturaEmitida.total.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pago ({facturaEmitida.metodoPago}):</span>
              <span>C$ {facturaEmitida.montoRecibido.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Cambio:</span>
              <span>C$ {facturaEmitida.cambioDado.toFixed(2)}</span>
            </div>

            <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }} />

            <div style={{ textAlign: 'center', fontSize: 10, marginTop: 8 }}>
              <div>{facturaEmitida.saludoFactura}</div>
              <div style={{ marginTop: 4 }}>{facturaEmitida.piePaginaFactura}</div>
              <div style={{ marginTop: 8, fontWeight: 'bold' }}>
                *** {facturaEmitida.pieMarcaLogifast} ***
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16 }} className="no-print">
              <button
                onClick={imprimirFactura}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 8,
                  background: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Printer size={14} /> Imprimir Ticket
              </button>

              <button
                onClick={() => setFacturaEmitida(null)}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 8,
                  background: '#E5E5EA',
                  color: '#000000',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
