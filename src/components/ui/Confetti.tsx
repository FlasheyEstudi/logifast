'use client';

import React, { useEffect, useMemo, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [visible, setVisible] = useState(false);

  // P2: Respeta prefers-reduced-motion (usuarios con vestibular disorders)
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Partículas memoizadas para no recalcular en cada re-render (P2)
  const particles = useMemo(
    () =>
      Array.from({ length: 45 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.4,
        duration: 1.2 + Math.random() * 1.6,
        color: ['#FF5722', '#00C853', '#FFB300', '#2979FF', '#8B5CF6'][Math.floor(Math.random() * 5)],
        size: 5 + Math.random() * 7,
        rotation: Math.random() * 360,
      })),
    []
  );

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!visible) return null;

  // Si el usuario prefiere reduced motion, mostrar un check estático en lugar de 45 partículas animadas
  if (prefersReducedMotion) {
    return (
      <div
        className="confetti-container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontSize: 48,
            color: '#00C853',
            fontWeight: 'bold',
          }}
        >
          ✓
        </div>
      </div>
    );
  }

  return (
    <div className="confetti-container">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            background: p.color,
            width: p.size,
            height: p.size,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}
