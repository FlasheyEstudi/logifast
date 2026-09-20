'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  CreditCard,
  DollarSign,
  Check,
  Store,
  ChevronDown,
  MapPin,
  Locate,
} from '@/components/icons';
import { useMarketplaceStore } from '@/lib/marketplace-store';
import { useStore } from '@/lib/store';
import { notify } from '@/lib/notify';
import { sileo } from 'sileo';
import { LogoSpinner } from '@/components/ui/loaders';

import { reverseGeocode } from '@/lib/osrm';
import { obtenerUbicacionActual } from '@/lib/native-geolocation';
import PagoExitoso, { type CompletedOrderData } from './PagoExitoso';
import { dispararNotificacionNativa } from '@/services/native-notifications';

interface ClientCarritoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessCheckout?: () => void;
}

export default function ClientCarrito({ isOpen = true, onClose, onSuccessCheckout }: ClientCarritoProps) {
  const [completedOrder, setCompletedOrder] = useState<CompletedOrderData | null>(null);
  const {
    cartItems,
    cartCodigoPromo,
    cartDescuento,
    cartInstrucciones,
    cartMetodoPago,
    updateCartItemQty,
    clearCart,
    setCartCodigoPromo,
    setCartInstrucciones,
    setCartMetodoPago,
    getCartSubtotal,
    getCartTotal,
  } = useMarketplaceStore();

  const { setCartDescuento } = useMarketplaceStore();
  const {
    addOrder,
    cuponesBilletera = [],
    marcarCuponUsado,
    cuponAplicado,
  } = useStore();

  const cuponesDisponibles = useMemo(() => {
    return cuponesBilletera.filter((c) => c.estado === 'disponible');
  }, [cuponesBilletera]);

  // Si hay un cupón preaplicado desde el inicio o feed, solo fijamos el CÓDIGO:
  // el monto del descuento lo confirma el servidor (POST /api/codigos/validar).
  useEffect(() => {
    if (cuponAplicado && cuponAplicado.estado === 'disponible' && !cartCodigoPromo) {
      setCartCodigoPromo(cuponAplicado.codigoPromo);
      setCartDescuento(0);
    }
  }, [cuponAplicado, cartCodigoPromo, setCartCodigoPromo, setCartDescuento]);

  const [codigoPromoInput, setCodigoPromoInput] = useState('');
  const [mostrarCodigo, setMostrarCodigo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isValidandoCodigo, setIsValidandoCodigo] = useState(false);

  // Address validation & GPS states
  const [direccionEntregaInput, setDireccionEntregaInput] = useState('');
  // #2 Retiro en punto: sin envío ni repartidor; el pedido se recoge con el PIN.
  const [modoEntrega, setModoEntrega] = useState<'reparto' | 'retiro'>('reparto');
  const [deliveryLat, setDeliveryLat] = useState(0);
  const [deliveryLng, setDeliveryLng] = useState(0);
  const [addressError, setAddressError] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasCartGps, setHasCartGps] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<Array<{ id: string; etiqueta: string; direccion: string; lat?: number; lng?: number }>>([]);

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/cliente/direcciones')
        .then((r) => r.json())
        .then((d) => {
          if (d?.direcciones && Array.isArray(d.direcciones)) {
            setSavedAddresses(d.direcciones);
            if (d.direcciones.length > 0 && !direccionEntregaInput) {
              const defaultAddr = d.direcciones.find((a: any) => a.predeterminada) || d.direcciones[0];
              setDireccionEntregaInput(defaultAddr.direccion);
              setDeliveryLat(defaultAddr.lat || 0);
              setDeliveryLng(defaultAddr.lng || 0);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Auto-switch a efectivo si el método de pago es inválido o no soportado.
  // NOTA: este efecto debe vivir ANTES del early return de abajo: un hook no puede
  // ejecutarse condicionalmente (React rompe el orden de hooks al abrir/cerrar el carrito).
  React.useEffect(() => {
    if (cartMetodoPago !== 'efectivo') {
      setCartMetodoPago('efectivo');
    }
  }, [cartMetodoPago, setCartMetodoPago]);

  /* ─── Cupones: el descuento lo decide SIEMPRE el servidor ─── */
  // Firma de la última validación (código + subtotal) para no repetir llamadas ni avisos.
  const ultimaValidacionPromo = React.useRef('');

  // Subtotal del carrito calculado antes del early return: lo necesita el efecto de
  // revalidación (un hook no puede vivir después de un `return` condicional).
  const subtotalCarrito = Number(getCartSubtotal()) || 0;

  /**
   * Aplica/valida un código contra POST /api/codigos/validar y usa el
   * `descuentoCalculado` que devuelve el servidor. Si el servidor rechaza, se
   * devuelve SU mensaje y no se aplica descuento alguno.
   */
  const aplicarCodigoServidor = async (
    codigo: string
  ): Promise<{ ok: boolean; descuento: number; mensaje: string }> => {
    const code = String(codigo || '').trim().toUpperCase();
    if (!code) return { ok: false, descuento: 0, mensaje: 'Código promocional requerido' };

    const subtotalActual = Number(getCartSubtotal()) || 0;

    try {
      const res = await fetch('/api/codigos/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: code,
          montoSubtotal: subtotalActual,
          tipoOrden: 'marketplace',
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data?.ok) {
        const descuento = Number(data.descuentoCalculado) || 0;
        setCartCodigoPromo(String(data.codigo || code));
        setCartDescuento(descuento);
        ultimaValidacionPromo.current = `${code}:${subtotalActual}`;
        return { ok: true, descuento, mensaje: data.mensaje || `¡Cupón ${code} aplicado!` };
      }

      // El servidor rechazó el cupón: se muestra SU mensaje tal cual y no hay descuento.
      setCartCodigoPromo('');
      setCartDescuento(0);
      return { ok: false, descuento: 0, mensaje: data?.error || 'Código no válido o expirado' };
    } catch {
      // Error de red: nunca inventamos un descuento local.
      setCartCodigoPromo('');
      setCartDescuento(0);
      return { ok: false, descuento: 0, mensaje: 'No se pudo validar el código promocional. Revisa tu conexión.' };
    }
  };

  // Si el subtotal cambia con un cupón ya aplicado, se revalida contra el servidor
  // (y se corrige el descuento mostrado) antes de pagar.
  React.useEffect(() => {
    if (!isOpen || !cartCodigoPromo || cartItems.length === 0) return;
    const firma = `${cartCodigoPromo.toUpperCase()}:${subtotalCarrito}`;
    if (ultimaValidacionPromo.current === firma) return;
    ultimaValidacionPromo.current = firma;
    void aplicarCodigoServidor(cartCodigoPromo).then((r) => {
      if (!r.ok) notify.error(r.mensaje);
    });
  }, [isOpen, cartCodigoPromo, subtotalCarrito, cartItems.length]);

  /* ─── Envío real y pedido mínimo de la tienda (fuente única: GET /api/tiendas/[id]) ─── */
  const [envioTienda, setEnvioTienda] = useState<{ nombre: string; costoEnvio: number; pedidoMinimo: number } | null>(null);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  // Apertura de la tienda del carrito, tal como la reporta el servidor. `null` = aún
  // no se sabe (no se bloquea nada por duda).
  const [tiendaAbierta, setTiendaAbierta] = useState<boolean | null>(null);
  const [aperturaTexto, setAperturaTexto] = useState('');

  const tiendasEnCarrito = useMemo(
    () => Array.from(new Set(cartItems.map((i) => i.tiendaId).filter(Boolean))),
    [cartItems]
  );
  const multiTienda = tiendasEnCarrito.length > 1;
  const tiendaPrincipalId = tiendasEnCarrito[0] ?? null;

  React.useEffect(() => {
    if (!isOpen || !tiendaPrincipalId || multiTienda) {
      setEnvioTienda(null);
      setCargandoEnvio(false);
      return;
    }
    let cancelado = false;
    setCargandoEnvio(true);
    fetch(`/api/tiendas/${tiendaPrincipalId}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Tienda no disponible'))))
      .then((t) => {
        if (cancelado) return;
        // Apertura reportada por el servidor: si viene, manda; si no, no se bloquea.
        if (typeof t?.abierta === 'boolean') {
          setTiendaAbierta(t.abierta);
          setAperturaTexto(String(t?.aperturaTexto ?? ''));
        }
        // Solo se confía en un costoEnvio numérico real: si el payload no lo trae,
        // el envío queda "por confirmar" en lugar de asumir envío gratis.
        if (typeof t?.costoEnvio !== 'number' || !Number.isFinite(t.costoEnvio)) {
          setEnvioTienda(null);
          setCargandoEnvio(false);
          return;
        }
        setEnvioTienda({
          nombre: String(t?.nombre ?? ''),
          costoEnvio: t.costoEnvio,
          pedidoMinimo: Number.isFinite(Number(t?.pedidoMinimo)) ? Number(t.pedidoMinimo) : 0,
        });
        setCargandoEnvio(false);
      })
      .catch(() => {
        if (cancelado) return;
        // Si la consulta falla no se bloquea la compra ni se inventa un monto:
        // se marca el envío como "por confirmar" y el servidor cobra el real.
        setEnvioTienda(null);
        setCargandoEnvio(false);
      });
    return () => {
      cancelado = true;
    };
  }, [isOpen, tiendaPrincipalId, multiTienda]);

  if (!isOpen) return null;

  const subtotal = subtotalCarrito;
  const descuento = Number(cartDescuento) || 0;

  // Envío real: solo el que devuelve la tienda. Nunca un monto fijo inventado.
  const envioEstado: 'ok' | 'cargando' | 'multi' | 'desconocido' = multiTienda
    ? 'multi'
    : cargandoEnvio
    ? 'cargando'
    : envioTienda
    ? 'ok'
    : 'desconocido';
  const delivery = envioEstado === 'ok' ? Number(envioTienda?.costoEnvio) || 0 : 0;
  const total = Math.max(0, subtotal + delivery - descuento);

  // El pedido mínimo también lo manda la tienda (mismo fetch, sin reglas locales).
  const pedidoMinimo = envioEstado === 'ok' ? Number(envioTienda?.pedidoMinimo) || 0 : 0;
  const faltaParaMinimo = pedidoMinimo > subtotal ? pedidoMinimo - subtotal : 0;
  const motivoBloqueo = multiTienda
    ? 'Tu carrito tiene productos de más de una tienda'
    : faltaParaMinimo > 0
    ? `Mínimo C$ ${pedidoMinimo.toFixed(2)} — te faltan C$ ${faltaParaMinimo.toFixed(2)}`
    : null;

  // Group items by store
  const grupos = cartItems.reduce((acc, item) => {
    const tiendaNom = (item as any).tiendaNombre || 'Tienda LogiFast';
    const existing = acc.find((g) => g.tiendaId === item.tiendaId);
    if (existing) {
      existing.items.push(item);
    } else {
      acc.push({
        tiendaId: item.tiendaId || 'default',
        tiendaNombre: tiendaNom,
        tiendaLogoIniciales: tiendaNom.substring(0, 2).toUpperCase(),
        items: [item],
      });
    }
    return acc;
  }, [] as Array<{ tiendaId: string; tiendaNombre: string; tiendaLogoIniciales: string; items: typeof cartItems }>);

  const handleUseCartLocation = async () => {
    setIsGettingLocation(true);
    notify.info('Buscando satélites y señal GPS...');

    try {
      const res = await obtenerUbicacionActual();
      if (!res.ok || typeof res.lat !== 'number' || typeof res.lng !== 'number') {
        notify.error(res.error || 'No se pudo obtener la ubicación GPS.');
        setIsGettingLocation(false);
        return;
      }

      const lat = res.lat;
      const lng = res.lng;
      setDeliveryLat(lat);
      setDeliveryLng(lng);
      setHasCartGps(true);
      const tempLabel = `Ubicación GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
      setDireccionEntregaInput(tempLabel);
      setAddressError(false);

      notify.success('¡Ubicación GPS capturada con precisión!');

      const realAddr = await reverseGeocode(lat, lng);
      setDireccionEntregaInput(realAddr);
    } catch (err: any) {
      notify.error(err?.message || 'Error obteniendo posición GPS');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleAplicarCodigo = async () => {
    const code = codigoPromoInput.trim().toUpperCase();
    if (!code || isValidandoCodigo) return;

    // Sin códigos locales ni listas maestras: el descuento lo decide el servidor.
    setIsValidandoCodigo(true);
    const resultado = await aplicarCodigoServidor(code);
    setIsValidandoCodigo(false);

    if (resultado.ok) {
      notify.success(resultado.mensaje);
      setCodigoPromoInput('');
    } else {
      // Mensaje del servidor tal cual.
      notify.error(resultado.mensaje);
    }
  };

  const handlePagar = async () => {
    if (cartItems.length === 0) return;

    // El carrito no puede llevar productos de varias tiendas: el envío se cotiza por tienda.
    if (grupos.length > 1) {
      notify.error('Tu carrito tiene productos de más de una tienda. Realiza un pedido por tienda.');
      return;
    }

    // Pedido mínimo de la tienda (mismo dato que se muestra en el resumen).
    const minimoTienda = Number(envioTienda?.pedidoMinimo) || 0;
    if (minimoTienda > 0 && subtotal < minimoTienda) {
      notify.error(
        `El pedido mínimo de ${envioTienda?.nombre || 'esta tienda'} es C$ ${minimoTienda.toFixed(2)}. Te faltan C$ ${(minimoTienda - subtotal).toFixed(2)}.`
      );
      return;
    }

    if (modoEntrega === 'reparto' && (!direccionEntregaInput || direccionEntregaInput.trim().length < 3)) {
      setAddressError(true);
      notify.error('Debes ingresar o confirmar una dirección de entrega válida.');
      return;
    }

    // Tienda cerrada: se conserva el carrito y se avisa. El backend vuelve a
    // comprobarlo de todos modos; esto solo evita el viaje en balde.
    if (modoEntrega === 'reparto' && tiendaAbierta === false) {
      notify.error(
        `${envioTienda?.nombre || 'La tienda'} está cerrada. ${aperturaTexto ? aperturaTexto + '.' : ''} Tu carrito se conserva; puedes programar la compra para cuando abra.`
      );
      return;
    }

    // Revalidar el cupón con el subtotal actual antes de cobrar: el importe final
    // siempre lo decide el servidor.
    if (cartCodigoPromo) {
      const revalidado = await aplicarCodigoServidor(cartCodigoPromo);
      if (!revalidado.ok) {
        notify.error(revalidado.mensaje);
        return;
      }
    }

    // Anti-doble-clic: `isProcessing` pinta el botón, pero el guard real es este.
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const tiendaId = cartItems[0]?.tiendaId;
      const tiendaNombre = grupos[0]?.tiendaNombre || 'Tienda LogiFast';

      const res = await fetch('/api/ordenes-compra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tiendaId,
          items: cartItems.map((i) => ({
            productoId: i.productoId,
            cantidad: i.cantidad,
            notas: i.notas,
          })),
          direccionEntrega: modoEntrega === 'retiro' ? 'Retiro en tienda' : direccionEntregaInput.trim(),
          modoEntrega,
          lat: deliveryLat,
          lng: deliveryLng,
          metodoPago: cartMetodoPago,
          codigoPromo: cartCodigoPromo || undefined,
          descuento: cartDescuento ?? 0,
          instrucciones: cartInstrucciones || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // 409 con código TIENDA_CERRADA: el servidor rechazó por horario.
        if (data?.codigo === 'TIENDA_CERRADA') {
          setTiendaAbierta(false);
          if (data?.aperturaTexto || data?.error) setAperturaTexto(String(data.error));
          throw new Error(data.error || 'La tienda está cerrada.');
        }
        // 200 con `duplicado`: el pedido ya se había registrado (doble toque/reintento).
        if (data?.duplicado) {
          notify.warning('Ese pedido ya estaba registrado. Te llevamos a tus pedidos.');
          setIsProcessing(false);
          clearCart();
          if (onSuccessCheckout) onSuccessCheckout();
          return;
        }
        throw new Error(data?.error || 'No se pudo procesar la compra.');
      }

      const ordenCreada = data.orden;

      // Si usó un cupón, marcarlo como usado en la billetera
      if (cartCodigoPromo) {
        marcarCuponUsado(cartCodigoPromo, ordenCreada?.id);
      }

      // Recargar órdenes de compra en store de Marketplace
      useMarketplaceStore.getState().fetchOrdenesCompra();

      const safeSubtotal = Number(ordenCreada?.subtotal ?? subtotal) || 0;
      const safeDelivery = Number(ordenCreada?.costoEnvio ?? delivery) || 0;
      const safeDescuento = Number(ordenCreada?.descuento ?? cartDescuento ?? 0) || 0;
      const safeTotal = Number(ordenCreada?.total ?? total) || Math.max(0, safeSubtotal + safeDelivery - safeDescuento);

      // Agregar a useStore para tracking y rastreo sin recargar la página
      if (ordenCreada) {
          addOrder({
            id: ordenCreada.id,
            codigoPin: ordenCreada.codigoPin || String(Math.floor(1000 + Math.random() * 9000)),
            cliente: ordenCreada.clienteNombre || ordenCreada.cliente?.name || 'Cliente',
            clienteTelefono: ordenCreada.clienteTelefono || ordenCreada.cliente?.telefono || '',
            origen: tiendaNombre,
            destino: direccionEntregaInput.trim(),
            origenLat: ordenCreada.origenLat || 0,
            origenLng: ordenCreada.origenLng || 0,
            destinoLat: ordenCreada.destinoLat || deliveryLat || 0,
            destinoLng: ordenCreada.destinoLng || deliveryLng || 0,
            repartidor: null,
            repartidorInitials: 'RP',
            descripcion: cartInstrucciones || `Pedido de compra: ${tiendaNombre}`,
            monto: safeTotal,
            subtotal: safeSubtotal,
            costoEnvio: safeDelivery,
            descuento: safeDescuento,
            codigoPromo: cartCodigoPromo || '',
            estado: 'pendiente',
            metodoPago: cartMetodoPago as any,
            estadoPago: 'pendiente',
            fecha: 'Hoy',
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timeline: [],
          } as any);

          setCompletedOrder({
            id: ordenCreada.id,
            codigoPin: ordenCreada.codigoPin,
            tiendaNombre,
            direccionEntrega: direccionEntregaInput.trim(),
            subtotal: safeSubtotal,
            costoEnvio: safeDelivery,
            descuento: safeDescuento,
            total: safeTotal,
            metodoPago: cartMetodoPago,
            kmEstimados: ordenCreada.kmEstimados,
            tiempoEstimado: ordenCreada.tiempoEstimado,
            items: cartItems.map((it) => ({
              nombreProducto: it.nombreProducto || (it as any).nombre || 'Producto',
              cantidad: Number(it.cantidad) || 1,
              precioUnitario: Number(it.precioUnitario ?? (it as any).precio ?? 0) || 0,
            })),
          });
      }

      clearCart();
      setIsProcessing(false);
      notify.success('¡Pedido de compra realizado con éxito!');

      dispararNotificacionNativa({
        titulo: '¡Pedido de compra realizado con éxito!',
        cuerpo: `Tu compra en ${tiendaNombre} por C$ ${safeTotal.toFixed(2)} está confirmada y en preparación.`,
        subtexto: 'LOGIFAST Marketplace • Compra Confirmada',
        detalleLargo: `Comercio: ${tiendaNombre}\nEntrega: ${direccionEntregaInput.trim()}\nTotal: C$ ${safeTotal.toFixed(2)}\nPago: ${cartMetodoPago.toUpperCase()}`,
        canalId: 'logifast_urgente',
        colorIcono: '#007AFF',
        iconoPequeno: 'ic_stat_logifast',
        categoriaAcciones: 'ORDEN_ESTADO',
        tipoAlerta: 'exito',
        extra: { ordenId: ordenCreada?.id },
      }).catch(() => null);

      if (onSuccessCheckout) onSuccessCheckout();
    } catch (err: any) {
      console.error('[handlePagar error]', err);
      setIsProcessing(false);
      const errMsg = err?.message || 'Ocurrió un error al procesar tu pedido de compra';
      if (errMsg.toLowerCase().includes('stock') || errMsg.toLowerCase().includes('disponib')) {
        sileo.warning({
          title: 'Stock insuficiente',
          description: errMsg,
        });
      } else {
        notify.error(errMsg);
      }
    }
  };

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
        }}
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(12px)',
          }}
        />

        {/* Bottom Sheet Modal Container */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 480,
            maxHeight: '90vh',
            background: 'rgba(19, 24, 34, 0.96)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 -16px 50px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            color: '#F8FAFC',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Sheet Handle */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <div
              style={{
                width: 42,
                height: 5,
                borderRadius: 3,
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            />
          </div>

          {/* Header */}
          <header
            style={{
              padding: '12px 20px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#F8FAFC',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
              <div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, margin: 0, color: '#F8FAFC' }}>
                  Tu Carrito de Compras
                </h2>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>
                  {cartItems.length} producto{cartItems.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {cartItems.length > 0 && (
              <button
                onClick={clearCart}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: '1px solid rgba(255, 59, 48, 0.3)',
                  background: 'rgba(255, 59, 48, 0.12)',
                  color: '#FF3B30',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Trash2 size={14} />
                <span>Vaciar</span>
              </button>
            )}
          </header>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {cartItems.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 24,
                    background: 'rgba(0, 122, 255, 0.15)',
                    border: '1px solid rgba(0, 122, 255, 0.3)',
                    color: '#007AFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShoppingBag size={36} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#F8FAFC', margin: '0 0 6px' }}>
                    Tu carrito está vacío
                  </h3>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, maxWidth: 260 }}>
                    Explora tus restaurantes y tiendas favoritas para agregar deliciosos productos.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="lf-press lf-touch"
                  style={{
                    padding: '14px 26px',
                    borderRadius: 100,
                    background: '#007AFF',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(0, 122, 255, 0.35)',
                  }}
                >
                  Explorar Tiendas
                </button>
              </div>
            ) : (
              <>
                {/* Store Groups */}
                {grupos.map((grupo) => (
                  <div
                    key={grupo.tiendaId}
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 20,
                      padding: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          background: '#007AFF',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          fontSize: 13,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {grupo.tiendaLogoIniciales}
                      </div>
                      <div>
                        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{grupo.tiendaNombre}</h4>
                        <span style={{ fontSize: 11, color: '#34C759', fontWeight: 600 }}>Entrega estimada: 25 - 35 min</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 12 }}>
                      {grupo.items.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 12,
                            borderRadius: 14,
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div style={{ flex: 1, paddingRight: 12 }}>
                            <h5 style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{item.nombreProducto}</h5>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#007AFF', marginTop: 4, display: 'block' }}>
                              C$ {((Number(item.precioUnitario ?? (item as any).precio ?? 0) || 0) * (Number(item.cantidad) || 1)).toFixed(2)}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.08)', padding: 4, borderRadius: 100 }}>
                            <button
                              onClick={() => updateCartItemQty(item.id, item.cantidad - 1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.12)',
                                color: '#F8FAFC',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Minus size={14} />
                            </button>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: '#F8FAFC', minWidth: 20, textAlign: 'center' }}>
                              {item.cantidad}
                            </span>
                            <button
                              onClick={() => updateCartItemQty(item.id, item.cantidad + 1)}
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                border: 'none',
                                background: '#007AFF',
                                color: '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Promo Code Card */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <button
                    onClick={() => setMostrarCodigo(!mostrarCodigo)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'none',
                      border: 'none',
                      color: '#F8FAFC',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Tag size={16} color="#007AFF" />
                      <span>{cartCodigoPromo ? `Cupón aplicado: ${cartCodigoPromo}` : '¿Tienes un código promocional?'}</span>
                    </div>
                    <span style={{ color: '#007AFF', fontSize: 12 }}>{mostrarCodigo ? 'Ocultar' : 'Agregar'}</span>
                  </button>

                  {mostrarCodigo && (
                    <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          value={codigoPromoInput}
                          onChange={(e) => setCodigoPromoInput(e.target.value.toUpperCase())}
                          placeholder="Ingresa tu código"
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 12,
                            background: 'rgba(15, 23, 42, 0.6)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            color: '#F8FAFC',
                            fontSize: 13,
                            fontWeight: 600,
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={handleAplicarCodigo}
                          disabled={isValidandoCodigo}
                          style={{
                            padding: '10px 18px',
                            borderRadius: 12,
                            background: '#007AFF',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: isValidandoCodigo ? 'wait' : 'pointer',
                            opacity: isValidandoCodigo ? 0.7 : 1,
                          }}
                        >
                          {isValidandoCodigo ? 'Validando...' : 'Aplicar'}
                        </button>
                      </div>

                      {/* Lista de cupones guardados en la billetera */}
                      {cuponesDisponibles.length > 0 && (
                        <div style={{ paddingTop: 4 }}>
                          <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                            Tus cupones en billetera:
                          </span>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {cuponesDisponibles.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={async () => {
                                  // El descuento lo confirma el servidor aunque el cupón venga de la billetera.
                                  const resultado = await aplicarCodigoServidor(c.codigoPromo);
                                  if (resultado.ok) notify.success(resultado.mensaje);
                                  else notify.error(resultado.mensaje);
                                }}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 12px',
                                  borderRadius: 10,
                                  background: cartCodigoPromo === c.codigoPromo ? 'rgba(52, 199, 89, 0.25)' : 'rgba(0, 122, 255, 0.15)',
                                  border: `1px solid ${cartCodigoPromo === c.codigoPromo ? '#34C759' : 'rgba(0, 122, 255, 0.4)'}`,
                                  color: '#FFFFFF',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <Tag size={11} /> {c.codigoPromo} (-C${c.valor})
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Dirección de Entrega (Obligatoria) */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: addressError ? '2px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <MapPin size={16} color="#34C759" />
                      <span>Dirección de Entrega</span>
                      <span style={{ fontSize: 11, color: '#EF4444', fontWeight: 600 }}>*Obligatorio</span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      onClick={handleUseCartLocation}
                      disabled={isGettingLocation}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isGettingLocation
                          ? 'rgba(0, 122, 255, 0.18)'
                          : hasCartGps && deliveryLat
                          ? 'rgba(52, 199, 89, 0.2)'
                          : 'rgba(52, 199, 89, 0.12)',
                        border: isGettingLocation
                          ? '1px solid rgba(0, 122, 255, 0.4)'
                          : hasCartGps && deliveryLat
                          ? '1.5px solid #34C759'
                          : '1px solid rgba(52, 199, 89, 0.3)',
                        borderRadius: 100,
                        padding: '5px 12px',
                        color: isGettingLocation
                          ? '#60A5FA'
                          : hasCartGps && deliveryLat
                          ? '#34C759'
                          : '#34C759',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: isGettingLocation ? 'wait' : 'pointer',
                        boxShadow: hasCartGps && deliveryLat ? '0 0 12px rgba(52, 199, 89, 0.3)' : 'none',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {isGettingLocation ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            style={{ display: 'inline-flex' }}
                          >
                            <Locate size={12} />
                          </motion.span>
                          <span>Buscando señal GPS...</span>
                        </>
                      ) : hasCartGps && deliveryLat ? (
                        <>
                          <Check size={12} strokeWidth={2.5} />
                          <span>GPS Fijado</span>
                        </>
                      ) : (
                        <>
                          <Locate size={12} />
                          <span>Usar mi GPS</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  {/* #2 Modo de entrega: el retiro no cobra envío ni usa repartidor */}
                  <div className="grid grid-cols-2 gap-2" style={{ marginBottom: 10 }}>
                    <button
                      type="button"
                      onClick={() => setModoEntrega('reparto')}
                      style={{
                        height: 44,
                        borderRadius: 12,
                        border: modoEntrega === 'reparto' ? '1.5px solid #0066FF' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: modoEntrega === 'reparto' ? 'rgba(0,102,255,0.18)' : 'transparent',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: 'pointer',
                      }}
                    >
                      Recibir a domicilio
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoEntrega('retiro')}
                      style={{
                        height: 44,
                        borderRadius: 12,
                        border: modoEntrega === 'retiro' ? '1.5px solid #22C55E' : '1px solid rgba(255, 255, 255, 0.15)',
                        background: modoEntrega === 'retiro' ? 'rgba(34,197,94,0.18)' : 'transparent',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: 12.5,
                        cursor: 'pointer',
                      }}
                    >
                      Retiro en tienda
                    </button>
                  </div>

                  {modoEntrega === 'retiro' && (
                    <div
                      style={{
                        marginBottom: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'rgba(34,197,94,0.12)',
                        border: '1px solid rgba(34,197,94,0.35)',
                        color: '#22C55E',
                        fontSize: 12.5,
                        lineHeight: 1.5,
                      }}
                    >
                      Recoges en <b>{grupos[0]?.tiendaNombre || 'la tienda'}</b> y no pagas envío. Al confirmar recibirás un
                      código PIN para retirar.
                    </div>
                  )}

                  <input
                    type="text"
                    value={direccionEntregaInput}
                    onChange={(e) => {
                      setDireccionEntregaInput(e.target.value);
                      setAddressError(false);
                    }}
                    placeholder="Ej: Col. Los Robles, de la gasolinera 2c al sur, Managua"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(15, 23, 42, 0.6)',
                      display: modoEntrega === 'retiro' ? 'none' : 'block',
                      border: addressError ? '1.5px solid #EF4444' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#F8FAFC',
                      fontSize: 13,
                      fontWeight: 600,
                      outline: 'none',
                    }}
                  />

                  {addressError && (
                    <div style={{ fontSize: 11, color: '#EF4444', marginTop: 6, fontWeight: 600 }}>
                      Debes escribir o confirmar tu dirección de entrega antes de pagar.
                    </div>
                  )}

                  {savedAddresses.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, color: '#94A3B8', width: '100%', marginBottom: 2 }}>Mis direcciones guardadas:</span>
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => {
                            setDireccionEntregaInput(addr.direccion);
                            setDeliveryLat(addr.lat || 0);
                            setDeliveryLng(addr.lng || 0);
                            setAddressError(false);
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: direccionEntregaInput === addr.direccion ? 'rgba(0, 122, 255, 0.25)' : 'rgba(255, 255, 255, 0.06)',
                            border: direccionEntregaInput === addr.direccion ? '1px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#F8FAFC',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {addr.etiqueta || addr.direccion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CreditCard size={16} color="#FF9500" />
                    <span>Método de Pago</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setCartMetodoPago('efectivo')}
                      style={{
                        padding: 12,
                        borderRadius: 14,
                        border: cartMetodoPago === 'efectivo' ? '2px solid #007AFF' : '1px solid rgba(255, 255, 255, 0.12)',
                        background: cartMetodoPago === 'efectivo' ? 'rgba(0, 122, 255, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        color: '#F8FAFC',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <DollarSign size={20} color={cartMetodoPago === 'efectivo' ? '#007AFF' : '#94A3B8'} />
                      <span style={{ fontSize: 13, fontWeight: 700 }}>Efectivo</span>
                      <span style={{ fontSize: 10, color: '#94A3B8' }}>Contra entrega</span>
                    </button>

                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title="Método de pago en habilitación técnica"
                      style={{
                        padding: '12px 8px',
                        borderRadius: 14,
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        background: 'rgba(15, 23, 42, 0.4)',
                        color: '#64748B',
                        cursor: 'not-allowed',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        position: 'relative',
                        opacity: 0.7,
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: 4,
                          background: 'rgba(255, 149, 0, 0.15)',
                          color: '#FF9500',
                          border: '1px solid rgba(255, 149, 0, 0.3)',
                          letterSpacing: '0.02em',
                        }}
                      >
                        Próximamente
                      </span>
                      <CreditCard size={20} color="#64748B" />
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>Transferencia</span>
                      <span style={{ fontSize: 10, color: '#64748B' }}>Trabajando en ello</span>
                    </button>
                  </div>
                </div>

                {/* Summary Totals */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: 20,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Subtotal</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#F8FAFC' }}>C$ {subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                    <span>Envío</span>
                    {envioEstado === 'ok' ? (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#F8FAFC' }}>C$ {delivery.toFixed(2)}</span>
                    ) : (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: '#94A3B8' }}>
                        {envioEstado === 'cargando' ? 'Calculando...' : envioEstado === 'multi' ? 'Por tienda' : 'Por confirmar'}
                      </span>
                    )}
                  </div>
                  {descuento > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#34C759', fontWeight: 700 }}>
                      <span>Descuento aplicado</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>- C$ {descuento.toFixed(2)}</span>
                    </div>
                  )}

                  {multiTienda && (
                    <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#F87171', fontSize: 11, fontWeight: 600, lineHeight: 1.45 }}>
                      Tu carrito tiene productos de más de una tienda. El envío se cotiza por tienda: realiza un pedido por tienda para poder pagar.
                    </div>
                  )}
                  {!multiTienda && modoEntrega === 'reparto' && tiendaAbierta === false && (
                    <div style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#EF4444', fontSize: 11.5, fontWeight: 700, lineHeight: 1.45 }}>
                      {envioTienda?.nombre || 'Esta tienda'} está cerrada{aperturaTexto ? ` · ${aperturaTexto}` : ''}. Tu carrito se conserva: podrás confirmar cuando abra.
                    </div>
                  )}
                  {!multiTienda && faltaParaMinimo > 0 && (
                    <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#F59E0B', fontSize: 11, fontWeight: 600, lineHeight: 1.45 }}>
                      El pedido mínimo de {envioTienda?.nombre || 'esta tienda'} es C$ {pedidoMinimo.toFixed(2)}. Te faltan C$ {faltaParaMinimo.toFixed(2)} para poder pagar.
                    </div>
                  )}
                  {envioEstado === 'cargando' && (
                    <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(148, 163, 184, 0.12)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#94A3B8', fontSize: 11, fontWeight: 600, lineHeight: 1.45 }}>
                      Calculando el costo de envío real de esta tienda...
                    </div>
                  )}
                  {envioEstado === 'desconocido' && (
                    <div style={{ padding: '8px 12px', borderRadius: 12, background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#F59E0B', fontSize: 11, fontWeight: 600, lineHeight: 1.45 }}>
                      No pudimos verificar el envío de esta tienda. El total mostrado no incluye envío: al confirmar se te cobrará el envío real.
                    </div>
                  )}

                  <div style={{ paddingTop: 10, borderTop: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: '#F8FAFC', fontSize: 15 }}>Total a Pagar</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 800, color: '#007AFF' }}>
                      C$ {total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Checkout Button */}
          {cartItems.length > 0 && (
            <div
              style={{
                padding: 16,
                paddingBottom: 'calc(16px + var(--lf-safe-bottom, 0px))',
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                position: 'sticky',
                bottom: 0,
                zIndex: 5,
              }}
            >
              <button
                onClick={handlePagar}
                disabled={isProcessing || envioEstado === 'cargando' || !!motivoBloqueo}
                className="lf-press"
                style={{
                  width: '100%',
                  minHeight: 56,
                  padding: 16,
                  borderRadius: 'var(--lf-button-radius, 16px)',
                  background: 'linear-gradient(135deg, #007AFF 0%, #0056B3 100%)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 16,
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  cursor: isProcessing || envioEstado === 'cargando' || motivoBloqueo ? 'not-allowed' : 'pointer',
                  opacity: envioEstado === 'cargando' || motivoBloqueo ? 0.65 : 1,
                  boxShadow: '0 8px 24px rgba(0, 122, 255, 0.4)',
                }}
              >
                {isProcessing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogoSpinner size={22} />
                    <span>Procesando...</span>
                  </div>
                ) : motivoBloqueo ? (
                  <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', lineHeight: 1.35 }}>{motivoBloqueo}</span>
                ) : envioEstado === 'cargando' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <LogoSpinner size={22} />
                    <span>Calculando envío...</span>
                  </div>
                ) : (
                  <>
                    <span>
                      Confirmar y Pagar C$ {total.toFixed(2)}
                      {envioEstado === 'desconocido' ? ' + envío' : ''}
                    </span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {completedOrder && (
        <PagoExitoso
          order={completedOrder}
          onClose={() => {
            setCompletedOrder(null);
            onClose();
          }}
          onTrackOrder={(orderId) => {
            setCompletedOrder(null);
            onClose();
            useStore.getState().setTrackingOrder(orderId);
          }}
          setClientActiveModule={(mod) => {
            setCompletedOrder(null);
            onClose();
            useStore.getState().setClientActiveModule(mod);
          }}
        />
      )}
    </AnimatePresence>
  );
}
