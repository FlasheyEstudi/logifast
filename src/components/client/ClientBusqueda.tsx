'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';

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
        background: 'var(--md-surface)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Search header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--md-outline-variant)',
        }}
      >
        <Search size={22} style={{ color: 'var(--md-on-surface-variant)', flexShrink: 0 }} />
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
            color: 'var(--md-on-surface)',
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
            borderRadius: 16,
            background: 'var(--md-primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--md-on-primary-container)',
          }}
        >
          <Search size={28} />
        </div>
        <p style={{ color: 'var(--md-on-surface-variant)', fontSize: 14, textAlign: 'center' }}>
          {query ? `Sin resultados para "${query}"` : 'Escribe para buscar'}
        </p>
      </div>
    </motion.div>
  );
}
