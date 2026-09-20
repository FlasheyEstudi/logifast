'use client';

import React from 'react';
import { ChevronRight, Check, Sparkles } from '@/components/icons';

/**
 * Tarjeta de banner promocional para el carrusel del home.
 *
 * Se extrajo del bloque que vivía inline en `ClientInicio` por dos razones:
 *  1. el carrusel ahora es un rail táctil con varias tarjetas montadas a la vez
 *     (antes solo se pintaba la activa y las demás no existían en el DOM);
 *  2. así el mismo diseño se puede reutilizar en Explorar sin duplicarlo.
 *
 * Respeta la identidad existente: usa los colores que el administrador define en
 * el banner (`colorFondo`, `gradiente`, `colorTexto`) y solo cae al color de marca
 * cuando el banner no trae ninguno.
 */

export interface BannerPromo {
  id?: string;
  titulo: string;
  subtitulo?: string | null;
  descripcion?: string | null;
  tipo?: string;
  colorFondo?: string | null;
  gradiente?: string | { direction?: string; from?: string; to?: string } | null;
  colorTexto?: string | null;
  imagenUrl?: string | null;
  botonTexto?: string | null;
  botonAccion?: string | null;
  botonLink?: string | null;
  accionTipo?: string | null;
  accionValor?: string | null;
  codigoPromo?: string | null;
  icono?: string | null;
  posicion?: number;
}

export type EstadoCupon = 'disponible' | 'usado' | 'expirado' | 'unclaimed' | null;

interface BannerCardProps {
  banner: BannerPromo;
  indice: number;
  total: number;
  /** Estado real del cupón en la billetera del cliente (lo calcula el llamador). */
  getCuponStatus: (codigo?: string | null) => EstadoCupon;
  onAccion: (banner: BannerPromo) => void;
  /** Lleva al cliente a ver/guardar el cupón en su billetera. */
  onVerCupon: (cupon: CuponParaGuardar) => void;
  onReclamar?: (cupon: CuponParaGuardar) => void;
}

/** Datos mínimos que la billetera necesita para guardar un cupón. */
export interface CuponParaGuardar {
  codigoPromo: string;
  titulo?: string;
  descripcion?: string;
  tipoDescuento?: string;
  valor?: number;
  montoMinimo?: number;
}

/** Arma el cupón que se guarda en la billetera a partir del banner. */
export function cuponDesdeBanner(banner: BannerPromo): CuponParaGuardar {
  return {
    codigoPromo: String(banner.codigoPromo || banner.accionValor || ''),
    titulo: banner.titulo,
    descripcion: banner.subtitulo || banner.descripcion || '',
  };
}

/** Fondo del banner: gradiente del admin, color plano o el azul de marca. */
function fondoDe(banner: BannerPromo): React.CSSProperties {
  if (banner.gradiente) {
    if (typeof banner.gradiente === 'object') {
      const { direction = '135deg', from = '#007AFF', to = '#0051D5' } = banner.gradiente;
      return { background: `linear-gradient(${direction}, ${from}, ${to})` };
    }
    return { background: banner.gradiente };
  }
  if (banner.colorFondo && banner.colorFondo.startsWith('#')) {
    // El naranja histórico del sistema (#FF5722) se mantiene con su degradado de marca.
    if (banner.colorFondo.toUpperCase() === '#FF5722') {
      return { background: 'linear-gradient(135deg, #FF5722 0%, #FF7043 100%)' };
    }
    return { background: banner.colorFondo };
  }
  return { background: 'linear-gradient(135deg, #007AFF 0%, #0051D5 100%)' };
}

