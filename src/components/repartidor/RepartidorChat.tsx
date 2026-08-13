// components/repartidor/RepartidorChat.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Phone,
  MessageSquare,
  Zap,
  Check,
  CheckCheck,
  MapPin,
  User,
} from 'lucide-react';
import { useRepartidorStore, type ChatMensaje } from '@/lib/repartidor-store';
import { realtime, onRealtimeEvent } from '@/services/realtime';

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const MENSAJES_RAPIDOS = [
  'Voy en camino a tu ubicación',
  'Ya estoy afuera en el punto de entrega',
  'Un momento por favor, hay un poco de tráfico',
  '¿Podrías confirmarme alguna referencia?',
  'Por favor llámame si tienes dudas',
];

function hapticTap(pattern: 'light' | 'medium' | 'success' = 'light') {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      if (pattern === 'success') {
        navigator.vibrate([15, 40, 15]);
      } else if (pattern === 'medium') {
        navigator.vibrate(20);
      } else {
        navigator.vibrate(10);
      }
    } catch {}
  }
}

export default function RepartidorChat() {
  const {
    chatOrdenId,
    ordenActiva,
    toggleChat,
  } = useRepartidorStore();

  const [input, setInput] = useState('');
  const [mostrarRapidos, setMostrarRapidos] = useState(false);
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([]);
  const [clienteData, setClienteData] = useState<{ nombre: string; telefono: string; direccion?: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const ordenIdActiva = chatOrdenId || ordenActiva?.id;

  // Load chat messages and client details from API
  const loadChat = useCallback(async () => {
    if (!ordenIdActiva) return;
    try {
      const res = await fetch(`/api/repartidor/chat?ordenId=${ordenIdActiva}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mensajes)) {
          setMensajes(data.mensajes);
        }
        if (data.cliente) {
          setClienteData({
            nombre: data.cliente.nombre || ordenActiva?.cliente || 'Cliente',
            telefono: data.cliente.telefono || ordenActiva?.clienteTelefono || '+505 8888-0000',
            direccion: (ordenActiva as any)?.destinoDireccion || (ordenActiva as any)?.destino || 'Destino de entrega',
          });
        }
      }
    } catch (err) {
      console.warn('[RepartidorChat load error]', err);
    }
  }, [ordenIdActiva, ordenActiva]);

  useEffect(() => {
    if (chatOrdenId) {
      loadChat();
      const interval = setInterval(loadChat, 4000);
      return () => clearInterval(interval);
    }
  }, [chatOrdenId, loadChat]);

  // Join WebSocket room and listen for incoming client messages
  useEffect(() => {
    if (!ordenIdActiva) return;
    realtime.clienteTrackingUnirse(ordenIdActiva);

    const cleanup = onRealtimeEvent('chat:mensaje:nuevo', (msg) => {
      if (msg.ordenId === ordenIdActiva) {
        setMensajes((prev) => {
          const yaExiste = prev.some((m) => m.id === msg.id || (m.contenido === msg.contenido && m.enviadoEn === msg.enviadoEn));
          if (yaExiste) return prev;
          return [...prev, {
            id: msg.id || `ws-${Date.now()}`,
            ordenId: msg.ordenId,
            emisor: msg.emisor,
            contenido: msg.contenido,
            enviadoEn: msg.enviadoEn || new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false }),
            leido: false,
          }];
        });
        if (msg.emisor === 'cliente') {
          hapticTap('success');
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [ordenIdActiva]);

  // Scroll to bottom
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [mensajes]);

  const handleEnviar = async () => {
    const text = input.trim();
    if (!text || !ordenIdActiva) return;

    hapticTap('light');
    const tempId = `temp-${Date.now()}`;
    const horaActual = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Optimistic UI update
    setMensajes((prev) => [
      ...prev,
      {
        id: tempId,
        ordenId: ordenIdActiva,
        emisor: 'repartidor',
        contenido: text,
        enviadoEn: horaActual,
        leido: false,
      },
    ]);
    setInput('');
    setMostrarRapidos(false);

    // Emit via WebSocket for instant delivery
    realtime.chatMensaje(ordenIdActiva, 'repartidor', text);

    // Persist in DB
    try {
      const res = await fetch('/api/repartidor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordenId: ordenIdActiva,
          contenido: text,
          emisor: 'repartidor',
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d?.mensaje?.id) {
          setMensajes((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: d.mensaje.id } : m))
          );
        }
      }
    } catch (err) {
      console.warn('[RepartidorChat send error]', err);
    }
  };

  const handleSeleccionarRapido = (msg: string) => {
    setInput(msg);
    setMostrarRapidos(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  if (!chatOrdenId) return null;

  const clienteNombre = clienteData?.nombre || ordenActiva?.cliente || 'Cliente';
  const clienteTelefono = clienteData?.telefono || ordenActiva?.clienteTelefono || '+505 8888-0000';

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => toggleChat(undefined)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 540,
            height: '100vh',
            maxHeight: '92vh',
            background: 'var(--surface, #1E293B)',
            color: 'var(--text, #F8FAFC)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            boxShadow: '0 -16px 48px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
              background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 16,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                {clienteNombre.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>
                  {clienteNombre}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                    Cliente conectado · En vivo
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {clienteTelefono && (
                <a
                  href={`tel:${clienteTelefono}`}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: 'rgba(52, 199, 89, 0.15)',
                    color: '#34C759',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                  title={`Llamar al cliente (${clienteTelefono})`}
                >
                  <Phone size={17} />
                </a>
              )}

              <button
                onClick={() => toggleChat(undefined)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-muted, #94A3B8)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages list */}
          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              background: 'var(--bg, #0B132B)',
            }}
          >
            {mensajes.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', textAlign: 'center', gap: 8, color: '#94A3B8' }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MessageSquare size={22} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, color: 'var(--text, #F8FAFC)' }}>
                  Canal de chat directo con el cliente
                </div>
                <div style={{ fontSize: 12, maxWidth: 260 }}>
                  Envía un mensaje rápido para notificar tu llegada o solicitar detalles del acceso.
                </div>
              </div>
            ) : (
              mensajes.map((m) => {
                const isRepartidor = m.emisor === 'repartidor';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      justifyContent: isRepartidor ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    <div style={{ maxWidth: '82%' }}>
                      <div
                        style={{
                          padding: '10px 14px',
                          fontSize: 14,
                          lineHeight: 1.45,
                          wordBreak: 'break-word',
                          color: '#FFFFFF',
                          background: isRepartidor
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : '#334155',
                          borderRadius: isRepartidor ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          boxShadow: isRepartidor
                            ? '0 3px 12px rgba(16, 185, 129, 0.25)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                          fontWeight: 500,
                        }}
                      >
                        {m.contenido}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isRepartidor ? 'flex-end' : 'flex-start',
                          gap: 4,
                          marginTop: 3,
                          paddingLeft: isRepartidor ? 0 : 4,
                          paddingRight: isRepartidor ? 4 : 0,
                          fontSize: 10,
                          color: '#94A3B8',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        <span>{m.enviadoEn}</span>
                        {isRepartidor && (
                          (m as any).leido ? (
                            <CheckCheck size={13} color="#60A5FA" />
                          ) : (
                            <Check size={13} style={{ opacity: 0.7 }} />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick replies tray */}
          <div
            style={{
              borderTop: '1px solid var(--border, rgba(255,255,255,0.08))',
              background: 'var(--surface, #1E293B)',
              padding: '10px 16px',
              paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
            }}
          >
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
              {MENSAJES_RAPIDOS.map((text) => (
                <button
                  key={text}
                  onClick={() => handleSeleccionarRapido(text)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 99,
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: '#E2E8F0',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe un mensaje al cliente..."
                rows={1}
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(0,0,0,0.25)',
                  color: '#FFFFFF',
                  fontSize: 14,
                  outline: 'none',
                  maxHeight: 80,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              />

              <button
                onClick={handleEnviar}
                disabled={!input.trim()}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  border: 'none',
                  background: input.trim() ? '#10B981' : 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: input.trim() ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.2s ease',
                }}
                title="Enviar"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
