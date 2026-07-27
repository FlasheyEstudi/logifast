'use client';

import React from 'react';

interface ErrorStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Error 404 — página no encontrada.
 * SVG ilustrado: caja perdida con signo de pregunta.
 */
export function NotFoundState({
  title = 'Página no encontrada',
  description = 'La página que buscas no existe o fue movida.',
  actionLabel = 'Volver al inicio',
  onAction,
  size = 'md',
}: ErrorStateProps) {
  const dim = { sm: 140, md: 200, lg: 280 }[size];
  return (
    <div className="lf-error-state">
      <svg width={dim} height={dim * 0.8} viewBox="0 0 200 160" fill="none">
        {/* Sombra */}
        <ellipse cx="100" cy="145" rx="60" ry="6" fill="rgba(0,0,0,0.08)" />
        {/* Caja */}
        <g className="lf-error-float">
          <path
            d="M60 60 L100 40 L140 60 L140 110 L100 130 L60 110 Z"
            fill="#FFE0B2"
            stroke="#FF5722"
            strokeWidth="2"
          />
          <path d="M60 60 L100 80 L140 60" stroke="#FF5722" strokeWidth="2" fill="none" />
          <path d="M100 80 L100 130" stroke="#FF5722" strokeWidth="2" />
          {/* Signo de pregunta */}
          <circle cx="100" cy="85" r="14" fill="#FF5722" />
          <text x="100" y="92" textAnchor="middle" fontSize="18" fontWeight="bold" fill="white">?</text>
        </g>
        {/* Líneas decorativas */}
        <g opacity="0.4">
          <line x1="30" y1="50" x2="40" y2="60" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
          <line x1="160" y1="50" x2="170" y2="60" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
          <line x1="20" y1="100" x2="30" y2="105" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
          <line x1="170" y1="100" x2="180" y2="105" stroke="#FF5722" strokeWidth="2" strokeLinecap="round" />
        </g>
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="lf-error-action">{actionLabel}</button>
      )}
    </div>
  );
}

/**
 * Error 500 — servidor.
 * SVG: engranaje roto.
 */
export function ServerErrorState({
  title = 'Error del servidor',
  description = 'Algo salió mal en nuestro lado. Intenta de nuevo en unos momentos.',
  actionLabel = 'Reintentar',
  onAction,
}: ErrorStateProps) {
  return (
    <div className="lf-error-state">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <ellipse cx="100" cy="145" rx="60" ry="6" fill="rgba(0,0,0,0.08)" />
        <g className="lf-error-shake">
          {/* Engranaje principal */}
          <path
            d="M100 40 L107 30 L117 32 L120 42 L130 45 L132 55 L142 60 L140 70 L148 78 L142 86 L146 96 L138 102 L138 112 L128 114 L122 122 L112 118 L102 124 L92 118 L82 122 L72 114 L62 112 L62 102 L54 96 L58 86 L50 78 L58 70 L56 60 L66 55 L68 45 L78 42 L82 32 L92 30 Z"
            fill="#FFCCBC"
            stroke="#F44336"
            strokeWidth="2"
          />
          {/* Grieta */}
          <path
            d="M100 50 L95 70 L105 85 L98 100 L108 115"
            stroke="#F44336"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="100" cy="80" r="12" fill="#F44336" />
          <text x="100" y="86" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">!</text>
        </g>
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="lf-error-action danger">{actionLabel}</button>
      )}
    </div>
  );
}

/**
 * Error de red / sin conexión.
 * SVG: wifi desconectado.
 */
export function NetworkErrorState({
  title = 'Sin conexión',
  description = 'Verifica tu conexión a internet e intenta de nuevo.',
  actionLabel = 'Reintentar',
  onAction,
}: ErrorStateProps) {
  return (
    <div className="lf-error-state">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <ellipse cx="100" cy="145" rx="60" ry="6" fill="rgba(0,0,0,0.08)" />
        <g className="lf-error-pulse">
          {/* Arcos wifi */}
          <path d="M50 90 Q100 50 150 90" stroke="#9E9E9E" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M65 100 Q100 75 135 100" stroke="#9E9E9E" strokeWidth="3" strokeLinecap="round" fill="none" />
          <path d="M80 110 Q100 95 120 110" stroke="#9E9E9E" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* X sobre wifi */}
          <circle cx="100" cy="115" r="10" fill="#F44336" />
          <line x1="95" y1="110" x2="105" y2="120" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="105" y1="110" x2="95" y2="120" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="lf-error-action">{actionLabel}</button>
      )}
    </div>
  );
}

