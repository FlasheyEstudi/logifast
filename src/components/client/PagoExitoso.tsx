'use client';

import React from 'react';
import OrderConfirmationModal from '@/components/ui/OrderConfirmationModal';

export interface CompletedOrderData {
  id: string;
  codigoPin?: string;
  tiendaNombre?: string;
  direccionEntrega?: string;
  subtotal?: number;
  costoEnvio?: number;
  descuento?: number;
  total?: number;
  metodoPago?: string;
  kmEstimados?: number;
  tiempoEstimado?: number;
  items?: Array<{
    nombreProducto?: string;
    nombre?: string;
    cantidad: number;
    precioUnitario?: number;
    precio?: number;
  }>;
  createdAt?: string;
}

interface PagoExitosoProps {
  order?: CompletedOrderData | null;
  orderId?: string;
  onClose: () => void;
  onTrackOrder?: (orderId: string) => void;
  setClientActiveModule?: (module: any) => void;
}

const safeNum = (v: any, fallback = 0): number => {
  const n = Number(v);
  return !Number.isNaN(n) && Number.isFinite(n) ? n : fallback;
};

export default function PagoExitoso({
  order,
  orderId,
  onClose,
  onTrackOrder,
  setClientActiveModule,
}: PagoExitosoProps) {
  const effectiveId = order?.id || orderId || `LF-${Math.floor(Math.random() * 90000) + 10000}`;
  const pin = order?.codigoPin || '';
  const subtotal = safeNum(
    order?.subtotal,
    safeNum(order?.total) ? Math.max(0, safeNum(order?.total) - safeNum(order?.costoEnvio, 35)) : 0
  );
  const envio = safeNum(order?.costoEnvio, 35);
  const descuento = safeNum(order?.descuento, 0);
  const total = safeNum(order?.total, Math.max(0, subtotal + envio - descuento));
  const tienda = order?.tiendaNombre || 'Tienda Asociada';
  const direccion = order?.direccionEntrega || 'Dirección de Entrega';
  const km = order?.kmEstimados && order.kmEstimados > 0 ? order.kmEstimados : undefined;
  const tiempoMin =
    order?.tiempoEstimado && order.tiempoEstimado > 0
      ? order.tiempoEstimado
      : km
      ? Math.round(Number(km) * 4 + 10)
      : 25;

  const itemsFormatted = (order?.items || []).map((it) => ({
    nombre: it.nombreProducto || it.nombre || 'Producto',
    cantidad: it.cantidad || 1,
    precio: safeNum(it.precioUnitario ?? it.precio, 0),
  }));

  const handleRastrear = (targetId: string) => {
    if (typeof onTrackOrder === 'function') {
      onTrackOrder(targetId);
    } else if (typeof setClientActiveModule === 'function') {
      setClientActiveModule('pedidos');
    }
    onClose();
  };

  const handleIrAPedidos = () => {
    if (typeof setClientActiveModule === 'function') {
      setClientActiveModule('pedidos');
    }
    onClose();
  };

  const handleIrAInicio = () => {
    if (typeof setClientActiveModule === 'function') {
      setClientActiveModule('inicio');
    }
    onClose();
  };

  return (
    <OrderConfirmationModal
      tipo="pedido"
      orderId={effectiveId}
      titulo="¡Pedido confirmado!"
      subtitulo="Tu compra ha sido confirmada. El comercio preparará tu pedido para el repartidor."
      pin={pin}
      origen={tienda}
      destino={direccion}
      items={itemsFormatted}
      subtotal={subtotal}
      costoEnvio={envio}
      descuento={descuento}
      total={total}
      metodoPago={order?.metodoPago || 'efectivo'}
      distanciaKm={km}
      tiempoEstimadoMin={tiempoMin}
      onRastrear={handleRastrear}
      onVerLista={handleIrAPedidos}
      onIrAInicio={handleIrAInicio}
      onClose={onClose}
    />
  );
}
