'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Heart, X, CheckCircle } from 'lucide-react';
import { useStore, type Calificacion } from '@/lib/store';

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */

interface ClientRatingProps {
  isDark: boolean;
  onClose: () => void;
}

/* ═══════════════════════════════════════════════
   LABELS & TAGS
   ═══════════════════════════════════════════════ */

const STAR_LABELS: Record<number, string> = {
  1: 'Pésimo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Excelente',
};

const NEGATIVE_TAGS = ['Tardó mucho', 'Paquete dañado', 'Mala ubicación', 'Poco profesional', 'Otro'];
const POSITIVE_TAGS = ['Rápido', 'Cuidadoso', 'Amable', 'Buena ubicación', 'Excelente servicio'];

/* ═══════════════════════════════════════════════
   CUSTOM TOGGLE
   ═══════════════════════════════════════════════ */

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: on ? 'var(--primario)' : 'var(--text-muted, #999)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
        }}
      />
    </button>
  );
}

/* ═══════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════ */

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 25 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 30,
    transition: { duration: 0.2 },
  },
};

const starVariants = {
  empty: { scale: 1 },
  filled: {
    scale: [1, 1.3, 1],
    transition: { duration: 0.3 },
  },
};

const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
};

/* ═══════════════════════════════════════════════
   INNER FORM – keyed for natural state reset
   ═══════════════════════════════════════════════ */

interface RatingFormProps {
  isDark: boolean;
  repartidorNombre: string;
  ratingOrderId: string | null;
  order: {
    repartidor: string | null;
  } | undefined;
  onClose: () => void;
}

