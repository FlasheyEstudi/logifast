'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Phone, MessageSquare } from '@/components/icons';
import { useRepartidorStore, type ChatMensaje } from '@/lib/repartidor-store';

const MENSAJES_RAPIDOS = [
  'Estoy llegando al punto',
  'Ya me encuentro afuera',
  'Un momento por favor',
  'Llámame si no me ves',
];

export default function RepartidorChat() {
  const {
    mensajes = [],
    chatOrdenId,
    ordenActiva,
    toggleChat,
    enviarMensaje,
  } = useRepartidorStore();

  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const ordenIdActiva = chatOrdenId || ordenActiva?.id;
  const clienteNombre = ordenActiva?.cliente || 'Cliente LogiFast';

  const mensajesFiltrados: ChatMensaje[] = ordenIdActiva
    ? mensajes.filter((m) => m.ordenId === ordenIdActiva)
    : mensajes;

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [mensajesFiltrados.length]);

  const handleSend = (texto?: string) => {
    const msg = (texto || input).trim();
    if (!msg) return;
    enviarMensaje(msg);
    if (!texto) setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md h-[85vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top Header */}
        <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              {clienteNombre.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {clienteNombre}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Orden #{ordenIdActiva?.substring(0, 8) || 'ENV-102'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:+50588888888"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-200 transition-colors"
              title="Llamar al cliente"
            >
              <Phone size={18} />
            </a>
            <button
              onClick={() => toggleChat()}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Message List */}
        <div ref={listRef} className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/50">
          {mensajesFiltrados.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-1">
              <MessageSquare size={28} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p>Inicia la conversación con el cliente para coordinar la entrega.</p>
            </div>
          ) : (
            mensajesFiltrados.map((m) => {
              const isMe = m.emisor === 'repartidor';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs font-medium ${
                      isMe
                        ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/60 rounded-bl-none'
                    }`}
                  >
                    {m.contenido}
                  </div>
                  <span className="text-[10px] text-slate-400 px-1 mt-0.5">
                    {new Date(m.enviadoEn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Quick Response Chips */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {MENSAJES_RAPIDOS.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold whitespace-nowrap transition-colors border border-slate-200/60 dark:border-slate-700/50 flex-shrink-0"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Text Input Footer */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Escribe un mensaje al cliente..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50 font-sans"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-blue-600 disabled:opacity-50 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95 transition-all flex-shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
