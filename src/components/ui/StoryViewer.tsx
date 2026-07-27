'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { notify } from '@/lib/notify';

interface Story {
  id: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  colorFondo: string;
  link: string;
  tiendaId: string;
  vistas: number;
  vista: boolean;
  createdAt: string;
  expiraEn: string;
}

/**
 * Carrusel horizontal de stories tipo Instagram.
 * Cada story es un círculo con gradiente y título.
 */
export function StoryViewer() {
  const [stories, setStories] = useState<Story[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  const fetchStories = useCallback(async () => {
    try {
      const res = await fetch('/api/stories');
      if (!res.ok) return;
      const data = await res.json();
      setStories(data.stories ?? []);
    } catch {
      // silencioso
    }
  }, []);

  useEffect(() => {
    fetchStories();
    const interval = setInterval(fetchStories, 60_000); // refresh cada minuto
    return () => clearInterval(interval);
  }, [fetchStories]);

  // Auto-advance del story activo
  useEffect(() => {
    if (active === null) return;
    setProgress(0);
    const start = Date.now();
    const duration = 5000; // 5s por story

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(tick);
        // Marcar como vista
        if (stories[active]) {
          fetch('/api/stories', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: stories[active].id }),
          }).catch(() => null);
        }
        // Avanzar al siguiente
        setActive((prev) => (prev === null ? null : prev + 1 >= stories.length ? null : prev + 1));
      }
    }, 50);

    return () => clearInterval(tick);
  }, [active, stories]);

  if (stories.length === 0) return null;

  return (
    <>
      <div className="lf-stories-rail">
        <div className="lf-stories-track">
          {stories.map((s, idx) => (
            <button
              key={s.id}
              className={`lf-story-btn ${s.vista ? 'viewed' : ''}`}
              onClick={() => setActive(idx)}
            >
              <div
                className="lf-story-ring"
                style={{
                  background: s.imagenUrl
                    ? `url(${s.imagenUrl}) center/cover`
                    : `linear-gradient(135deg, ${s.colorFondo}, ${s.colorFondo}cc)`,
                }}
              >
                {!s.imagenUrl && (
                  <span className="lf-story-initials">{s.titulo.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="lf-story-label">{s.titulo}</span>
            </button>
          ))}
        </div>
      </div>

      {active !== null && active < stories.length && (
        <div className="lf-story-fullscreen" onClick={() => setActive(null)}>
          <div className="lf-story-progress-bars">
            {stories.map((_, i) => (
              <div key={i} className="lf-story-progress-bar">
                <div
                  className="lf-story-progress-fill"
                  style={{
                    width: i < active ? '100%' : i === active ? `${progress}%` : '0%',
                  }}
                />
              </div>
            ))}
          </div>
          <div
            className="lf-story-content"
            style={{
              background: stories[active].imagenUrl
                ? `url(${stories[active].imagenUrl}) center/cover`
                : `linear-gradient(135deg, ${stories[active].colorFondo}, ${stories[active].colorFondo}88)`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!stories[active].imagenUrl && (
              <div className="lf-story-text">
                <h2>{stories[active].titulo}</h2>
                {stories[active].descripcion && <p>{stories[active].descripcion}</p>}
              </div>
            )}
            {stories[active].imagenUrl && (
              <div className="lf-story-overlay">
                <h2>{stories[active].titulo}</h2>
                {stories[active].descripcion && <p>{stories[active].descripcion}</p>}
              </div>
            )}
            <div className="lf-story-nav">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((p) => (p === null ? null : Math.max(0, p - 1)));
                }}
                disabled={active === 0}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((p) => (p === null || p >= stories.length - 1 ? null : p + 1));
                }}
                disabled={active === stories.length - 1}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
