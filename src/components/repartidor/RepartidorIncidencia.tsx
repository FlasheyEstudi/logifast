'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Wrench,
  UserX,
  AlertOctagon,
  MoreHorizontal,
  AlertTriangle,
  Send,
} from 'lucide-react';
import { useRepartidorStore, type TipoIncidencia } from '@/lib/repartidor-store';
import { useRepartidorSnackbar } from './RepartidorShell';

/* ═══════════════════════════════════════════════
   TIPO CONFIG
   ═══════════════════════════════════════════════ */

interface TipoOpcion {
  key: TipoIncidencia;
  label: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

const TIPO_OPCIONES: TipoOpcion[] = [
  {
    key: 'mecanica',
    label: 'Falla mecánica',
    desc: 'Problema con la moto',
    icon: <Wrench size={20} />,
    color: 'var(--warning, #FFB300)',
  },
  {
    key: 'cliente',
    label: 'Cliente',
    desc: 'Problema con el cliente',
    icon: <UserX size={20} />,
    color: 'var(--info, #2979FF)',
  },
  {
    key: 'accidente',
    label: 'Accidente',
    desc: 'Colisión o caída',
    icon: <AlertOctagon size={20} />,
    color: 'var(--peligro, #FF1744)',
  },
  {
    key: 'otro',
    label: 'Otro',
    desc: 'Otra situación',
    icon: <MoreHorizontal size={20} />,
    color: 'var(--text-muted)',
  },
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function RepartidorIncidencia() {
  const { ordenActiva, toggleIncidencia, reportarIncidencia } = useRepartidorStore();
  const showSnackbar = useRepartidorSnackbar();
  const [tipo, setTipo] = useState<TipoIncidencia | null>(null);
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = () => {
    if (!tipo) {
      showSnackbar({ message: 'Selecciona el tipo de incidencia.' });
      return;
    }
    if (!descripcion.trim()) {
      showSnackbar({ message: 'Agrega una descripción de la incidencia.' });
      return;
    }
    reportarIncidencia(tipo, descripcion.trim());
    showSnackbar({
      message: 'Incidencia reportada. El administrador ha sido notificado.',
    });
    setTipo(null);
    setDescripcion('');
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => toggleIncidencia(false)}
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
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          maxHeight: '90vh',
          zIndex: 9991,
          background: 'var(--md-surface)',
          borderRadius: '24px 24px 0 0',
          boxShadow: 'var(--lf-shadow-sheet)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
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
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'var(--md-outline-variant)',
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
            borderBottom: '1px solid var(--md-outline-variant)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--peligro, #FF1744) 14%, transparent)',
              color: 'var(--peligro, #FF1744)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              className="font-syne"
              style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}
            >
              Reportar incidencia
            </div>
            {ordenActiva && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Orden {ordenActiva.id}
              </div>
            )}
          </div>
          <button
            onClick={() => toggleIncidencia(false)}
            aria-label="Cerrar"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: 'none',
              background: 'var(--md-surface-variant)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
          }}
        >
          {/* Warning banner */}
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: 'color-mix(in srgb, var(--warning, #FFB300) 10%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warning, #FFB300) 30%, transparent)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <AlertTriangle size={16} color="var(--warning, #FFB300)" style={{ flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              La orden cambiará a incidencia y el admin será notificado. Solo reporta si es
              necesario.
            </div>
          </div>

          {/* Tipo selector */}
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Tipo de incidencia
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              marginBottom: 16,
            }}
          >
            {TIPO_OPCIONES.map((op) => {
              const isActive = tipo === op.key;
              return (
                <motion.button
                  key={op.key}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setTipo(op.key)}
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: isActive
                      ? `color-mix(in srgb, var(--primario) 8%, transparent)`
                      : 'var(--md-surface-variant)',
                    border: `1.5px solid ${isActive ? 'var(--primario)' : 'transparent'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 8,
                    textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: isActive
                        ? 'var(--primario)'
                        : `color-mix(in srgb, ${op.color} 14%, transparent)`,
                      color: isActive ? '#fff' : op.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {op.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: 'var(--text)',
                      }}
                    >
                      {op.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{op.desc}</div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 8,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Descripción
          </div>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe qué ocurrió…"
            rows={4}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 14,
              border: '1px solid var(--md-outline-variant)',
              background: 'var(--md-surface-variant)',
              color: 'var(--text)',
              fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              resize: 'none',
              outline: 'none',
              minHeight: 100,
            }}
          />
        </div>

        {/* Submit */}
        <div
          style={{
            padding: 12,
            borderTop: '1px solid var(--md-outline-variant)',
            background: 'var(--md-surface)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!tipo || !descripcion.trim()}
            style={{
              width: '100%',
              minHeight: 52,
              borderRadius: 16,
              border: 'none',
              background:
                tipo && descripcion.trim()
                  ? 'var(--peligro, #FF1744)'
                  : 'var(--md-outline-variant)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: "'DM Sans', sans-serif",
              cursor: tipo && descripcion.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Send size={18} />
            Enviar reporte
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
