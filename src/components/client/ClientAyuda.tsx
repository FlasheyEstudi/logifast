'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, X, MessageCircle, Phone, Mail, ChevronRight } from '@/components/icons';

interface ClientAyudaProps {
  isDark?: boolean;
  onClose?: () => void;
}

const HELP_ITEMS = [
  { icon: <MessageCircle size={20} color="#007AFF" />, title: 'Chat en vivo con Soporte', desc: 'Habla con un agente 24/7' },
  { icon: <Phone size={20} color="#34C759" />, title: 'Llámanos', desc: '+505 2222-7777 (Atención directa)' },
  { icon: <Mail size={20} color="#FF9500" />, title: 'Correo electrónico', desc: 'soporte@logifast.com' },
];

const FAQ_ITEMS = [
  { q: '¿Cómo rastreo mi envío en tiempo real?', a: 'Ve a la sección Mis Envíos y presiona en la tarjeta activa para ver el mapa 3D con la posición GPS del repartidor.' },
  { q: '¿Puedo cancelar un pedido?', a: 'Sí, siempre que el repartidor no haya recogido el paquete o confirmado la orden en la tienda.' },
  { q: '¿Cómo aplico un código promocional?', a: 'En tu Carrito de Compras o al solicitar un envío, ingresa el código en el campo correspondiente.' },
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
        background: '#0B0E14',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
        color: '#F8FAFC',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 20px',
          background: 'rgba(19, 24, 34, 0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            background: 'rgba(255, 255, 255, 0.08)',
            color: '#F8FAFC',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#F8FAFC' }}>
          Centro de Ayuda & Soporte
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
        {/* Contact options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {HELP_ITEMS.map((item, i) => (
            <button
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                background: 'rgba(30, 41, 59, 0.8)',
                backdropFilter: 'blur(16px)',
                color: '#F8FAFC',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                textAlign: 'left',
                width: '100%',
              }}
            >
              <div>{item.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#F8FAFC' }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 2 }}>{item.desc}</div>
              </div>
              <ChevronRight size={18} style={{ color: '#94A3B8' }} />
            </button>
          ))}
        </div>

        {/* FAQ */}
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#F8FAFC', marginBottom: 14 }}>
          Preguntas Frecuentes
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQ_ITEMS.map((faq, i) => (
            <div
              key={i}
              style={{
                padding: '16px 18px',
                borderRadius: 20,
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14, color: '#F8FAFC', marginBottom: 6 }}>
                {faq.q}
              </div>
              <div style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.4 }}>
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
