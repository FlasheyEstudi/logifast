'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Phone, MessageSquare, Zap } from '@/components/icons';
import { useRepartidorStore, type ChatMensaje } from '@/lib/repartidor-store';

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

const MENSAJES_RAPIDOS = [
  'Estoy llegando',
  'Ya estoy aquí',
  'Un momento por favor',
  'No encuentro la dirección',
  'Llame por favor'
];

export default function RepartidorChat() {
  const {
    mensajes,
    chatOrdenId,
    ordenActiva,
    toggleChat,
    enviarMensaje,
  } = useRepartidorStore();

  const [input, setInput] = useState('');
  const [mostrarRapidos, setMostrarRapidos] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const ordenIdActiva = chatOrdenId || ordenActiva?.id;
  const clienteNombre = ordenActiva?.cliente || 'Cliente';
  const mensajesFiltrados: ChatMensaje[] = ordenIdActiva
    ? mensajes.filter((m) => m.ordenId === ordenIdActiva)
    : mensajes;

  /* Auto-scroll to bottom on new message */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [mensajesFiltrados.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    enviarMensaje(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Sheet */}
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
          maxWidth: 480,
          maxHeight: '85vh',
          zIndex: 9991,
          background: 'rgba(15, 23, 42, 0.95)',
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
            paddingTop: 8,
            paddingBottom: 4,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <div
            className="lf-sheet-handle bottom-sheet-handle"
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '8px 16px 12px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'rgba(0, 122, 255, 0.15)',
              color: '#007AFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MessageSquare size={18} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {clienteNombre}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {ordenIdActiva ? `Orden ${ordenIdActiva}` : 'Chat'}
            </div>
          </div>
          <button
            onClick={() => toggleChat()}
            aria-label="Cerrar chat"
            style={{
              width: 36,
              height: 36,
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
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxHeight: 'calc(85vh - 130px)',
            minHeight: 200,
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          {mensajesFiltrados.length === 0 && (
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
              }}
            >
              <MessageSquare size={28} color="#94A3B8" />
              <div>No hay mensajes aún. Inicia la conversación.</div>
            </div>
          )}
          {mensajesFiltrados.map((m) => {
            const isRepartidor = m.emisor === 'repartidor';
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  display: 'flex',
                  justifyContent: isRepartidor ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  className={isRepartidor ? 'chat-bubble-self lf-chat-bubble-self' : 'chat-bubble-other lf-chat-bubble-other'}
                  style={{
                    maxWidth: '78%',
                    padding: '10px 14px',
                    borderRadius: 18,
                    borderBottomRightRadius: isRepartidor ? 4 : 18,
                    borderBottomLeftRadius: isRepartidor ? 18 : 4,
                    background: isRepartidor ? '#007AFF' : 'rgba(30, 41, 59, 0.9)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div>{m.contenido}</div>
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      color: isRepartidor ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                      textAlign: isRepartidor ? 'right' : 'left',
                      marginTop: 2,
                    }}
                  >
                    {m.enviadoEn}
                  </div>
                </div>
              </motion.div>
            );
          })}
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
              background: 'rgba(15, 23, 42, 0.9)',
              flexShrink: 0,
              scrollbarWidth: 'none',
            }}
          >
            {MENSAJES_RAPIDOS.map((msg, i) => (
              <button
                key={i}
                onClick={() => {
                  enviarMensaje(msg);
                  setMostrarRapidos(false);
                }}
                style={{
                  flexShrink: 0,
                  padding: '8px 16px',
                  borderRadius: 100,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'rgba(30, 41, 59, 0.8)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#CBD5E1',
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
            background: 'rgba(15, 23, 42, 0.95)',
          }}
        >
          <button
            onClick={() => {
              if (ordenActiva?.clienteTelefono) {
                window.open(`tel:${ordenActiva.clienteTelefono}`);
              }
            }}
            aria-label="Llamar"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#34C759',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Phone size={16} />
          </button>
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
            <Zap size={16} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un mensaje…"
            className="chat-input lf-chat-input"
            style={{
              flex: 1,
              minHeight: 44,
              padding: '0 18px',
              borderRadius: 22,
              border: '1px solid rgba(255, 255, 255, 0.15)',
              background: 'rgba(30, 41, 59, 0.8)',
              color: '#F8FAFC',
              fontSize: 15,
              fontFamily: "'DM Sans', sans-serif",
              outline: 'none',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSend}
            disabled={!input.trim()}
            aria-label="Enviar mensaje"
            className="chat-send-btn lf-chat-send-btn"
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: input.trim() ? '#007AFF' : 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
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