export default function BannerCard({
  banner,
  indice,
  total,
  getCuponStatus,
  onAccion,
  onVerCupon,
  onReclamar,
}: BannerCardProps) {
  const colorTexto = banner.colorTexto || '#FFFFFF';
  const codigo = banner.codigoPromo || (banner.accionTipo === 'aplicar_codigo' ? banner.accionValor : null);
  const estado = codigo ? getCuponStatus(codigo) : null;
  const descripcion = banner.subtitulo || banner.descripcion || '';

  return (
    <div
      className="lf-press lf-sheen"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 182,
        /* Forma orgánica: bordes fluidos con esquina libre y elevación suave */
        borderRadius: '30px 30px 30px 12px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 14,
        padding: '18px 20px 20px',
        boxShadow: '0 14px 34px -8px rgba(0, 0, 0, 0.22)',
        ...fondoDe(banner),
        color: colorTexto,
      }}
    >
      {/* Halo orgánico superior para profundidad de luz */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -45,
          right: -35,
          width: 170,
          height: 170,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 70%)',
          pointerEvents: 'none',
          filter: 'blur(8px)',
          zIndex: 1,
        }}
      />

      {/* Olas orgánicas en capas: dan volumen y movimiento fluido sin imágenes pesadas */}
      <svg
        viewBox="0 0 500 160"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '65%',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      >
        {/* Capa de ola 1: profunda */}
        <path
          d="M 0,85 C 130,30 240,95 380,50 C 430,35 470,42 500,52 L 500,160 L 0,160 Z"
          fill="rgba(255, 255, 255, 0.08)"
        />
        {/* Capa de ola 2: intermedia ondulante */}
        <path
          d="M 0,110 C 140,65 260,115 390,75 C 440,60 475,70 500,80 L 500,160 L 0,160 Z"
          fill="rgba(255, 255, 255, 0.12)"
        />
        {/* Capa de ola 3: cresta delantera translúcida */}
        <path
          d="M 0,132 C 160,95 300,135 410,105 C 455,92 480,102 500,110 L 500,160 L 0,160 Z"
          fill="rgba(255, 255, 255, 0.07)"
        />
      </svg>

      {banner.imagenUrl && (
        <>
          <img
            src={banner.imagenUrl}
            alt=""
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.55) 45%, rgba(0,0,0,0.2) 100%)',
            }}
          />
        </>
      )}

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.35)',
            fontSize: 10.5,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: 'uppercase',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <Sparkles size={12} /> Promoción
        </span>
        {total > 1 && (
          <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", opacity: 0.85 }}>
            {indice + 1}/{total}
          </span>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 2 }}>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 19,
            fontWeight: 800,
            lineHeight: 1.24,
            margin: '0 0 5px 0',
            letterSpacing: '-0.01em',
            textShadow: banner.imagenUrl ? '0 2px 8px rgba(0,0,0,0.35)' : 'none',
          }}
          className="lf-clamp-2"
        >
          {banner.titulo}
        </h2>
        {descripcion && (
          <p
            className="lf-clamp-2"
            style={{
              fontSize: 12.5,
              lineHeight: 1.4,
              margin: 0,
              opacity: 0.93,
              textShadow: banner.imagenUrl ? '0 1px 4px rgba(0,0,0,0.35)' : 'none',
            }}
          >
            {descripcion}
          </p>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => onAccion(banner)}
          className="lf-touch lf-press"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 18px',
            borderRadius: 999,
            border: 'none',
            background: '#FFFFFF',
            color: '#0F172A',
            fontSize: 13,
            fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
          }}
        >
          {banner.botonTexto || 'Aprovechar'}
          <ChevronRight size={14} />
        </button>

        {codigo && estado === 'disponible' && (
          <button
            type="button"
            onClick={() => onVerCupon(cuponDesdeBanner(banner))}
            className="lf-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(52,199,89,0.3)',
              border: '1px solid rgba(52,199,89,0.6)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Check size={13} style={{ color: '#4ADE80' }} /> En tu billetera
          </button>
        )}

        {codigo && estado === 'usado' && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(148,163,184,0.28)',
              color: 'rgba(255,255,255,0.85)',
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            Canjeado
          </span>
        )}
        {codigo && estado !== 'disponible' && estado !== 'usado' && onReclamar && (
          <button
            type="button"
            onClick={() => onReclamar(cuponDesdeBanner(banner))}
            className="lf-press"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '8px 12px',
              borderRadius: 10,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.45)',
              color: '#FFFFFF',
              fontSize: 11,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Sparkles size={12} /> Guardar código
          </button>
        )}
      </div>
    </div>
  );
}
