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
import { reproducirSonido } from '@/services/audio';

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
          reproducirSonido('mensaje', 90);
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => toggleChat(undefined)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
        />

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
            background: 'var(--surface)',
            color: 'var(--text)',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            boxShadow: '0 -16px 48px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 10000,
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)',
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
                <div style={{ fontSize: 16, fontWeight: 800 }}>
                  {clienteNombre}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                    Cliente conectado
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
                    borderRadius: 12,
                    background: 'rgba(52, 199, 89, 0.15)',
                    color: '#34C759',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                  }}
                  title="Llamar al cliente"
                >
                  <Phone size={18} />
                </a>
              )}

              <button
                onClick={() => toggleChat(undefined)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: 'var(--surface-variant, color-mix(in srgb, var(--surface) 90%, var(--text) 10%))',
                  border: 'none',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
                title="Cerrar chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            ref={listRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              background: 'var(--bg)',
            }}
          >
            {mensajes.length === 0 ? (
              <div
                style={{
                  margin: 'auto',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  padding: 24,
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'var(--primario, #10B981)' }}>
                  <MessageSquare size={24} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Canal de chat directo</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  Comunícate con el cliente para confirmar detalles de recogida o entrega.
                </div>
              </div>
            ) : (
              mensajes.map((m) => {
                const esMio = m.emisor === 'repartidor';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: esMio ? 'flex-end' : 'flex-start',
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: '82%',
                        padding: '10px 14px',
                        borderRadius: esMio ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: esMio
                          ? 'var(--primario, #10B981)'
                          : 'var(--surface)',
                        color: esMio ? '#FFFFFF' : 'var(--text)',
                        fontSize: 14,
                        lineHeight: 1.4,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        border: esMio ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      {m.contenido}
                      <div
                        style={{
                          fontSize: 10,
                          textAlign: 'right',
                          marginTop: 4,
                          color: esMio ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {m.enviadoEn}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
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
                    border: '1px solid var(--border)',
                    background: 'var(--surface-variant, color-mix(in srgb, var(--surface) 92%, var(--text) 8%))',
                    color: 'var(--text)',
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
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
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
                  background: input.trim() ? '#10B981' : 'var(--surface-variant, rgba(0, 0, 0, 0.08))',
                  color: input.trim() ? '#FFFFFF' : 'var(--text-muted)',
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
