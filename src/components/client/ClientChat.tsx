'use client';

/* eslint-disable react-hooks/preserve-manual-memoization */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Send, Check, CheckCheck } from '@/components/icons';
import { useStore, type ChatMessage } from '@/lib/store';
import { realtime, onRealtimeEvent } from '@/services/realtime';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientChatProps {
  isDark: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const QUICK_REPLIES = [
  '¿Ya vienes en camino?',
  '¿Cuánto tiempo falta?',
  'Estoy en la puerta esperándote',
  '¡Muchas gracias!',
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

function hapticTap() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch {}
  }
}

/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex justify-start mb-1"
    >
      <div className="chat-bubble-other px-5 py-3 flex items-center gap-[5px]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-[7px] h-[7px] rounded-full"
            style={{ background: 'var(--text-muted)' }}
            animate={{ y: [0, -5, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`flex ${isClient ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div className="max-w-[80%] relative">
        <div
          className={`px-4 py-2.5 text-[14px] leading-relaxed break-words ${isClient ? 'chat-bubble-self' : 'chat-bubble-other'}`}
          style={{
            color: isClient ? '#FFFFFF' : 'var(--text)',
            background: isClient ? 'var(--primario, #007AFF)' : isDark ? '#1E293B' : '#F1F5F9',
            borderRadius: isClient ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            fontFamily: "'DM Sans', sans-serif",
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
            marginTop: 2,
            paddingLeft: isClient ? 0 : 4,
            paddingRight: isClient ? 4 : 0,
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          <span>{msg.enviadoEn}</span>
          {isClient && (
            msg.leido ? (
              <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Check className="w-3.5 h-3.5 opacity-60" />
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
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

  // Load chat history and real driver data
  const loadChatData = useCallback(async () => {
    if (!chatOrderId) return;
    try {
      const res = await fetch(`/api/repartidor/chat?ordenId=${chatOrderId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.mensajes) {
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
    loadChatData();
    const interval = setInterval(loadChatData, 5000);
    return () => clearInterval(interval);
  }, [loadChatData]);

  // Fallback driver info from local store if backend did not return it yet
  useEffect(() => {
    if (!driver && chatOrderId) {
      const foundOrder = orders.find((o) => o.id === chatOrderId);
      if (foundOrder && foundOrder.repartidor && foundOrder.repartidor !== 'Sin asignar') {
        setDriver({
          id: 'rep-assigned',
          nombre: foundOrder.repartidor,
          telefono: (foundOrder as any).repartidorTelefono || '',
          fotoUrl: null,
          initials: foundOrder.repartidorInitials || getInitials(foundOrder.repartidor),
          color: 'var(--primario, #007AFF)',
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
          hapticTap();
        }
      }
    });

    return () => {
      cleanup();
    };
  }, [chatOrderId]);

  // Auto-scroll on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  // Textarea auto-resize
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 96) + 'px';
    }
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || !chatOrderId) return;

    hapticTap();
    const timeNow = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });
    const localId = `loc-${Date.now()}`;

    // Optimistic update
    const optimisticMsg = {
      id: localId,
      ordenId: chatOrderId,
      emisor: 'cliente',
      contenido: trimmed,
      enviadoEn: timeNow,
      leido: false,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Emit via WebSocket & POST to backend API
    realtime.chatMensaje(chatOrderId, 'cliente', trimmed);

    try {
      const res = await fetch('/api/repartidor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId: chatOrderId, contenido: trimmed, emisor: 'cliente' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mensaje) {
          setMessages((prev) => prev.map((m) => (m.id === localId ? { ...data.mensaje, id: data.mensaje.id } : m)));
        }
      }
    } catch (err) {
      console.error('[ClientChat send error]', err);
    }
  }, [input, chatOrderId]);

  // Quick reply
  const handleQuickReply = useCallback(
    (text: string) => {
      if (!chatOrderId) return;
      hapticTap();
      const timeNow = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });
      const localId = `loc-${Date.now()}`;

      setMessages((prev) => [
        ...prev,
        { id: localId, ordenId: chatOrderId, emisor: 'cliente', contenido: text, enviadoEn: timeNow, leido: false },
      ]);

      realtime.chatMensaje(chatOrderId, 'cliente', text);

      fetch('/api/repartidor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId: chatOrderId, contenido: text, emisor: 'cliente' }),
      }).catch((err) => console.error('[Quick reply error]', err));
    },
    [chatOrderId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleClose = useCallback(() => {
    setChatOpen(false);
    onClose();
  }, [setChatOpen, onClose]);

  const driverPhone = driver?.telefono || '';

  return (
    <AnimatePresence>
      {chatOpen && (
        <>
          {/* Backdrop */}
          <div
            className="bottom-sheet-overlay visible fixed inset-0 z-40"
            onClick={handleClose}
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          />

          {/* Chat Sheet */}
          <motion.div
            key="chat-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-0 z-50 flex flex-col lf-bottom-sheet open"
            style={{
              background: 'var(--surface, #0F172A)',
              color: 'var(--text, #F8FAFC)',
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              boxShadow: '0 -12px 48px rgba(0,0,0,0.4)',
              maxHeight: '100vh',
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3"
              style={{
                background: 'color-mix(in srgb, var(--surface) 92%, transparent)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderBottom: '1px solid var(--border, rgba(255,255,255,0.1))',
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
              }}
            >
              {/* Driver Avatar */}
              {driver?.fotoUrl ? (
                <img
                  src={driver.fotoUrl}
                  alt={driver.nombre}
                  className="w-10 h-10 rounded-full object-cover shrink-0 border border-white/20"
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md"
                  style={{ background: driver?.color || 'var(--primario, #007AFF)' }}
                >
                  {driver ? (driver.initials || getInitials(driver.nombre)) : 'RP'}
                </div>
              )}

              {/* Driver Name & Status */}
              <div className="flex-1 min-w-0">
                <span
                  className="font-bold text-[15px] truncate block"
                  style={{
                    color: 'var(--text)',
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {driver?.nombre || 'Repartidor asignado'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`w-[7px] h-[7px] rounded-full shrink-0 ${isOrderActive ? 'bg-green-500' : 'bg-gray-400'}`}
                  />
                  <span className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                    {isOrderActive ? 'En camino a tu entrega' : 'Servicio finalizado'}
                  </span>
                </div>
              </div>

              {/* Phone call button */}
              {driverPhone ? (
                <a
                  href={`tel:${driverPhone}`}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{ background: 'rgba(52,199,89,0.18)', color: '#34C759' }}
                  aria-label={`Llamar al repartidor (${driverPhone})`}
                  title={`Llamar al repartidor (${driverPhone})`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              ) : null}

              {/* Close button */}
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors active:scale-90"
                style={{
                  background: 'var(--bg-alt, rgba(255,255,255,0.08))',
                  color: 'var(--text-muted)',
                }}
                aria-label="Cerrar chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
              style={{
                minHeight: 250,
                background: isDark ? 'rgba(15,23,42,0.6)' : 'var(--bg, #F8FAFC)',
              }}
            >
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full py-16 text-[13px] text-gray-400">
                  Cargando mensajes del pedido...
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center text-gray-400 gap-2">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Send className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium">Inicia la conversación con tu repartidor</p>
                  <span className="text-xs text-gray-500">Coordina la entrega o detalles de tu dirección</span>
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

            {/* Quick Replies & Input */}
            <div
              className="sticky bottom-0 z-10"
              style={{
                background: 'color-mix(in srgb, var(--surface) 95%, transparent)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--border, rgba(255,255,255,0.1))',
                paddingBottom: 'max(env(safe-area-inset-bottom, 12px), 12px)',
              }}
            >
              {/* Quick Replies Chips */}
              <div
                className="flex gap-2 px-4 pt-2.5 pb-1 overflow-x-auto"
                style={{ scrollbarWidth: 'none' }}
              >
                {QUICK_REPLIES.map((text) => (
                  <button
                    key={text}
                    onClick={() => handleQuickReply(text)}
                    className="shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all hover:opacity-80 active:scale-95 border"
                    style={{
                      borderColor: 'var(--border, rgba(255,255,255,0.15))',
                      background: isDark ? 'rgba(30,41,59,0.8)' : '#FFFFFF',
                      color: 'var(--text)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {text}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <div className="chat-input-area flex items-end gap-2 px-4 py-2.5">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje al repartidor..."
                  rows={1}
                  className="chat-input flex-1 resize-none px-4 py-2.5 text-[14px] outline-none rounded-2xl border"
                  style={{
                    background: isDark ? 'rgba(30,41,59,0.8)' : '#FFFFFF',
                    borderColor: 'var(--border, rgba(255,255,255,0.15))',
                    color: 'var(--text)',
                    maxHeight: 96,
                  }}
                />
                <motion.button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  whileTap={{ scale: 0.92 }}
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-opacity"
                  style={{
                    background: input.trim() ? 'var(--primario, #007AFF)' : 'rgba(255,255,255,0.15)',
                    color: '#FFFFFF',
                    cursor: input.trim() ? 'pointer' : 'not-allowed',
                    opacity: input.trim() ? 1 : 0.5,
                  }}
                  aria-label="Enviar mensaje"
                >
                  <Send className="w-[18px] h-[18px]" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