function RatingForm({ isDark, repartidorNombre, ratingOrderId, order, onClose }: RatingFormProps) {
  const submitCalificacion = useStore((s) => s.submitCalificacion);
  const addFidelizacionPuntos = useStore((s) => s.addFidelizacionPuntos);

  const [estrellas, setEstrellas] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comentario, setComentario] = useState('');
  const [favorito, setFavorito] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  /* Auto-close after success */
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (submitted) {
      closeTimerRef.current = setTimeout(() => {
        onClose();
      }, 2000);
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [submitted, onClose]);

  const activeStar = hoverStar || estrellas;
  const tags = estrellas <= 3 ? NEGATIVE_TAGS : POSITIVE_TAGS;

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit() {
    if (estrellas === 0) return;

    setSubmitted(true);

    const cal: Omit<Calificacion, 'id'> = {
      orderId: ratingOrderId || '',
      repartidorId: order?.repartidor || '',
      repartidorNombre,
      estrellas,
      etiquetas: selectedTags,
      comentario,
      favorito,
      fecha: new Date().toISOString().split('T')[0],
      editable: true,
    };

    submitCalificacion(cal);
    addFidelizacionPuntos(
      `Calificación ${estrellas} estrellas`,
      estrellas === 5 ? 5 : 0
    );
  }

  return (
    <div style={{ padding: '32px 24px 24px' }}>
      <AnimatePresence mode="wait">
        {submitted ? (
          /* ═════════════════════════════════
             SUCCESS STATE
             ═════════════════════════════════ */
          <motion.div
            key="success"
            initial="hidden"
            animate="visible"
            variants={successVariants}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 0',
              gap: 12,
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <CheckCircle
                size={64}
                style={{ color: 'var(--exito, #00C853)' }}
              />
            </motion.div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: 24,
                color: 'var(--text)',
                margin: 0,
              }}
            >
              ¡Gracias!
            </h2>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              Tu calificación fue enviada
            </p>
          </motion.div>
        ) : (
          /* ═════════════════════════════════
             RATING FORM
             ═════════════════════════════════ */
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* ─── HEADER ─── */}
            <div style={{ textAlign: 'center', paddingRight: 24 }}>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 700,
                  fontSize: 20,
                  color: 'var(--text)',
                  margin: '0 0 6px',
                }}
              >
                ¿Cómo fue tu experiencia?
              </h2>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  margin: 0,
                }}
              >
                Califica el servicio de {repartidorNombre}
              </p>
            </div>

            {/* ─── STAR RATING ─── */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => {
                  const isFilled = star <= activeStar;
                  return (
                    <motion.button
                      key={star}
                      type="button"
                      variants={starVariants}
                      animate={isFilled ? 'filled' : 'empty'}
                      onClick={() => setEstrellas(star)}
                      onMouseEnter={() => setHoverStar(star)}
                      onMouseLeave={() => setHoverStar(0)}
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        outline: 'none',
                      }}
                      aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                    >
                      <Star
                        size={36}
                        fill={isFilled ? 'var(--primario)' : 'none'}
                        stroke={isFilled ? 'var(--primario)' : 'var(--border)'}
                        strokeWidth={isFilled ? 0 : 1.5}
                        style={{
                          transition: 'fill 0.15s, stroke 0.15s',
                        }}
                      />
                    </motion.button>
                  );
                })}
              </div>

              {/* ─── STAR LABEL ─── */}
              <AnimatePresence mode="wait">
                {estrellas > 0 && (
                  <motion.p
                    key={estrellas}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--primario)',
                      margin: 0,
                      height: 20,
                    }}
                  >
                    {STAR_LABELS[estrellas]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* ─── QUICK TAGS ─── */}
            {estrellas > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    justifyContent: 'center',
                  }}
                >
                  {tags.map((tag, i) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 999,
                          fontSize: 13,
                          fontFamily: "'DM Sans', sans-serif",
                          border: `1.5px solid ${isSelected ? 'var(--primario)' : 'var(--border)'}`,
                          background: isSelected ? 'var(--primario-soft)' : 'transparent',
                          color: isSelected ? 'var(--primario)' : 'var(--text)',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background 0.2s, color 0.2s',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── COMMENT ─── */}
            {estrellas > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.1 }}
              >
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={comentario}
                    onChange={(e) => {
                      if (e.target.value.length <= 300) {
                        setComentario(e.target.value);
                      }
                    }}
                    placeholder="Cuéntanos más (opcional)"
                    rows={3}
                    className="lf-textarea"
                    style={{
                      width: '100%',
                      paddingRight: 50,
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: 10,
                      right: 12,
                      fontSize: 11,
                      fontFamily: "'DM Sans', sans-serif",
                      color: comentario.length >= 280
                        ? 'var(--primario)'
                        : 'var(--text-muted)',
                    }}
                  >
                    {comentario.length}/300
                  </span>
                </div>
              </motion.div>
            )}

            {/* ─── FAVORITE DRIVER ─── */}
            {estrellas > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: 0.15 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1.5px solid var(--border)',
                  background: 'var(--bg-alt, var(--bg))',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Heart
                    size={18}
                    fill={favorito ? 'var(--primario)' : 'none'}
                    stroke={favorito ? 'var(--primario)' : 'var(--text-muted)'}
                    style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                  />
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      color: 'var(--text)',
                    }}
                  >
                    Agregar a mis repartidores favoritos
                  </span>
                </div>
                <Toggle
                  on={favorito}
                  onToggle={() => setFavorito((v) => !v)}
                />
              </motion.div>
            )}

            {/* ─── SUBMIT BUTTON ─── */}
            <motion.button
              type="button"
              disabled={estrellas === 0}
              onClick={handleSubmit}
              whileHover={estrellas > 0 ? { scale: 1.02 } : undefined}
              whileTap={estrellas > 0 ? { scale: 0.98 } : undefined}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: estrellas > 0 ? 'var(--primario)' : 'var(--border)',
                color: estrellas > 0 ? '#fff' : 'var(--text-muted)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 16,
                fontWeight: 600,
                cursor: estrellas > 0 ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                boxShadow:
                  estrellas > 0 ? '0 4px 14px rgba(255,87,34,0.3)' : 'none',
              }}
            >
              Enviar calificación
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function ClientRating({ isDark, onClose }: ClientRatingProps) {
  const ratingModalOpen = useStore((s) => s.ratingModalOpen);
  const ratingOrderId = useStore((s) => s.ratingOrderId);
  const orders = useStore((s) => s.orders);

  /* Find order & rider info */
  const order = orders.find((o) => o.id === ratingOrderId);
  const repartidorNombre = order?.repartidorInitials || 'Repartidor';

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  return (
    <AnimatePresence>
      {ratingModalOpen && (
        <motion.div
          key="rating-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          className="modal-overlay visible"
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            className="lf-modal open"
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: 448,
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* ─── CLOSE BUTTON ─── */}
            <button
              onClick={onClose}
              aria-label="Cerrar"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <X size={20} />
            </button>

            {/* Keyed form resets state on new order */}
            <RatingForm
              key={ratingOrderId || 'empty'}
              isDark={isDark}
              repartidorNombre={repartidorNombre}
              ratingOrderId={ratingOrderId}
              order={order ? { repartidor: order.repartidor } : undefined}
              onClose={onClose}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
