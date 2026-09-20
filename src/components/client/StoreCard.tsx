'use client';

import React from 'react';
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
  const imagen = tienda.imagenUrl || tienda.bannerUrl || null;

  const esRail = variante === 'rail';

  return (
    <button
      type="button"
      onClick={onAbrir}
      className={`lf-press lf-optim ${esRail ? 'lf-rail-tile' : ''}`}
      aria-label={`Abrir ${tienda.nombre}${cerrada ? ' (cerrada)' : ''}`}
      style={{
        width: esRail ? undefined : '100%',
        textAlign: 'left',
        padding: 0,
        border: '1px solid var(--border)',
        borderRadius: 'var(--lf-card-radius, 16px)',
        background: 'var(--surface)',
        boxShadow: 'var(--lf-shadow-card)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        opacity: cerrada ? 0.78 : 1,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Portada: banner si existe; si no, el color de marca de la tienda. */}
      <div
        style={{
          position: 'relative',
          height: esRail ? 78 : 92,
          background: tienda.portadaColor || tienda.logoColor || 'var(--primario-soft)',
          overflow: 'hidden',
        }}
      >
        {imagen && (
          <img
            src={imagen}
            alt=""
            aria-hidden="true"
            crossOrigin="anonymous"
            referrerPolicy="no-referrer"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.35) 100%)',
          }}
        />
        {/* Estado de apertura: dato del servidor, visible de un vistazo. */}
        {abierta !== null && (
          <span
            className={cerrada ? 'lf-badge-closed' : 'lf-badge-open'}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: cerrada ? 'rgba(255,59,48,0.94)' : 'rgba(52,199,89,0.94)',
              color: '#FFFFFF',
              border: 'none',
              backdropFilter: 'blur(6px)',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'inline-block',
              }}
            />
            {cerrada ? 'Cerrada' : 'Abierta'}
          </span>
        )}
      </div>

      <div style={{ padding: '10px 12px 12px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: tienda.logoColor || 'var(--primario-soft)',
              color: '#FFFFFF',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: 12.5,
              border: '2px solid var(--surface)',
              marginTop: -22,
              boxShadow: 'var(--lf-shadow-card)',
              overflow: 'hidden',
            }}
          >
            {iniciales}
          </span>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
          {/* Solo se muestra la valoración si hay reseñas reales. */}
          {calificacion > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#FF9500', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace" }}>
              <Star size={11} fill="currentColor" /> {calificacion.toFixed(1)}
            </span>
          )}
          {typeof distanciaKm === 'number' && distanciaKm > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
              <MapPin size={11} /> {distanciaKm.toFixed(1)} km
            </span>
          )}
          {tiempo && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
              <Clock size={11} /> {tiempo}
            </span>
          )}
          {typeof tienda.costoEnvio === 'number' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)' }}>
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
    </button>
  );
}
