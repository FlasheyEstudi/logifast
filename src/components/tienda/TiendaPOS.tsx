'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  CreditCard,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  User,
  Search,
  DollarSign,
  Camera,
  Wifi,
  RotateCcw,
  X,
  ChevronUp,
  Package,
  Sparkles,
  Layers,
  AlertTriangle,
} from '@/components/icons';
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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';


export function TiendaPOS({ isDark }: { isDark: boolean }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todos');
  const [carrito, setCarrito] = useState<ItemCarritoPOS[]>([]);

  // Drawer para Carrito Móvil
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Datos Cliente / Pago POS
  const [clienteNombre, setClienteNombre] = useState('Cliente General');
  const [clienteRuc, setClienteRuc] = useState('');
  const [metodoPago, setMetodoPago] = useState<'efectivo' | 'tarjeta' | 'transferencia' | 'fiado'>('efectivo');
  const [descuento, setDescuento] = useState('0');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Modal Factura / Imprimir
  const [facturaEmitida, setFacturaEmitida] = useState<FacturaDatos | null>(null);

  // Escáner inalámbrico
  const [escanerAbierto, setEscanerAbierto] = useState(false);
  const [escanerPin, setEscanerPin] = useState('');
  const [lectorConectado, setLectorConectado] = useState(false);
  const [ultimosEscaneos, setUltimosEscaneos] = useState<
    { codigo: string; estado: 'ok' | 'sin-producto' | 'ambiguo'; detalle: string; hora: string }[]
  >([]);
  const [origenWeb, setOrigenWeb] = useState('');

  // Devolución de mercadería (reingreso de stock + Kardex)
  const [devolucionAbierta, setDevolucionAbierta] = useState(false);
  const escanerPinRef = useRef('');
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
    [productos, carrito]
  );

  useEffect(() => {
    manejarCodigoRef.current = manejarCodigo;
  }, [manejarCodigo]);

  // Pistolas lectoras físicas
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
  const totalItemsCount = carrito.reduce((sum, it) => sum + it.cantidad, 0);

  // Botones de Efectivo Rápido
  const setCashAmount = (amount: number) => {
    setMontoRecibido(String(amount));
  };

  const addCashAmount = (addVal: number) => {
    const current = Number(montoRecibido) || 0;
    setMontoRecibido(String(current + addVal));
  };

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
        setMobileCartOpen(false);
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

  // Categorías dinámicas
  const categorias = useMemo(() => {
    const cats = new Set<string>();
    productos.forEach((p) => {
      if (p.categoriaNombre && p.categoriaNombre.trim()) {
        cats.add(p.categoriaNombre.trim());
      }
    });
    return ['todos', ...Array.from(cats)];
  }, [productos]);

  const filtrados = productos.filter((p) => {
    const matchBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(busqueda));
    const matchCat =
      categoriaSeleccionada === 'todos' ||
      (p.categoriaNombre && p.categoriaNombre.toLowerCase() === categoriaSeleccionada.toLowerCase());
    return matchBusqueda && matchCat;
  });

  // Reusable Checkout Cart Panel (Rendered on Desktop column & Mobile Drawer)
  const renderCartContent = (isDrawer = false) => (
    <div className="flex flex-col h-full">
      {/* Drawer Drag Header on mobile */}
      {isDrawer && (
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/60 dark:border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <ShoppingCart size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--text)] font-syne">
                Caja Registradora POS
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {totalItemsCount} {totalItemsCount === 1 ? 'producto' : 'productos'} en venta
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileCartOpen(false)}
            className="w-9 h-9 rounded-full bg-[var(--bg-alt)] hover:bg-[var(--surface-elevated)] text-slate-500 flex items-center justify-center active:scale-95 transition-all shadow-xs"
            aria-label="Cerrar carrito"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 min-h-[140px]">
        {carrito.length === 0 ? (
          <div className="text-center py-12 px-4 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
            <div className="w-16 h-16 rounded-3xl bg-[var(--bg-alt)] flex items-center justify-center mb-3 shadow-xs">
              <ShoppingCart size={26} className="opacity-40" />
            </div>
            <p className="text-sm font-bold text-[var(--text)]">Carrito de venta vacío</p>
            <p className="text-xs mt-1 text-slate-500 max-w-[220px]">
              Toca los productos del catálogo o escanea un código para añadirlos
            </p>
          </div>
        ) : (
          carrito.map((it) => (
            <div
              key={it.producto.id}
              className="group p-3 sm:p-3.5 rounded-2xl bg-[var(--bg-alt)]/60 border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[var(--text)] truncate">
                  {it.producto.nombre}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[var(--text-muted)] font-mono">
                    C$ {it.precioUnitario.toFixed(2)} c/u
                  </span>
                  <span className="text-xs font-bold text-primary font-mono">
                    = C$ {it.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Quantity Controls (Modern Pill Group) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => modificarCantidad(it.producto.id, -1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] border border-slate-200/70 dark:border-slate-700/70 text-[var(--text)] flex items-center justify-center hover:border-primary active:scale-95 transition-all shadow-xs"
                  aria-label={`Disminuir ${it.producto.nombre}`}
                >
                  <Minus size={14} />
                </button>

                <span className="w-7 text-center font-bold text-sm text-[var(--text)] font-mono">
                  {it.cantidad}
                </span>

                <button
                  onClick={() => modificarCantidad(it.producto.id, 1)}
                  className="w-9 h-9 rounded-full bg-[var(--surface)] border border-slate-200/70 dark:border-slate-700/70 text-[var(--text)] flex items-center justify-center hover:border-primary active:scale-95 transition-all shadow-xs"
                  aria-label={`Aumentar ${it.producto.nombre}`}
                >
                  <Plus size={14} />
                </button>

                <button
                  onClick={() => eliminarDelCarrito(it.producto.id)}
                  className="w-9 h-9 ml-1 rounded-full text-red-500 hover:bg-red-500/10 flex items-center justify-center active:scale-95 transition-all"
                  aria-label={`Eliminar ${it.producto.nombre}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Checkout Form & Controls */}
      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3 shrink-0">
        {/* Customer info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
              Cliente
            </label>
            <Input
              type="text"
              placeholder="Nombre del Cliente"
              value={clienteNombre}
              onChange={(e) => setClienteNombre(e.target.value)}
              className="h-10 text-xs rounded-xl bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 text-[var(--text)]"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
              RUC / Cédula (opcional)
            </label>
            <Input
              type="text"
              placeholder="RUC / Cédula"
              value={clienteRuc}
              onChange={(e) => setClienteRuc(e.target.value)}
              className="h-10 text-xs rounded-xl bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 text-[var(--text)]"
            />
          </div>
        </div>

        {/* Payment Method & Received Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
              Método de Pago
            </label>
            <select
              value={metodoPago}
              onChange={(e) => setMetodoPago(e.target.value as any)}
              className="w-full h-10 px-3 rounded-xl text-xs bg-[var(--bg-alt)] border border-slate-200/70 dark:border-slate-800/70 text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer font-medium"
            >
              <option value="efectivo" className="bg-[var(--surface)] text-[var(--text)]">Efectivo (Córdobas / Dólares)</option>
              <option value="tarjeta" className="bg-[var(--surface)] text-[var(--text)]">Tarjeta Débito / Crédito</option>
              <option value="transferencia" className="bg-[var(--surface)] text-[var(--text)]">Transferencia Bancaria</option>
              <option value="fiado" className="bg-[var(--surface)] text-[var(--text)]">Crédito / Cuenta por Cobrar</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-[var(--text-muted)] block mb-1">
              Efectivo Recibido (C$)
            </label>
            <Input
              type="number"
              placeholder="C$ 0.00"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              className="h-10 text-xs rounded-xl bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 text-[var(--text)] font-mono"
            />
          </div>
        </div>

        {/* Quick Cash Buttons (Only for Efectivo) */}
        {metodoPago === 'efectivo' && totalSum > 0 && (
          <div>
            <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">
              Atajos de Cobro
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setCashAmount(totalSum)}
                className="h-8 px-3 rounded-full text-xs font-bold text-[var(--text)] shadow-xs"
              >
                Exacto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCashAmount(50)}
                className="h-8 px-3 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shadow-xs"
              >
                +C$50
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCashAmount(100)}
                className="h-8 px-3 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shadow-xs"
              >
                +C$100
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addCashAmount(500)}
                className="h-8 px-3 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 shadow-xs"
              >
                +C$500
              </Button>
            </div>
          </div>
        )}

        {/* Totals Breakdown */}
        <div className="p-3.5 rounded-2xl bg-[var(--bg-alt)]/60 border border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
          <div className="flex justify-between items-center text-xs text-[var(--text-muted)] font-medium">
            <span>Subtotal</span>
            <span className="font-mono">C$ {subtotalSum.toFixed(2)}</span>
          </div>

          {descNum > 0 && (
            <div className="flex justify-between items-center text-xs text-amber-600 dark:text-amber-400 font-semibold">
              <span>Descuento aplicado</span>
              <span className="font-mono">- C$ {descNum.toFixed(2)}</span>
            </div>
          )}

          {metodoPago === 'efectivo' && (
            <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-bold pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
              <span>Cambio a devolver</span>
              <span className="font-mono text-sm">C$ {cambio.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-base font-black text-primary pt-1.5 border-t border-slate-200/60 dark:border-slate-800/60">
            <span className="font-syne">TOTAL COBRAR</span>
            <span className="font-mono text-lg tracking-tight">C$ {totalSum.toFixed(2)}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={procesarVenta}
          disabled={procesando || carrito.length === 0}
          className="w-full h-12 rounded-full text-sm font-bold shadow-md shadow-primary/20 transition-transform active:scale-[0.99]"
        >
          {procesando ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              <span>Procesando Venta...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={18} className="mr-2" />
              <span>Cobrar & Generar Factura</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_440px] gap-5 items-start">
      {/* ─── Columna Izquierda: Catálogo Visual POS ─── */}
      <div className="flex flex-col gap-4 min-w-0">
        
        {/* Barra Superior: Buscador + Escáner + Devolución */}
        <Card className="rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Input Buscador en Cápsula */}
            <div className="relative flex-1 flex items-center">
              <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar producto o escanea SKU con lector..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-11 pr-10 h-11 sm:h-12 rounded-full text-xs sm:text-sm bg-[var(--bg-alt)] border-slate-200/70 dark:border-slate-800/70 text-[var(--text)] focus:ring-2 focus:ring-primary/20 shadow-xs"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-3.5 w-6 h-6 rounded-full hover:bg-[var(--surface)] text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Botones de acción rápida en cápsulas responsive */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant={lectorConectado ? 'default' : 'secondary'}
                onClick={abrirEscaner}
                title="Emparejar un celular como lector de códigos de barras"
                className={`flex-1 sm:flex-initial h-11 rounded-full px-4 text-xs font-bold shadow-xs ${
                  lectorConectado
                    ? '!bg-emerald-600 hover:!bg-emerald-700 text-white'
                    : ''
                }`}
              >
                <Camera size={15} className="mr-1.5" />
                <span>{lectorConectado ? 'Lector Activo' : 'Escáner Celular'}</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => setDevolucionAbierta(true)}
                title="Devolver mercadería al inventario"
                className="flex-1 sm:flex-initial h-11 rounded-full px-4 text-xs font-bold shadow-xs"
              >
                <RotateCcw size={14} className="mr-1.5" />
                <span>Devolución</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Category Pills Slider */}
        {categorias.length > 2 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categorias.map((cat) => {
              const active = categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
              return (
                <Button
                  key={cat}
                  variant={active ? 'default' : 'secondary'}
                  size="sm"
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`h-9 rounded-full text-xs font-bold px-4 shrink-0 transition-all ${
                    active ? 'shadow-sm shadow-primary/25' : 'bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {cat === 'todos' ? 'Todos los Productos' : cat}
                </Button>
              );
            })}
          </div>
        )}

        {/* Product Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-[240px] rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 animate-pulse"
              />
            ))}
          </div>
        ) : filtrados.length === 0 ? (
          <div className="py-16 px-6 text-center bg-[var(--surface)] border border-dashed border-slate-200/70 dark:border-slate-800/70 rounded-3xl">
            <Package size={42} className="mx-auto mb-3 opacity-30 text-slate-500" />
            <p className="text-base font-bold text-[var(--text)]">
              No se encontraron productos
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Prueba buscando con otro término o revisa la categoría seleccionada
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4 gap-3.5 max-h-[calc(100vh-230px)] overflow-y-auto pr-1">
            {filtrados.map((p) => {
              const itemEnCarrito = carrito.find((it) => it.producto.id === p.id);
              const enCarritoCant = itemEnCarrito?.cantidad || 0;
              const sinStock = p.stock !== null && p.stock !== undefined && p.stock <= 0;
              const bajoStock = p.stock !== null && p.stock !== undefined && p.stock > 0 && p.stock <= (p.stockMinimo ?? 5);

              return (
                <div
                  key={p.id}
                  onClick={() => !sinStock && agregarAlCarrito(p)}
                  className={`group relative flex flex-col transition-all duration-200 overflow-hidden cursor-pointer active:scale-[0.98] rounded-3xl bg-[var(--surface)] ${
                    enCarritoCant > 0
                      ? 'border-2 border-primary shadow-md shadow-primary/15'
                      : 'border border-slate-200/70 dark:border-slate-800/70 shadow-xs hover:shadow-md'
                  } ${sinStock ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                >
                  {/* Image container */}
                  <div className="relative h-36 w-full bg-[var(--bg-alt)] overflow-hidden">
                    {p.imagenUrl || p.portadaUrl ? (
                      <img
                        src={p.imagenUrl || p.portadaUrl || ''}
                        alt={p.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-slate-400 dark:text-slate-600 text-xl font-syne">
                        {p.nombre.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    {/* Stock Pill Badge */}
                    <div className="absolute bottom-2.5 right-2.5">
                      {p.stock !== null && p.stock !== undefined ? (
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full font-mono ${
                            sinStock
                              ? 'bg-red-500 text-white'
                              : bajoStock
                              ? 'bg-amber-500 text-white'
                              : 'bg-black/60 text-white backdrop-blur-md'
                          }`}
                        >
                          Stock: {p.stock}
                        </span>
                      ) : null}
                    </div>

                    {/* Quantity in Cart Indicator */}
                    {enCarritoCant > 0 && (
                      <div className="absolute top-2.5 left-2.5 text-white text-xs font-bold px-2.5 py-0.5 rounded-full animate-scale-up font-mono bg-primary shadow-md shadow-primary/30">
                        {enCarritoCant} en caja
                      </div>
                    )}
                  </div>

                  {/* Body Info */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-2.5">
                    <div>
                      {p.categoriaNombre && (
                        <p className="text-primary text-[10px] font-extrabold uppercase tracking-wider mb-1 truncate">
                          {p.categoriaNombre}
                        </p>
                      )}
                      <h4 className="text-xs sm:text-sm font-bold text-[var(--text)] leading-snug line-clamp-2">
                        {p.nombre}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                      <span className="text-primary text-sm sm:text-base font-black font-mono">
                        C$ {p.precio.toFixed(2)}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-110 transition-transform">
                        <Plus size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Columna Derecha Desktop: Carrito & Cobro POS ─── */}
      <Card className="hidden lg:block sticky top-4 h-[calc(100vh-32px)] overflow-hidden rounded-3xl bg-[var(--surface)] border border-slate-200/70 dark:border-slate-800/70 shadow-xs">
        <CardContent className="p-5 h-full flex flex-col overflow-hidden">
          {renderCartContent(false)}
        </CardContent>
      </Card>

      {/* ─── Mobile Floating Bar & Bottom Sheet Drawer ─── */}
      {/* 1. Floating bottom pill for mobile screen */}
      <div className="lg:hidden fixed bottom-[74px] left-3 right-3 z-30">
        <button
          onClick={() => setMobileCartOpen(true)}
          className="w-full h-14 rounded-full bg-primary text-primary-foreground shadow-xl shadow-primary/30 flex justify-between items-center px-4 active:scale-[0.98] transition-all font-semibold"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shadow-xs">
              <ShoppingCart size={18} />
              {totalItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold flex items-center justify-center font-mono ring-2 ring-blue-600">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <div className="text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-white/80">
                {carrito.length === 0 ? 'Caja Registradora' : `${totalItemsCount} ítems listos`}
              </div>
              <div className="text-base font-extrabold font-mono text-white">
                C$ {totalSum.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-bold bg-white/20 px-3.5 py-1.5 rounded-full shadow-xs">
            <span>{carrito.length === 0 ? 'Ver Caja' : 'Cobrar'}</span>
            <ChevronUp size={16} />
          </div>
        </button>
      </div>

      {/* 2. Bottom Sheet Drawer on Mobile */}
      {mobileCartOpen && (
        <div
          onClick={() => setMobileCartOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-h-[85vh] bg-[var(--surface)] rounded-t-[32px] p-4 sm:p-5 flex flex-col border-t border-slate-200/70 dark:border-slate-800/70 shadow-2xl animate-slide-up"
          >
            {/* Grab handle indicator */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 mx-auto mb-3" />
            {renderCartContent(true)}
          </div>
        </div>
      )}

      {/* ─── Modal Devolución de Mercadería ─── */}
      <TiendaDevolucion
        abierto={devolucionAbierta}
        onCerrar={() => setDevolucionAbierta(false)}
        productos={productos}
        onDevuelto={cargarProductos}
      />

      {/* ─── Modal Escáner Inalámbrico (PIN Celular) ─── */}
      {escanerAbierto && (
        <div
          onClick={cerrarEscaner}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-[var(--surface)] rounded-3xl border border-slate-200/70 dark:border-slate-800/70 p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
                  <Camera size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--text)] font-syne">
                    Escáner Inalámbrico
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Usa tu celular como lector de barras</p>
                </div>
              </div>

              <Badge
                variant={lectorConectado ? 'default' : 'secondary'}
                className={`text-[11px] font-extrabold px-3 py-1 rounded-full ${
                  lectorConectado
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                    : 'text-slate-500'
                }`}
              >
                {lectorConectado ? 'CONECTADO' : 'ESPERANDO...'}
              </Badge>
            </div>

            <p className="text-xs text-[var(--text-muted)] mt-4 leading-relaxed">
              En tu celular abre la URL <b>{origenWeb}/escaner</b> e ingresa el siguiente PIN de sesión:
            </p>

            {/* PIN Display */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 text-center text-4xl sm:text-5xl font-extrabold tracking-widest font-mono py-3.5 rounded-2xl bg-[var(--bg-alt)] border border-slate-200/60 dark:border-slate-800/60 text-[var(--text)] shadow-xs">
                {escanerPin}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[var(--bg-alt)] border border-slate-200/60 dark:border-slate-800/60 flex items-center justify-center text-slate-400 shadow-xs">
                <Wifi size={24} className={lectorConectado ? 'text-emerald-500 animate-pulse' : ''} />
              </div>
            </div>

            {origenWeb.includes('localhost') || origenWeb.includes('127.0.0.1') ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <p className="leading-snug font-medium">
                  El celular no puede abrir <b>localhost</b>. Accede usando la IP de tu PC en la red WiFi local (ej. http://192.168.1.10:3000/escaner).
                </p>
              </div>
            ) : null}

            {/* Últimos Escaneos */}
            <div className="mt-5">
              <div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                Últimas Lecturas
              </div>
              {ultimosEscaneos.length === 0 ? (
                <div className="text-xs text-slate-400 italic py-2">
                  No hay lecturas registradas en esta sesión.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {ultimosEscaneos.map((e, i) => (
                    <div
                      key={`${e.codigo}-${i}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-2xl bg-[var(--bg-alt)] border border-slate-200/60 dark:border-slate-800/60 text-xs"
                    >
                      <span className="font-mono font-bold text-[var(--text)]">
                        {e.codigo}
                      </span>
                      <span
                        className={`flex-1 truncate font-medium ${
                          e.estado === 'ok'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : e.estado === 'ambiguo'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-red-500'
                        }`}
                      >
                        {e.detalle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{e.hora}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              variant="outline"
              onClick={cerrarEscaner}
              className="w-full mt-5 h-11 rounded-full text-xs font-bold shadow-xs"
            >
              Cerrar Sesión de Escaneo
            </Button>
          </div>
        </div>
      )}

      {/* ─── Modal Factura / Comprobante Térmico POS ─── */}
      {facturaEmitida && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white text-black rounded-3xl p-6 shadow-2xl border border-slate-200 font-mono text-xs printable-ticket animate-scale-up">
            <div className="text-center pb-3 border-b border-dashed border-black/40 space-y-0.5">
              <div className="text-base font-black tracking-tight">{facturaEmitida.tiendaNombre}</div>
              <div className="text-[11px] text-slate-600">{facturaEmitida.razonSocial}</div>
              <div className="text-[11px] text-slate-600">RUC: {facturaEmitida.tiendaRuc}</div>
              <div className="text-[11px] text-slate-600">DGI: {facturaEmitida.regimenDgi}</div>
              <div className="text-[11px] text-slate-600">{facturaEmitida.direccion}</div>
              {facturaEmitida.telefono && (
                <div className="text-[11px] text-slate-600">Tel: {facturaEmitida.telefono}</div>
              )}
              <div className="pt-2 text-[11px] font-bold">
                COMPROBANTE #{facturaEmitida.numeroComprobante}
              </div>
              <div className="text-[10px] text-slate-500">
                {facturaEmitida.fecha} · {facturaEmitida.hora}
              </div>
              <div className="text-[11px] font-medium pt-1">
                Cliente: {facturaEmitida.clienteNombre}
              </div>
            </div>

            {/* Items table */}
            <div className="py-3 border-b border-dashed border-black/40 space-y-1.5">
              {facturaEmitida.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="truncate pr-2">
                    {it.cantidad}x {it.nombreProducto}
                  </span>
                  <span className="font-bold shrink-0">C${it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Financial summary */}
            <div className="py-3 border-b border-dashed border-black/40 space-y-1 text-xs">
              <div className="flex justify-between font-black text-sm">
                <span>TOTAL:</span>
                <span>C$ {facturaEmitida.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Pago ({facturaEmitida.metodoPago}):</span>
                <span>C$ {facturaEmitida.montoRecibido.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Cambio:</span>
                <span>C$ {facturaEmitida.cambioDado.toFixed(2)}</span>
              </div>
            </div>

            {/* Footer message */}
            <div className="text-center pt-3 space-y-1 text-[10px] text-slate-600">
              <div>{facturaEmitida.saludoFactura}</div>
              <div>{facturaEmitida.piePaginaFactura}</div>
              <div className="font-bold text-black pt-1">
                *** {facturaEmitida.pieMarcaLogifast} ***
              </div>
            </div>

            {/* Action Buttons (Excluded from print) */}
            <div className="flex gap-2 mt-5 no-print">
              <button
                onClick={imprimirFactura}
                className="flex-1 h-11 rounded-full bg-black hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-2 active:scale-95 transition-all text-xs shadow-md"
              >
                <Printer size={15} />
                <span>Imprimir Ticket</span>
              </button>

              <button
                onClick={() => setFacturaEmitida(null)}
                className="h-11 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-black font-bold active:scale-95 transition-all text-xs shadow-xs"
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
