'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, X, MessageCircle, Phone, Mail, ChevronRight } from 'lucide-react';

interface ClientAyudaProps {
  isDark?: boolean;
  onClose?: () => void;
}

const HELP_ITEMS = [
  { icon: <MessageCircle size={20} />, title: 'Chat en vivo', desc: 'Habla con un agente' },
  { icon: <Phone size={20} />, title: 'Llámanos', desc: '+52 800 123 4567' },
  { icon: <Mail size={20} />, title: 'Email', desc: 'soporte@logifast.com' },
];

const FAQ_ITEMS = [
  { q: '¿Cómo rastreo mi envío?', a: 'Ve a la sección Pedidos y selecciona el envío que quieres rastrear.' },
  { q: '¿Puedo cancelar un pedido?', a: 'Sí, siempre que el repartidor no haya recogido el paquete.' },
  { q: '¿Cómo aplico un código de descuento?', a: 'En el carrito, ingresa tu código en el campo "Código promocional".' },
];

export default function ClientAyuda({ onClose }: ClientAyudaProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9000,
        background: 'var(--md-surface)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        color: 'var(--md-on-surface)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--md-outline-variant)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 'none',
            background: 'transparent',
            color: 'var(--md-on-surface-variant)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18 }}>Ayuda</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Contact options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
          {HELP_ITEMS.map((item, i) => (
            <button
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 16,
                border: 'none',
                background: 'var(--md-surface-variant)',
                color: 'var(--md-on-surface)',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div style={{ color: 'var(--md-on-primary-container)' }}>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--md-on-surface-variant)', marginTop: 2 }}>{item.desc}</div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--md-on-surface-variant)' }} />
            </button>
          ))}
        </div>

        {/* FAQ */}
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, marginBottom: 12 }}>
          Preguntas frecuentes
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQ_ITEMS.map((item, i) => (
            <div
              key={i}
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: 'var(--md-surface-variant)',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{item.q}</div>
              <div style={{ fontSize: 13, color: 'var(--md-on-surface-variant)', lineHeight: 1.5 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