/**
 * Error de permisos / no autorizado.
 * SVG: candado cerrado.
 */
export function ForbiddenState({
  title = 'Acceso denegado',
  description = 'No tienes permiso para ver esta página.',
  actionLabel = 'Volver',
  onAction,
}: ErrorStateProps) {
  return (
    <div className="lf-error-state">
      <svg width="200" height="160" viewBox="0 0 200 160" fill="none">
        <ellipse cx="100" cy="145" rx="60" ry="6" fill="rgba(0,0,0,0.08)" />
        <g className="lf-error-lock">
          {/* Cuerpo del candado */}
          <rect x="65" y="70" width="70" height="60" rx="10" fill="#FF9800" />
          {/* Arco del candado */}
          <path d="M75 70 L75 55 Q75 35 100 35 Q125 35 125 55 L125 70" stroke="#FF9800" strokeWidth="6" fill="none" strokeLinecap="round" />
          {/* Cerrojo */}
          <circle cx="100" cy="92" r="6" fill="white" />
          <rect x="97" y="92" width="6" height="14" fill="white" rx="2" />
        </g>
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="lf-error-action warning">{actionLabel}</button>
      )}
    </div>
  );
}

/**
 * Empty state genérico.
 * SVG: caja vacía.
 */
export function EmptyBoxState({
  title = 'Nada por aquí aún',
  description = 'Cuando haya contenido, aparecerá en esta sección.',
  actionLabel,
  onAction,
  icon,
}: ErrorStateProps & { icon?: React.ReactNode }) {
  return (
    <div className="lf-error-state">
      {icon || (
        <svg width="180" height="140" viewBox="0 0 200 160" fill="none">
          <ellipse cx="100" cy="145" rx="60" ry="6" fill="rgba(0,0,0,0.05)" />
          <g className="lf-error-float">
            <path
              d="M50 60 L100 40 L150 60 L100 80 Z"
              fill="#E8E4DE"
              stroke="#8E8EA0"
              strokeWidth="2"
            />
            <path d="M50 60 L50 110 L100 130 L100 80 Z" fill="#F5F0EB" stroke="#8E8EA0" strokeWidth="2" />
            <path d="M150 60 L150 110 L100 130 L100 80 Z" fill="#EDE7E0" stroke="#8E8EA0" strokeWidth="2" />
            {/* Líneas punteadas indicando vacío */}
            <line x1="70" y1="70" x2="90" y2="78" stroke="#8E8EA0" strokeWidth="1.5" strokeDasharray="3 3" />
            <line x1="115" y1="78" x2="135" y2="70" stroke="#8E8EA0" strokeWidth="1.5" strokeDasharray="3 3" />
          </g>
        </svg>
      )}
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="lf-error-action">{actionLabel}</button>
      )}
    </div>
  );
}

/**
 * Error genérico con mensaje personalizable.
 */
export function GenericErrorState({
  title = 'Algo salió mal',
  description = 'Ocurrió un error inesperado. Intenta de nuevo.',
  actionLabel = 'Reintentar',
  onAction,
}: ErrorStateProps) {
  return (
    <div className="lf-error-state">
      <svg width="180" height="140" viewBox="0 0 200 160" fill="none">
        <ellipse cx="100" cy="145" rx="60" ry="6" fill="rgba(0,0,0,0.05)" />
        <g className="lf-error-float">
          <circle cx="100" cy="80" r="40" fill="#FFECB3" stroke="#FFB300" strokeWidth="2" />
          <line x1="100" y1="60" x2="100" y2="90" stroke="#FFB300" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="100" r="3" fill="#FFB300" />
        </g>
      </svg>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="lf-error-action warning">{actionLabel}</button>
      )}
    </div>
  );
}
