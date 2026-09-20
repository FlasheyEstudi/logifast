'use client';

import React, { useState } from 'react';
import { Star, Clock, MapPin, Truck } from '@/components/icons';

/**
 * Tarjeta de tienda para el rail del home y para la grilla de Explorar.
 *
 * Reglas de honestidad de datos:
 *  - La calificación solo se pinta si la tienda TIENE reseñas (`calificacion > 0`).
 *    Antes se mostraba `4.8` fijo con `|| 4.8`, un valor inventado en pantalla.
 *  - El tiempo estimado se toma del campo que exista; si no hay, se omite.
 *  - El estado abierto/cerrado viene del SERVIDOR (`abierta` + `aperturaTexto`),
 *    no del reloj del teléfono.
 */

export interface TiendaCardData {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  imagenUrl?: string | null;
  bannerUrl?: string | null;
  logoColor?: string | null;
  logoIniciales?: string | null;
  portadaColor?: string | null;
  calificacion?: number | null;
  totalPedidos?: number | null;
  tiempoEstimado?: string | null;
  costoEnvio?: number | null;
  pedidoMinimo?: number | null;
  direccion?: string | null;
  /** Calculado por el backend a partir del horario real. */
  abierta?: boolean | null;
  aperturaTexto?: string | null;
  /** Si el backend no manda el dato, se usa el horario local normalizado. */
  horario?: unknown;
}

interface StoreCardProps {
  tienda: TiendaCardData;
  onAbrir: () => void;
  /** Variante ancha (rail del home) o compacta (grilla de explorar). */
  variante?: 'rail' | 'grid';
  /** Distancia en km si el sistema ya la conoce (no se calcula aquí). */
  distanciaKm?: number | null;
}

/** ¿La tienda está abierta? Usa el dato del servidor y, si falta, el horario local. */
function estadoApertura(tienda: TiendaCardData): { abierta: boolean | null; texto: string } {
  if (typeof tienda.abierta === 'boolean') {
    return { abierta: tienda.abierta, texto: tienda.aperturaTexto || (tienda.abierta ? 'Abierta' : 'Cerrada') };
  }
  // Respaldo local: horario ya normalizado a JSON por el backend.
  try {
    const h = tienda.horario;
    if (!h) return { abierta: null, texto: '' };
    const obj = typeof h === 'string' ? JSON.parse(h) : (h as Record<string, { abre?: string; cierra?: string; cerrado?: boolean }>);
    if (!obj || typeof obj !== 'object') return { abierta: null, texto: '' };
    const dias = ['dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'];
    const hoy = obj[dias[new Date().getDay()]];
    if (!hoy || hoy.cerrado || !hoy.abre || !hoy.cierra) return { abierta: false, texto: 'Cerrada hoy' };
    const min = new Date().getHours() * 60 + new Date().getMinutes();
    const [ah, am] = hoy.abre.split(':').map(Number);
    const [ch, cm] = hoy.cierra.split(':').map(Number);
    const abre = ah * 60 + (am || 0);
    const cierra = ch * 60 + (cm || 0);
    if (min >= abre && min <= cierra) return { abierta: true, texto: `Hasta las ${hoy.cierra}` };
    return { abierta: false, texto: min < abre ? `Abre ${hoy.abre}` : 'Cerrada' };
  } catch {
    return { abierta: null, texto: '' };
  }
}

