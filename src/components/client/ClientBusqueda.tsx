'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from '@/components/icons';

interface ClientBusquedaProps {
  isDark?: boolean;
  onClose?: () => void;
}

export default function ClientBusqueda({ onClose }: ClientBusquedaProps) {
  const [query, setQuery] = React.useState('');

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
      {/* Search header */}
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
        <Search size={22} style={{ color: '#007AFF', flexShrink: 0 }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar tiendas, productos, direcciones…"
          autoFocus
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: '#F8FAFC',
            fontSize: 16,
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
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
      </div>

      {/* Empty state */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          gap: 12,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: 'rgba(0, 122, 255, 0.15)',
            border: '1px solid rgba(0, 122, 255, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#007AFF',
          }}
        >
          <Search size={28} />
        </div>
        <p style={{ color: '#94A3B8', fontSize: 14, textAlign: 'center' }}>
          {query ? `Sin resultados para "${query}"` : 'Escribe para buscar tiendas o productos'}
        </p>
      </div>
    </motion.div>
  );
}
