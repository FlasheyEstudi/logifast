'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Send,
  Check,
  CheckCheck,
  MessageSquare,
  ShieldCheck,
  Navigation,
  Sparkles,
} from 'lucide-react';
import { useStore, type ChatMessage } from '@/lib/store';
import { realtime, onRealtimeEvent } from '@/services/realtime';
import { reproducirSonido } from '@/services/audio';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientChatProps {
  isDark: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════
   CONSTANTS & QUICK REPLIES
   ═══════════════════════════════════════════════ */

const QUICK_REPLIES = [
  '¿Ya vienes en camino?',
  '¿Cuánto tiempo falta aproximadamente?',
  'Estoy afuera en el portón esperándote',
  '¡Muchas gracias por la entrega!',
];

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function getInitials(name: string): string {
  if (!name) return 'RP';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

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

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function MessageBubble({
  msg,
  isClient,
  isDark,
}: {
  msg: { id: string; contenido: string; emisor: string; enviadoEn: string; leido?: boolean };
  isClient: boolean;
  isDark: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      style={{
        display: 'flex',
        justifyContent: isClient ? 'flex-end' : 'flex-start',
        marginBottom: 8,
        width: '100%',
      }}
    >
      <div style={{ maxWidth: '82%', position: 'relative' }}>
        <div
          style={{
            padding: '10px 14px',
            fontSize: 14,
            lineHeight: 1.45,
            wordBreak: 'break-word',
            color: isClient ? '#FFFFFF' : isDark ? '#F1F5F9' : '#0F172A',
            background: isClient
              ? 'linear-gradient(135deg, #007AFF, #0056B3)'
              : isDark
              ? '#1E293B'
              : '#F1F5F9',
            borderRadius: isClient ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            boxShadow: isClient
              ? '0 3px 12px rgba(0, 122, 255, 0.25)'
              : '0 2px 6px rgba(0,0,0,0.04)',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 500,
          }}
        >
          {msg.contenido}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isClient ? 'flex-end' : 'flex-start',
            gap: 4,
            marginTop: 3,
            paddingLeft: isClient ? 0 : 4,
            paddingRight: isClient ? 4 : 0,
            fontSize: 10,
            color: isDark ? '#94A3B8' : '#64748B',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>{msg.enviadoEn}</span>
          {isClient && (
            msg.leido ? (
              <CheckCheck size={13} color="#60A5FA" />
            ) : (
              <Check size={13} style={{ opacity: 0.7 }} />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN CLIENT CHAT COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientChat({ isDark, onClose }: ClientChatProps) {
  const chatOpen = useStore((s) => s.chatOpen);
  const chatOrderId = useStore((s) => s.chatOrderId);
  const setChatOpen = useStore((s) => s.setChatOpen);
  const orders = useStore((s) => s.orders);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; ordenId: string; emisor: string; contenido: string; enviadoEn: string; leido?: boolean }>>([]);
  const [driver, setDriver] = useState<{
    id: string;
    nombre: string;
    telefono: string;
    fotoUrl: string | null;
    initials: string;
    color: string;
    calificacion?: number;
  } | null>(null);

  const [isOrderActive, setIsOrderActive] = useState(true);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Load chat history and driver details
  const loadChatData = useCallback(async () => {
    if (!chatOrderId) return;
    try {
      const res = await fetch(`/api/repartidor/chat?ordenId=${chatOrderId}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.mensajes)) {
          setMessages(data.mensajes);
        }
        if (data.repartidor) {
          setDriver(data.repartidor);
        }
        if (typeof data.activa === 'boolean') {
          setIsOrderActive(data.activa);
        }
      }
    } catch (err) {
      console.warn('[ClientChat load error]', err);
    } finally {
      setLoading(false);
    }
  }, [chatOrderId]);

  useEffect(() => {
    if (chatOpen && chatOrderId) {
      loadChatData();
      const interval = setInterval(loadChatData, 4000);
      return () => clearInterval(interval);
    }
  }, [chatOpen, chatOrderId, loadChatData]);

  // Fallback driver info from local store if needed
  useEffect(() => {
    if (!driver && chatOrderId) {
      const foundOrder = orders.find((o) => o.id === chatOrderId);
      if (foundOrder && foundOrder.repartidor && foundOrder.repartidor !== 'Sin asignar') {
        setDriver({
          id: 'rep-assigned',
          nombre: foundOrder.repartidor,
          telefono: (foundOrder as any).repartidorTelefono || '+505 8765-4321',
          fotoUrl: null,
          initials: foundOrder.repartidorInitials || getInitials(foundOrder.repartidor),
          color: '#007AFF',
        });
      }
    }
  }, [driver, chatOrderId, orders]);

  // Listen for real-time WebSocket chat updates
  useEffect(() => {
    if (!chatOrderId) return;
    realtime.clienteTrackingUnirse(chatOrderId);

    const cleanup = onRealtimeEvent('chat:mensaje:nuevo', (msg) => {
      if (msg.ordenId === chatOrderId) {
        setMessages((prev) => {
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
        if (msg.emisor === 'repartidor') {
          reproducirSonido('mensaje', 90);
          hapticTap('success');
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [chatOrderId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleClose = useCallback(() => {
    setChatOpen(false);
    onClose();
  }, [setChatOpen, onClose]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !chatOrderId) return;

    hapticTap('light');
    const tempId = `temp-${Date.now()}`;
    const horaActual = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });

    // Optimistic UI update
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        ordenId: chatOrderId,
        emisor: 'cliente',
        contenido: text,
        enviadoEn: horaActual,
        leido: false,
      },
    ]);
    setInput('');

    // Emit via WebSocket for instant delivery (<50ms)
    realtime.chatMensaje(chatOrderId, 'cliente', text);

    // Persist in database
    try {
      const res = await fetch('/api/repartidor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ordenId: chatOrderId,
          contenido: text,
          emisor: 'cliente',
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d?.mensaje?.id) {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? { ...m, id: d.mensaje.id } : m))
          );
        }
      }
    } catch (err) {
      console.warn('[ClientChat send error]', err);
    }
  };

  const handleQuickReply = (text: string) => {
    setInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const driverPhone = driver?.telefono || '+505 8765-4321';

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={handleClose}
            style={{ background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }}
          />

          {/* Chat Sheet Modal */}
          <motion.div
            key="chat-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{
              maxWidth: 580,
              margin: '0 auto',
              background: isDark ? '#0B132B' : '#FFFFFF',
              color: isDark ? '#F8FAFC' : '#0F172A',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              boxShadow: '0 -16px 48px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Top Bar Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                background: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(20px)',
              }}
            >
              {/* Driver Identity */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ position: 'relative' }}>
                  {driver?.fotoUrl ? (
                    <img
                      src={driver.fotoUrl}
                      alt={driver.nombre}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #007AFF' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #007AFF, #00C6FF)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: 15,
                        boxShadow: '0 4px 12px rgba(0,122,255,0.3)',
                      }}
                    >
                      {driver ? (driver.initials || getInitials(driver.nombre)) : 'RP'}
                    </div>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      background: '#10B981',
                      border: '2px solid #FFFFFF',
                    }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, fontFamily: "'Syne', sans-serif" }}>
                      {driver?.nombre || 'Carlos Martínez'}
                    </span>
                    <ShieldCheck size={15} color="#007AFF" />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: 12, color: '#10B981', fontWeight: 700 }}>
                      En línea · En camino a tu entrega
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Phone & Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {driverPhone && (
                  <a
                    href={`tel:${driverPhone}`}
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
                    title={`Llamar (${driverPhone})`}
                  >
                    <Phone size={17} />
                  </a>
                )}

                <button
                  onClick={handleClose}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                    color: isDark ? '#94A3B8' : '#64748B',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px 18px',
                display: 'flex',
                flexDirection: 'column',
                background: isDark ? '#080E21' : '#F8FAFC',
              }}
            >
              {loading && messages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8', fontSize: 13 }}>
                  Conectando con el repartidor...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px 0', textAlign: 'center', gap: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0, 122, 255, 0.12)', color: '#007AFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageSquare size={22} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
                    Chat en vivo activado
                  </div>
                  <div style={{ fontSize: 12, color: '#94A3B8', maxWidth: 260 }}>
                    Comunícate con tu repartidor para darle indicaciones de llegada o referencias.
                  </div>
                </div>
              ) : (
                messages.map((m) => (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    isClient={m.emisor === 'cliente'}
                    isDark={isDark}
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Section: Quick Replies & Input */}
            <div
              style={{
                borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                background: isDark ? 'rgba(15, 23, 42, 0.95)' : '#FFFFFF',
                padding: '10px 16px',
                paddingBottom: 'max(14px, env(safe-area-inset-bottom, 14px))',
              }}
            >
              {/* Quick Reply Chips */}
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {QUICK_REPLIES.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickReply(text)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 99,
                      border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0',
                      background: isDark ? 'rgba(30, 41, 59, 0.7)' : '#F8FAFC',
                      color: isDark ? '#E2E8F0' : '#334155',
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

              {/* Input & Send Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje al repartidor..."
                  rows={1}
                  style={{
                    flex: 1,
                    resize: 'none',
                    padding: '10px 14px',
                    borderRadius: 14,
                    border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid #CBD5E1',
                    background: isDark ? '#1E293B' : '#F8FAFC',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontSize: 14,
                    outline: 'none',
                    maxHeight: 80,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: 'none',
                    background: input.trim() ? '#007AFF' : 'rgba(148, 163, 184, 0.2)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: input.trim() ? '0 4px 14px rgba(0,122,255,0.4)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                  title="Enviar mensaje"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
