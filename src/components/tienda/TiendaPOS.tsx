'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreditCard, ShoppingCart, Plus, Minus, Trash2, Printer, CheckCircle2, User, Search, DollarSign, Camera, Wifi, RotateCcw } from '@/components/icons';
import { notify } from '@/lib/notify';
import { onRealtimeEvent, realtime } from '@/services/realtime';
import type { Producto } from './TiendaInventario';
import { TiendaDevolucion } from './TiendaDevolucion';

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

  // Escáner inalámbrico: el celular del operador transmite los códigos que lee.
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [escanerPin, setEscanerPin] = useState('');
  const [lectorConectado, setLectorConectado] = useState(false);
  const [ultimosEscaneos, setUltimosEscaneos] = useState<
    { codigo: string; estado: 'ok' | 'sin-producto' | 'ambiguo'; detalle: string; hora: string }[]
  >([]);
  const [origenWeb, setOrigenWeb] = useState('');

  // Devolución de mercadería (reingreso de stock + Kardex)
  const [devolucionAbierta, setDevolucionAbierta] = useState(false);
  const escanerPinRef = useRef('');                       // sesión viva, leída desde los listeners
  const manejarCodigoRef = useRef<(codigo: string, origen: 'inalambrico' | 'pistola') => void>(() => {});

  useEffect(() => {
    setOrigenWeb(window.location.origin);
  }, []);

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
    // stock === null (o sin definir) => el producto no gestiona stock: sin tope
    const stockDisponible = p.stock ?? null;

    if (stockDisponible !== null) {
      const enCarrito = carrito.find((it) => it.producto.id === p.id)?.cantidad ?? 0;
      if (stockDisponible <= 0 || enCarrito + 1 > stockDisponible) {
        notify.warning(`Stock insuficiente para "${p.nombre}". Disponible: ${stockDisponible}`);
        return;
      }
    }

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

  // ─── Escáner: resolver un código contra el catálogo y agregarlo a la venta ───
  const generarPinEscaner = () => {
    try {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return String(100000 + (buf[0] % 900000));
    } catch {
      return String(Math.floor(100000 + Math.random() * 900000));
    }
  };

  const manejarCodigo = useCallback(
    (codigoCrudo: string, origen: 'inalambrico' | 'pistola') => {
      const codigo = String(codigoCrudo ?? '').trim();
      if (!codigo) return;
      const encontrados = productos.filter((p) => p.codigoBarras && p.codigoBarras.trim() === codigo);
      const hora = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const registrar = (estado: 'ok' | 'sin-producto' | 'ambiguo', detalle: string) =>
        setUltimosEscaneos((prev) => [{ codigo, estado, detalle, hora }, ...prev].slice(0, 5));

      if (encontrados.length === 1) {
        agregarAlCarrito(encontrados[0]);
        registrar('ok', `+1 ${encontrados[0].nombre}`);
        if (origen === 'pistola') notify.success(`${encontrados[0].nombre} agregado`);
        if (escanerPinRef.current) realtime.escanerResultado(escanerPinRef.current, codigo, true, encontrados[0].nombre);
        return;
      }

      // Un código desconocido no debe romper la venta: queda en el buscador para revisarlo a mano.
      setBusqueda(codigo);
      if (encontrados.length === 0) {
        registrar('sin-producto', 'Sin producto con ese código');
        notify.warning(`Código ${codigo}: sin producto registrado`);
        if (escanerPinRef.current) realtime.escanerResultado(escanerPinRef.current, codigo, false, null);
      } else {
        registrar('ambiguo', `${encontrados.length} productos comparten el código`);
        if (escanerPinRef.current) realtime.escanerResultado(escanerPinRef.current, codigo, true, null);
      }
    },
    [productos, agregarAlCarrito]
  );

  // Los listeners de socket se registran una sola vez; la lógica se lee del ref
  // para no reconectar cada vez que cambia el catálogo o el carrito.
  useEffect(() => {
    manejarCodigoRef.current = manejarCodigo;
  }, [manejarCodigo]);

  // Pistolas lectoras físicas: se comportan como un teclado que teclea en ráfaga y
  // termina con Enter. Se distingue del tecleo humano por la velocidad de la ráfaga.
  useEffect(() => {
    let buffer = '';
    let inicioRafaga = 0;
    let ultimaTecla = 0;

    const alTeclear = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const ahora = Date.now();
      if (ahora - ultimaTecla > 120) {
        buffer = '';
        inicioRafaga = ahora;
      }
      ultimaTecla = ahora;

      if (e.key === 'Enter') {
        const codigo = buffer;
        buffer = '';
        const msPorCaracter = codigo.length > 1 ? (ultimaTecla - inicioRafaga) / codigo.length : 999;
        if (codigo.length >= 6 && msPorCaracter <= 60) {
          e.preventDefault();
          setBusqueda('');
          manejarCodigoRef.current(codigo, 'pistola');
        }
        return;
      }
      if (e.key.length === 1) buffer += e.key;
    };

    window.addEventListener('keydown', alTeclear, true);
    return () => window.removeEventListener('keydown', alTeclear, true);
  }, []);

  // Eventos del escáner inalámbrico
  useEffect(() => {
    const offs = [
      onRealtimeEvent('escaner:presencia', (d: { lectorConectado?: boolean }) => {
        if (!escanerPinRef.current) return;
        setLectorConectado(!!d?.lectorConectado);
      }),
      onRealtimeEvent('escaner:codigo:recibido', (d: { codigo?: string }) => {
        if (d?.codigo) manejarCodigoRef.current(d.codigo, 'inalambrico');
      }),
      onRealtimeEvent('escaner:cerrada', (d: { motivo?: string }) => {
        if (!escanerPinRef.current) return;
        escanerPinRef.current = '';
        setEscanerPin('');
        setLectorConectado(false);
        notify.warning(
          d?.motivo === 'expirada' ? 'La sesión del escáner expiró por inactividad' : 'La sesión del escáner se cerró'
        );
      }),
      onRealtimeEvent('escaner:error', (d: { mensaje?: string }) => {
        if (d?.mensaje) notify.error(d.mensaje);
      }),
    ];
    return () => {
      offs.forEach((off) => off());
      // Al salir del POS la sesión se cierra: el celular recibe `escaner:cerrada`.
      if (escanerPinRef.current) realtime.escanerCerrar(escanerPinRef.current);
    };
  }, []);

  const abrirEscaner = () => {
    const pin = generarPinEscaner();
    escanerPinRef.current = pin;
    setEscanerPin(pin);
    setLectorConectado(false);
    setUltimosEscaneos([]);
    setEscanerAbierto(true);
    realtime.escanerAbrir(pin);
  };

  const cerrarEscaner = () => {
    if (escanerPinRef.current) realtime.escanerCerrar(escanerPinRef.current);
    escanerPinRef.current = '';
    setEscanerPin('');
    setLectorConectado(false);
    setEscanerAbierto(false);
  };

  const modificarCantidad = (prodId: string, delta: number) => {
    const item = carrito.find((it) => it.producto.id === prodId);
    // stock === null (o sin definir) => el producto no gestiona stock: sin tope
    const stockDisponible = item?.producto.stock ?? null;

    if (item && delta > 0 && stockDisponible !== null && item.cantidad + delta > stockDisponible) {
      notify.warning(`Stock insuficiente para "${item.producto.nombre}". Disponible: ${stockDisponible}`);
      return;
    }

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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5">
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
          <button
            onClick={abrirEscaner}
            title="Emparejar un celular como lector de códigos de barras"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: lectorConectado ? '1px solid rgba(34,197,94,.5)' : '1px solid var(--border)',
              background: lectorConectado ? 'rgba(34,197,94,.12)' : 'var(--bg-alt)',
              color: lectorConectado ? '#22C55E' : 'var(--text)',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <Camera size={15} />
            {escanerAbierto ? (lectorConectado ? 'Lector activo' : 'Esperando…') : 'Escáner'}
          </button>
          <button
            onClick={() => setDevolucionAbierta(true)}
            title="Devolver mercadería al inventario"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              height: 36,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              color: 'var(--text)',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            <RotateCcw size={15} /> Devolución
          </button>
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
      <TiendaDevolucion
        abierto={devolucionAbierta}
        onCerrar={() => setDevolucionAbierta(false)}
        productos={productos}
        onDevuelto={cargarProductos}
      />

      {/* Escáner inalámbrico: la tablet espera al celular del operador */}
      {escanerAbierto && (
        <div
          onClick={cerrarEscaner}
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
              maxWidth: 460,
              background: 'var(--surface)',
              borderRadius: 18,
              border: '1px solid var(--border)',
              padding: 20,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Camera size={18} /> Escáner inalámbrico
              </h3>
              <span
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: lectorConectado ? 'rgba(34,197,94,.15)' : 'rgba(148,163,184,.15)',
                  color: lectorConectado ? '#22C55E' : 'var(--text-muted)',
                }}
              >
                {lectorConectado ? 'LECTOR CONECTADO' : 'ESPERANDO LECTOR…'}
              </span>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '10px 0 0', lineHeight: 1.5 }}>
              En el celular abre <b>{origenWeb}/escaner</b> y teclea este PIN:
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 38,
                  fontWeight: 800,
                  letterSpacing: 10,
                  fontFamily: 'ui-monospace, monospace',
                  padding: '10px 0',
                  borderRadius: 14,
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                }}
              >
                {escanerPin}
              </div>
              <Wifi size={22} style={{ color: lectorConectado ? '#22C55E' : 'var(--text-muted)' }} />
            </div>

            {origenWeb.includes('localhost') || origenWeb.includes('127.0.0.1') ? (
              <p style={{ fontSize: 12, color: '#F59E0B', margin: '10px 0 0' }}>
                El celular no puede abrir <b>localhost</b>: usa la IP de esta PC en la red (ej. http://192.168.1.10:3000/escaner).
              </p>
            ) : null}

            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>ÚLTIMAS LECTURAS</div>
              {ultimosEscaneos.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Sin lecturas todavía.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ultimosEscaneos.map((e, i) => (
                    <div
                      key={`${e.codigo}-${i}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        borderRadius: 10,
                        background: 'var(--bg-alt)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, fontWeight: 700 }}>{e.codigo}</span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color: e.estado === 'ok' ? '#22C55E' : e.estado === 'ambiguo' ? '#F59E0B' : '#EF4444',
                        }}
                      >
                        {e.detalle}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.hora}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={cerrarEscaner}
              style={{
                width: '100%',
                marginTop: 16,
                height: 42,
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cerrar sesión de escaneo
            </button>
          </div>
        </div>
      )}

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