export default function StoreCard({ tienda, onAbrir, variante = 'rail', distanciaKm }: StoreCardProps) {
  const { abierta, texto } = estadoApertura(tienda);
  const cerrada = abierta === false;
  const iniciales = (tienda.logoIniciales || tienda.nombre || '??').slice(0, 2).toUpperCase();
  const calificacion = Number(tienda.calificacion) || 0;
  const tiempo = tienda.tiempoEstimado || null;

  // Manejo de recursos visuales reales (banner y logo separados)
  const [bannerError, setBannerError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const banner = tienda.bannerUrl || null;
  const logo = tienda.imagenUrl || null;
  const tieneBannerValido = Boolean(banner && !bannerError);
  const tieneLogoValido = Boolean(logo && !logoError);

  const esRail = variante === 'rail';

  // Color base asegurado: color de portada o logo o primario
  const colorBase = tienda.portadaColor || tienda.logoColor || 'var(--primario)';
  const esHex = colorBase.startsWith('#');
  const fondoPortada = tieneBannerValido
    ? undefined
    : esHex
    ? `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.24) 0%, transparent 60%), linear-gradient(135deg, ${colorBase} 0%, ${colorBase}E6 55%, ${colorBase}B3 100%)`
    : `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.24) 0%, transparent 60%), linear-gradient(135deg, ${colorBase} 0%, rgba(0,0,0,0.2) 100%)`;

  // El halo y el aro del logo toman el acento de la tienda si lo tiene.
  const acento = tienda.logoColor || 'var(--primario)';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onAbrir();
        }
      }}
      className={`lf-press lf-optim lf-organic ${esRail ? 'lf-rail-tile' : ''}`}
      aria-label={`Abrir ${tienda.nombre}${cerrada ? ' (cerrada)' : ''}`}
      style={{
        width: esRail ? undefined : '100%',
        textAlign: 'left',
        padding: 0,
        borderRadius: '26px 26px 26px 14px',
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        opacity: cerrada ? 0.78 : 1,
        fontFamily: "'DM Sans', sans-serif",
        boxSizing: 'border-box',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Portada: banner real si existe; si no, degradado orgánico de marca con olas */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: esRail ? 94 : 108,
          background: fondoPortada || colorBase,
          borderTopLeftRadius: 26,
          borderTopRightRadius: 26,
          borderBottomLeftRadius: 26,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {tieneBannerValido && (
          <img
            src={banner!}
            alt={`Portada de ${tienda.nombre}`}
            aria-hidden="true"
            crossOrigin="anonymous"
            onError={() => setBannerError(true)}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}

        {/* Velo sutil para que el texto y la etiqueta se lean sobre cualquier foto */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.48) 100%)',
          }}
        />

        {/* Olas ambientales luminosas sobre la portada */}
        <svg
          viewBox="0 0 360 80"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 4,
            width: '100%',
            height: '65%',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: tieneBannerValido ? 0.35 : 0.65,
          }}
        >
          <path
            d="M 0,32 C 90,12 180,48 270,22 C 315,12 342,20 360,24 L 360,80 L 0,80 Z"
            fill="rgba(255, 255, 255, 0.16)"
          />
          <path
            d="M 0,48 C 100,26 190,56 290,34 C 325,26 345,32 360,38 L 360,80 L 0,80 Z"
            fill="rgba(255, 255, 255, 0.22)"
          />
        </svg>

        {/* Ola orgánica esculpida recortando la transición entre la portada y el cuerpo de la tarjeta */}
        <svg
          viewBox="0 0 360 26"
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: -1,
            width: '100%',
            height: 22,
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <path
            d="M 0,10 Q 90,0 180,13 T 360,7 L 360,26 L 0,26 Z"
            fill="var(--surface)"
            opacity={0.35}
          />
          <path
            d="M 0,15 Q 95,5 185,17 T 360,11 L 360,26 L 0,26 Z"
            fill="var(--surface)"
          />
        </svg>

        {/* Halo de luz sobre el color de la tienda */}
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${acento}66 0%, transparent 70%)`,
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />

        {/* Estado de apertura: dato del servidor, visible en cápsula orgánica */}
        {abierta !== null && (
          <span
            className={cerrada ? 'lf-badge-closed' : 'lf-badge-open'}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: cerrada ? 'rgba(255,59,48,0.92)' : 'rgba(52,199,89,0.92)',
              color: '#FFFFFF',
              border: '1px solid rgba(255,255,255,0.28)',
              borderRadius: 9999,
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              padding: '4px 9px',
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              zIndex: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'inline-block',
                boxShadow: '0 0 6px rgba(255,255,255,0.8)',
              }}
            />
            {cerrada ? 'Cerrada' : 'Abierta'}
          </span>
        )}
      </div>

      <div style={{ width: '100%', padding: '8px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 42,
              height: 42,
              /* Forma de guijarro orgánico esculpido */
              borderRadius: '16px 20px 14px 22px',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tieneLogoValido ? 'var(--surface)' : acento,
              color: '#FFFFFF',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 14,
              border: '2.5px solid var(--surface)',
              marginTop: -26,
              boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
              overflow: 'hidden',
              position: 'relative',
              zIndex: 5,
            }}
          >
            {tieneLogoValido ? (
              <img
                src={logo!}
                alt={`Logo de ${tienda.nombre}`}
                crossOrigin="anonymous"
                onError={() => setLogoError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <span>{iniciales}</span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              className="lf-clamp-1"
              style={{ fontSize: 13.5, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--text)', lineHeight: 1.25 }}
            >
              {tienda.nombre}
            </div>
            {tienda.categoria && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>{tienda.categoria}</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11 }}>
          {/* Solo se muestra la valoración si hay reseñas reales. */}
          {calificacion > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FF9500', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", background: 'rgba(255,149,0,0.12)', padding: '2px 8px', borderRadius: 9999, border: 'none' }}>
              <Star size={11} fill="currentColor" /> {calificacion.toFixed(1)}
            </span>
          )}
          {typeof distanciaKm === 'number' && distanciaKm > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', background: 'var(--bg-alt)', padding: '2px 8px', borderRadius: 9999, border: 'none' }}>
              <MapPin size={11} /> {distanciaKm.toFixed(1)} km
            </span>
          )}
          {tiempo && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', background: 'var(--bg-alt)', padding: '2px 8px', borderRadius: 9999, border: 'none' }}>
              <Clock size={11} /> {tiempo}
            </span>
          )}
          {typeof tienda.costoEnvio === 'number' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', background: 'var(--bg-alt)', padding: '2px 8px', borderRadius: 9999, border: 'none' }}>
              <Truck size={11} /> C${tienda.costoEnvio}
            </span>
          )}
        </div>

        {/* Cuando está cerrada, el texto de apertura es la información útil. */}
        {cerrada && texto && (
          <div className="lf-clamp-1" style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--peligro)' }}>
            {texto}
          </div>
        )}
      </div>
    </div>
  );
}
