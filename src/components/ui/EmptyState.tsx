'use client';

import React from 'react';

interface EmptyStateProps {
  icono: React.ReactNode;
  titulo: string;
  descripcion: string;
  accion?: {
    label: string;
    onClick: () => void;
  };
  secundaria?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ icono, titulo, descripcion, accion, secundaria }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state-icono">
        {icono}
      </div>
      <h3 className="empty-state-titulo">{titulo}</h3>
      <p className="empty-state-desc">{descripcion}</p>
      <div className="empty-state-acciones" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 200, margin: '0 auto' }}>
        {accion && (
          <button className="lf-btn lf-btn-primary lf-btn-block" onClick={accion.onClick}>
            {accion.label}
          </button>
        )}
        {secundaria && (
          <button className="lf-btn lf-btn-ghost lf-btn-block" onClick={secundaria.onClick}>
            {secundaria.label}
          </button>
        )}
      </div>
    </div>
  );
}
