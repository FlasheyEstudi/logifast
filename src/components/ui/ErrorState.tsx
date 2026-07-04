'use client';

import React from 'react';

interface ErrorStateProps {
  tipo: 'conexion' | 'servidor' | 'no-encontrado' | 'permiso' | 'timeout';
  onRetry?: () => void;
  onAction?: () => void;
  actionLabel?: string;
}

const ERRORES = {
  conexion: {
    titulo: 'Sin conexión',
    desc: 'No pudimos conectarnos al servidor. Verifica tu internet.',
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      </svg>
    )
  },
  servidor: {
    titulo: 'Error del servidor',
    desc: 'Algo salió mal de nuestro lado. Intenta en unos minutos.',
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
        <line x1="6" y1="6" x2="6.01" y2="6"/>
        <line x1="6" y1="18" x2="6.01" y2="18"/>
      </svg>
    )
  },
  'no-encontrado': {
    titulo: 'No encontrado',
    desc: 'Lo que buscas no existe o ya no está disponible.',
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M16 16s-1.5-2-4-2-4 2-4 2"/>
        <line x1="9" y1="9" x2="9.01" y2="9"/>
        <line x1="15" y1="9" x2="15.01" y2="9"/>
      </svg>
    )
  },
  permiso: {
    titulo: 'Sin permiso',
    desc: 'No tienes acceso a esta funcionalidad.',
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )
  },
  timeout: {
    titulo: 'Tiempo agotado',
    desc: 'La operación tardó demasiado. Intenta de nuevo.',
    icono: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )
  }
};

export default function ErrorState({ tipo, onRetry, onAction, actionLabel }: ErrorStateProps) {
  const error = ERRORES[tipo] || ERRORES.conexion;

  return (
    <div className="error-state">
      <div className="error-state-icono">
        {error.icono}
      </div>
      <h3 className="error-state-titulo">{error.titulo}</h3>
      <p className="error-state-desc">{error.desc}</p>
      <div className="error-state-acciones" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 220, margin: '0 auto' }}>
        {onRetry && (
          <button className="lf-btn lf-btn-primary lf-btn-block" onClick={onRetry} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Intentar de nuevo
          </button>
        )}
        {onAction && (
          <button className="lf-btn lf-btn-secondary lf-btn-block" onClick={onAction}>
            {actionLabel || 'Ir al inicio'}
          </button>
        )}
      </div>
    </div>
  );
}
