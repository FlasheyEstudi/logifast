'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { notify } from '@/lib/notify';

interface Comentario {
  id: string;
  autorId: string;
  autorNombre: string;
  autorInitials: string;
  autorColor: string;
  contenido: string;
  likes: number;
  createdAt: string;
  padreId?: string | null;
}

interface CommentSectionProps {
  entidad: string;
  entidadId: string;
  maxComments?: number;
}

function tiempoRelativo(fecha: string): string {
  const d = new Date(fecha);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return 'ahora';
  if (diff < 3600_000) return `hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `hace ${Math.floor(diff / 3600_000)} h`;
  const dias = Math.floor(diff / 86400_000);
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
}

/**
 * Sección de comentarios estilo Instagram.
 * - Lista comentarios con avatar, nombre, contenido, timestamp
 * - Input para comentar
 * - Responder anidado
 */
export function CommentSection({ entidad, entidadId, maxComments = 50 }: CommentSectionProps) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [nuevo, setNuevo] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const fetchComentarios = useCallback(async () => {
    try {
      const res = await fetch(`/api/social/comentarios?entidad=${entidad}&entidadId=${entidadId}`);
      if (!res.ok) return;
      const data = await res.json();
      setComentarios(data.comentarios ?? []);
    } catch {
      // silencioso
    }
  }, [entidad, entidadId]);

  useEffect(() => {
    fetchComentarios();
  }, [fetchComentarios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevo.trim() || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/social/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entidad,
          entidadId,
          contenido: nuevo.trim(),
          padreId: replyTo,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setNuevo('');
        setReplyTo(null);
        await fetchComentarios();
        notify.success('Comentario publicado');
      } else {
        notify.error(data.error || 'Error al comentar');
      }
    } catch {
      notify.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este comentario?')) return;
    try {
      const res = await fetch(`/api/social/comentarios?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchComentarios();
        notify.success('Comentario eliminado');
      }
    } catch {
      notify.error('Error al eliminar');
    }
  };

  return (
    <div className="lf-comments-section">
      <div className="lf-comments-header">
        <h3>{comentarios.length} comentarios</h3>
      </div>

      <div className="lf-comments-list">
        {comentarios.length === 0 && (
          <div className="lf-comments-empty">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <p>Sé el primero en comentar</p>
          </div>
        )}
        {comentarios.slice(0, maxComments).map((c) => (
          <div key={c.id} className={`lf-comment ${c.padreId ? 'reply' : ''}`}>
            <div
              className="lf-comment-avatar"
              style={{ background: c.autorColor }}
            >
              {c.autorInitials}
            </div>
            <div className="lf-comment-body">
              <div className="lf-comment-meta">
                <span className="lf-comment-author">{c.autorNombre}</span>
                <span className="lf-comment-time">{tiempoRelativo(c.createdAt)}</span>
              </div>
              <p className="lf-comment-text">{c.contenido}</p>
              <div className="lf-comment-actions">
                <button
                  type="button"
                  className="lf-comment-action"
                  onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
                >
                  Responder
                </button>
                <button
                  type="button"
                  className="lf-comment-action danger"
                  onClick={() => handleDelete(c.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <form className="lf-comment-form" onSubmit={handleSubmit}>
        {replyTo && (
          <div className="lf-reply-banner">
            Respondiendo a un comentario
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="lf-reply-cancel"
            >
              ✕
            </button>
          </div>
        )}
        <div className="lf-comment-input-row">
          <input
            type="text"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            placeholder="Escribe un comentario..."
            maxLength={500}
            className="lf-comment-input"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!nuevo.trim() || loading}
            className="lf-comment-submit"
          >
            {loading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
