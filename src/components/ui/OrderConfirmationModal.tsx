'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  Package,
  Home,
  ShieldCheck,
  Clock,
  Truck,
  CreditCard,
  Banknote,
  Tag,
  Calendar,
  X,
} from '@/components/icons';

export interface OrderConfirmationModalProps {
  tipo: 'envio' | 'pedido';
  orderId: string;
  titulo?: string;
  subtitulo?: string;
  pin?: string;
  origen?: string;
  destino?: string;
  programadoTexto?: string;
  items?: Array<{
    nombre: string;
    cantidad: number;
    precio: number;
  }>;
  subtotal?: number;
  costoEnvio?: number;
  descuento?: number;
  total: number;
  metodoPago?: 'efectivo' | 'transferencia' | string;
  distanciaKm?: number;
  tiempoEstimadoMin?: number;
  onRastrear: (orderId: string) => void;
  onVerLista: () => void;
  onIrAInicio: () => void;
  onClose?: () => void;
}

export default function OrderConfirmationModal({
  tipo,
  orderId,
  titulo,
  subtitulo,
  pin,
  origen,
  destino,
  programadoTexto,
  items,
  subtotal,
  costoEnvio,
  descuento,
  total,
  metodoPago = 'efectivo',
  distanciaKm,
  tiempoEstimadoMin = 15,
  onRastrear,
  onVerLista,
  onIrAInicio,
  onClose,
}: OrderConfirmationModalProps) {
  const shortId = orderId ? orderId.slice(-8).toUpperCase() : '';
  const resolvedTitulo =
    titulo || (tipo === 'envio' ? '¡Envío confirmado!' : '¡Pedido confirmado!');
  const resolvedSubtitulo =
    subtitulo ||
    (tipo === 'envio'
      ? 'Tu solicitud de envío ha sido registrada. Un repartidor acudirá por el paquete en breve.'
      : 'Tu compra ha sido registrada. El comercio ya está preparando tu pedido.');

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 440,
            maxHeight: '92vh',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--lf-card-radius, 24px)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '24px 20px',
            gap: 16,
            overflowY: 'auto',
            fontFamily: "'DM Sans', sans-serif",
            color: 'var(--text)',
            margin: 'auto',
          }}
          className="lf-scrollbar"
        >
          {/* Acento superior de identidad LogiFast */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: 'var(--primario)',
              borderRadius: '24px 24px 0 0',
            }}
          />

          {/* Botón de cierre opcional en esquina */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'var(--bg-alt)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              aria-label="Cerrar confirmación"
            >
              <X size={16} />
            </button>
          )}

          {/* Icono de Confirmación Exitoso */}
          <div
            style={{
              position: 'relative',
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'var(--primario-soft)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--exito, #34C759)',
              marginTop: 4,
            }}
          >
            <CheckCircle size={42} strokeWidth={2.3} />
          </div>

          {/* Título, ID de orden y subtítulo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: '100%' }}>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                color: 'var(--text)',
                lineHeight: 1.25,
                margin: 0,
              }}
            >
              {resolvedTitulo}
            </h2>

            {shortId && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 12px',
                  borderRadius: 'var(--lf-pill-radius, 100px)',
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.04em',
                }}
              >
                <span>Orden #{shortId}</span>
              </div>
            )}

            <p
              style={{
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.45,
                maxWidth: 340,
                margin: 0,
              }}
            >
              {resolvedSubtitulo}
            </p>
          </div>

          {/* Recogida Programada (si aplica) */}
          {programadoTexto && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--lf-card-radius, 16px)',
                background: 'var(--primario-soft)',
                border: '1px solid var(--border)',
                textAlign: 'left',
              }}
            >
              <Calendar size={20} style={{ color: 'var(--primario)', flexShrink: 0 }} />
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--primario)',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  Recogida Programada
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                  {programadoTexto}
                </div>
              </div>
            </div>
          )}

          {/* PIN de Seguridad para Entrega */}
          {pin && (
            <div
              style={{
                width: '100%',
                background: 'var(--primario-soft)',
                border: '1px dashed var(--primario)',
                borderRadius: 'var(--lf-card-radius, 16px)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--primario)',
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                <ShieldCheck size={15} />
                <span>PIN de Seguridad para Entrega</span>
              </div>
              <div
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: '0.22em',
                  color: 'var(--primario)',
                  padding: '4px 0',
                }}
              >
                {pin}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                Dicta o muestra este código al repartidor al recibir tu {tipo === 'envio' ? 'envío' : 'pedido'}
              </p>
            </div>
          )}

          {/* Tarjeta de Resumen Unificada */}
          <div
            style={{
              width: '100%',
              background: 'var(--bg-alt)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--lf-card-radius, 16px)',
              padding: '14px 16px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              fontSize: 13,
            }}
          >
            {/* Origen */}
            {origen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#34C759',
                    boxShadow: '0 0 6px rgba(52, 199, 89, 0.4)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {origen}
                </span>
              </div>
            )}

            {/* Destino */}
            {destino && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: 'var(--primario)',
                    boxShadow: '0 0 6px var(--primario)',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: 'var(--text)',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {destino}
                </span>
              </div>
            )}

            {/* Tiempo y Distancia Estimados */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 8,
                borderTop: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                fontSize: 12,
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                <span>Tiempo estimado</span>
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {distanciaKm ? `${distanciaKm.toFixed(1)} km • ` : ''}~{tiempoEstimadoMin} min
              </span>
            </div>

            {/* Lista de Productos si existen */}
            {items && items.length > 0 && (
              <div
                style={{
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--text-muted)',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  Productos ({items.reduce((acc, it) => acc + (it.cantidad || 1), 0)})
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    maxHeight: 96,
                    overflowY: 'auto',
                    paddingRight: 4,
                  }}
                  className="lf-scrollbar"
                >
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <span
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 220,
                        }}
                      >
                        {it.cantidad}x {it.nombre}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600 }}>
                        C$ {(it.precio * it.cantidad).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Desglose de Precios */}
            {(subtotal !== undefined || costoEnvio !== undefined || (descuento && descuento > 0)) && (
              <div
                style={{
                  paddingTop: 8,
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                {subtotal !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
                      C$ {subtotal.toFixed(2)}
                    </span>
                  </div>
                )}
                {costoEnvio !== undefined && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Costo de Envío Express</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
                      C$ {costoEnvio.toFixed(2)}
                    </span>
                  </div>
                )}
                {descuento && descuento > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      color: 'var(--exito, #34C759)',
                      fontWeight: 600,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={12} /> Descuento Cupón
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      -C$ {descuento.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Total y Método de Pago */}
            <div
              style={{
                paddingTop: 10,
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--text-secondary)',
                  fontSize: 12,
                }}
              >
                {metodoPago === 'transferencia' ? (
                  <CreditCard size={14} style={{ color: 'var(--primario)' }} />
                ) : (
                  <Banknote size={14} style={{ color: 'var(--exito, #34C759)' }} />
                )}
                <span>{metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo contra entrega'}</span>
              </div>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--primario)',
                }}
              >
                C$ {total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Botones de Acción Globales */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', paddingTop: 2 }}>
            <button
              type="button"
              onClick={() => onRastrear(orderId)}
              style={{
                width: '100%',
                height: 48,
                borderRadius: 'var(--lf-button-radius, 16px)',
                background: 'var(--primario)',
                color: '#FFFFFF',
                border: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: 'var(--shadow-primario)',
                transition: 'transform 0.15s ease, filter 0.15s ease',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Truck size={18} />
              <span>{tipo === 'envio' ? 'Rastrear envío en vivo' : 'Rastrear pedido en vivo'}</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
              <button
                type="button"
                onClick={onVerLista}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 'var(--lf-button-radius, 14px)',
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.2s',
                }}
              >
                <Package size={15} style={{ color: 'var(--text-secondary)' }} />
                <span>{tipo === 'envio' ? 'Mis Envíos' : 'Mis Pedidos'}</span>
              </button>

              <button
                type="button"
                onClick={onIrAInicio}
                style={{
                  width: '100%',
                  height: 42,
                  borderRadius: 'var(--lf-button-radius, 14px)',
                  background: 'var(--bg-alt)',
                  border: '1px solid var(--border)',
                  color: 'var(--text)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  transition: 'background 0.2s',
                }}
              >
                <Home size={15} style={{ color: 'var(--text-secondary)' }} />
                <span>Inicio</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
