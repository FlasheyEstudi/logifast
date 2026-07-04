'use client';

import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
}

export default function Confetti({ active, duration = 3000 }: ConfettiProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!visible) return null;

  const particles = Array.from({ length: 45 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.2 + Math.random() * 1.6,
    color: ['#FF5722', '#00C853', '#FFB300', '#2979FF', '#8B5CF6'][Math.floor(Math.random() * 5)],
    size: 5 + Math.random() * 7,
    rotation: Math.random() * 360
  }));

  return (
    <div className="confetti-container">
      {particles.map(p => (
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
            transform: `rotate(${p.rotation}deg)`
          }}
        />
      ))}
    </div>
  );
}
