'use client';

import React, { useState, useEffect } from 'react';
import { notify } from '@/lib/notify';

interface RatingStarsProps {
  productoId?: string;
  value?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (v: number) => void;
  showValue?: boolean;
}

/**
 * Stars de valoración interactivas.
 * Si se pasa productoId, persiste en /api/valoraciones.
 */
export function RatingStars({
  productoId,
  value: controlledValue,
  readOnly = false,
  size = 'md',
  onChange,
  showValue = false,
}: RatingStarsProps) {
  const [value, setValue] = useState(controlledValue ?? 0);
  const [hover, setHover] = useState(0);

  useEffect(() => {
    if (controlledValue !== undefined) setValue(controlledValue);
  }, [controlledValue]);

  const sizeClass = { sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }[size];

  const handleClick = async (v: number) => {
    if (readOnly) return;
    setValue(v);
    onChange?.(v);

    if (productoId) {
      try {
        const res = await fetch('/api/valoraciones', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productoId, estrellas: v }),
        });
        if (res.ok) {
          notify.success(`¡Gracias por tu valoración de ${v} estrellas!`);
        }
      } catch {
        notify.error('No se pudo guardar tu valoración');
      }
    }
  };

  return (
    <div className="lf-rating-stars" role="radiogroup">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} estrellas`}
          disabled={readOnly}
          className={`lf-star-btn ${readOnly ? 'read-only' : ''}`}
          style={{
            minHeight: 44,
            minWidth: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 8,
            background: 'transparent',
            border: 'none',
            cursor: readOnly ? 'default' : 'pointer',
          }}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => handleClick(star)}
        >
          <svg
            className={`${sizeClass} ${(hover || value) >= star ? 'filled' : 'empty'}`}
            viewBox="0 0 24 24"
            fill={(hover || value) >= star ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 18.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </button>
      ))}
      {showValue && value > 0 && (
        <span className="lf-rating-value">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
