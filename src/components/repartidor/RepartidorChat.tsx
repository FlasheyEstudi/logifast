'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Phone, MessageSquare, Zap } from '@/components/icons';
import { useRepartidorStore, type ChatMensaje } from '@/lib/repartidor-store';
import { realtime } from '@/services/realtime';

/* ═══════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════ */

const MENSAJES_RAPIDOS = [
  'Voy en camino a la dirección',
  'Ya estoy afuera en el punto',
  'Un momento por favor, hay tráfico',
  'No logro encontrar la dirección exacta',
  'Por favor llámame cuando puedas',
];

export default function RepartidorChat() {
  const {
    chatOrdenId,
    ordenActiva,
    toggleChat,
  } = useRepartidorStore();

  const [input, setInput] = useState('');
  const [mostrarRapidos, setMostrarRapidos] = useState(false);
  const [mensajes, setMensajes] = useState<ChatMensaje[]>([]);
  const [clienteData, setClienteData] = useState<{ nombre: string; telefono: string } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const ordenIdActiva = chatOrdenId || ordenActiva?.id;

  // Load chat messages and client details from API
  const loadChat = useCallback(async () => {
    if (!ordenIdActiva) return;
    try {
      const res = await fetch(`/api/repartidor/chat?ordenId=${ordenIdActiva}`);
      if (res.ok) {
        const data = await res.json();
        if (data.mensajes) {
          setMensajes(data.mensajes);
        }
        if (data.cliente) {
          setClienteData({
            nombre: data.cliente.nombre || ordenActiva?.cliente || 'Cliente',
            telefono: data.cliente.telefono || ordenActiva?.clienteTelefono || '',
          });
        }
      }
    } catch (err) {
      console.warn('[RepartidorChat load error]', err);
    }
  }, [ordenIdActiva, ordenActiva]);

  useEffect(() => {
    loadChat();
    const interval = setInterval(loadChat, 4000);
    return () => clearInterval(interval);
  }, [loadChat]);

  /* Auto-scroll to bottom on new message */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [mensajes.length]);

  const handleSend = async (customText?: string) => {
    const text = (customText || input).trim();
    if (!text || !ordenIdActiva) return;

    const timeNow = new Date().toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit', hour12: false });
    const localId = `rep-${Date.now()}`;

    // Optimistic UI update
    const nuevoMensaje: ChatMensaje = {
      id: localId,
      ordenId: ordenIdActiva,
      emisor: 'repartidor',
      contenido: text,
      enviadoEn: timeNow,
    };
    setMensajes((prev) => [...prev, nuevoMensaje]);
    if (!customText) setInput('');

    // Emit via WebSocket
    realtime.chatMensaje(ordenIdActiva, 'repartidor', text);

    // Save to database
    try {
      const res = await fetch('/api/repartidor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ordenId: ordenIdActiva, contenido: text, emisor: 'repartidor' }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.mensaje) {
          setMensajes((prev) => prev.map((m) => (m.id === localId ? data.mensaje : m)));
        }
      }
    } catch (err) {
      console.error('[RepartidorChat send error]', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clienteNombre = clienteData?.nombre || ordenActiva?.cliente || 'Cliente';
  const clienteTelefono = clienteData?.telefono || ordenActiva?.clienteTelefono || '';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => toggleChat()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9990,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Bottom Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
        className="lf-bottom-sheet open bottom-sheet open"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          margin: '0 auto',
          width: '100%',
          maxWidth: 500,
          maxHeight: '88vh',
          zIndex: 9991,
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          color: '#F8FAFC',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            paddingTop: 10,
            paddingBottom: 4,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            className="lf-sheet-handle bottom-sheet-handle"
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.25)',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 16px 14px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(0, 122, 255, 0.15)',
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {clienteNombre}
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              {ordenIdActiva ? `Orden #${ordenIdActiva.slice(-6).toUpperCase()}` : 'Chat en vivo'}
            </div>
          </div>

          {/* Call client directly */}
          {clienteTelefono ? (
            <a
              href={`tel:${clienteTelefono}`}
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'rgba(52, 199, 89, 0.18)',
                color: '#34C759',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
              title={`Llamar a ${clienteNombre} (${clienteTelefono})`}
            >
              <Phone size={17} />
            </a>
          ) : null}

          {/* Close button */}
          <button
            onClick={() => toggleChat()}
            aria-label="Cerrar chat"
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              border: 'none',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages list */}
        <div
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            maxHeight: 'calc(85vh - 140px)',
            minHeight: 220,
            background: 'rgba(15, 23, 42, 0.65)',
          }}
        >
          {mensajes.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                color: '#94A3B8',
                fontSize: 13,
                textAlign: 'center',
                padding: '30px 0',
              }}
            >
              <MessageSquare size={32} color="#64748B" />
              <div>No hay mensajes aún. Inicia la conversación con el cliente.</div>
            </div>
          ) : (
            mensajes.map((m) => {
              const isRepartidor = m.emisor === 'repartidor';
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex',
                    justifyContent: isRepartidor ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: 18,
                      borderBottomRightRadius: isRepartidor ? 4 : 18,
                      borderBottomLeftRadius: isRepartidor ? 18 : 4,
                      background: isRepartidor ? '#007AFF' : 'rgba(30, 41, 59, 0.95)',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    <div style={{ fontSize: 14, lineHeight: 1.4 }}>{m.contenido}</div>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        color: isRepartidor ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                        textAlign: isRepartidor ? 'right' : 'left',
                        marginTop: 3,
                      }}
                    >
                      {m.enviadoEn}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Mensajes rápidos */}
        {mostrarRapidos && (
          <div
            className="chat-rapidos"
            style={{
              display: 'flex',
              gap: 8,
              padding: '10px 16px',
              overflowX: 'auto',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(15, 23, 42, 0.95)',
              flexShrink: 0,
              scrollbarWidth: 'none',
            }}
          >
            {MENSAJES_RAPIDOS.map((msg, i) => (
              <button
                key={i}
                onClick={() => {
                  handleSend(msg);
                  setMostrarRapidos(false);
                }}
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  borderRadius: 100,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(30, 41, 59, 0.9)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#E2E8F0',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {msg}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div
          className="chat-input-area lf-chat-input-area"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'rgba(15, 23, 42, 0.98)',
          }}
        >
          {clienteTelefono ? (
            <a
              href={`tel:${clienteTelefono}`}
              aria-label="Llamar al cliente"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                border: '1px solid rgba(52, 199, 89, 0.3)',
                background: 'rgba(52, 199, 89, 0.15)',
                color: '#34C759',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                textDecoration: 'none',
              }}
              title={`Llamar a ${clienteNombre}`}
            >
              <Phone size={17} />
            </a>
          ) : null}

          <button
            onClick={() => setMostrarRapidos(!mostrarRapidos)}
            aria-label="Mensajes rápidos"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: mostrarRapidos ? '#007AFF' : 'rgba(255, 255, 255, 0.08)',
              color: mostrarRapidos ? '#FFFFFF' : '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Zap size={17} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje al cliente…"
            className="chat-input lf-chat-input"
            style={{
              flex: 1,
              minHeight: 44,
              padding: '0 16px',
              borderRadius: 22,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#F8FAFC',
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              outline: 'none',
            }}
          />

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleSend()}
            disabled={!input.trim()}
            aria-label="Enviar mensaje"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: input.trim() ? '#007AFF' : 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Send size={18} />
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
