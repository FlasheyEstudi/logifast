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
} from '@/components/icons';
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
    color: 'var(--warning, var(--warning))',
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
    color: 'var(--peligro, var(--peligro))',
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
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
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
          zIndex: 1000000,
          background: 'var(--surface)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -12px 48px rgba(0,0,0,0.3)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          color: 'var(--text)',
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
              background: 'var(--border)',
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
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: 'rgba(255, 59, 48, 0.15)',
              color: '#FF3B30',
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
              background: 'var(--surface-variant, color-mix(in srgb, var(--surface) 90%, var(--text) 10%))',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginBottom: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}
          >
            Tipo de problema
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
                  className="lf-card"
                  style={{
                    padding: 14,
                    borderRadius: 14,
                    background: isActive
                      ? 'color-mix(in srgb, var(--primario) 16%, var(--surface))'
                      : 'var(--surface-variant, color-mix(in srgb, var(--surface) 94%, var(--text) 6%))',
                    border: `1.5px solid ${isActive ? 'var(--primario)' : 'var(--border)'}`,
                    boxShadow: isActive ? '0 4px 16px color-mix(in srgb, var(--primario) 30%, transparent)' : 'none',
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
            className="lf-textarea"
            style={{
              width: '100%',
              padding: 14,
              borderRadius: 14,
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text)',
              fontSize: 15,
              fontFamily: "'DM Sans', sans-serif",
              resize: 'vertical',
              outline: 'none',
              minHeight: 110,
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}
          />
        </div>

        {/* Submit */}
        <div
          style={{
            padding: 12,
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!tipo || !descripcion.trim()}
            className="lf-btn lf-btn-danger lf-btn-block lf-btn-lg"
            style={{
              width: '100%',
              minHeight: 52,
              borderRadius: 16,
              border: 'none',
              background:
                tipo && descripcion.trim()
                  ? '#FF3B30'
                  : 'var(--surface-variant, rgba(0, 0, 0, 0.12))',
              color: tipo && descripcion.trim() ? '#fff' : 'var(--text-muted)',
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
