'use client';

import React, { useEffect, useRef } from 'react';

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  dx: number;
  dy: number;
  opacity: number;
  maxOpacity: number;
  life: number;
  maxLife: number;
  thickness: number;
}

export default function ShootingStars({ isDark }: { isDark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isDark) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let stars: ShootingStar[] = [];
    let isRunning = true;
    let spawnTimer: NodeJS.Timeout | null = null;

    const resize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnStar = () => {
      if (!isRunning) return;

      const w = canvas.width || window.innerWidth;
      const h = canvas.height || window.innerHeight;

      // Ángulo de caída natural (45 a 60 grados hacia la izquierda)
      const angle = (Math.PI / 180) * (Math.random() * 15 + 130);
      const speed = Math.random() * 9 + 8;
      const length = Math.random() * 90 + 70;
      const maxLife = Math.random() * 45 + 35;

      // Iniciar en la parte superior o lateral derecha
      const startX = Math.random() * (w * 0.8) + (w * 0.2);
      const startY = Math.random() * (h * 0.35);

      stars.push({
        x: startX,
        y: startY,
        length,
        speed,
        dx: Math.cos(angle) * speed,
        dy: Math.sin(angle) * speed,
        opacity: 0,
        maxOpacity: Math.random() * 0.6 + 0.4,
        life: 0,
        maxLife,
        thickness: Math.random() * 1.5 + 1,
      });

      // Ocasionalmente una segunda estrella fugaz (dupla)
      if (Math.random() > 0.65) {
        setTimeout(() => {
          if (!isRunning) return;
          stars.push({
            x: startX + (Math.random() * 120 - 60),
            y: startY + (Math.random() * 80 - 40),
            length: length * 0.8,
            speed: speed * 1.05,
            dx: Math.cos(angle) * speed * 1.05,
            dy: Math.sin(angle) * speed * 1.05,
            opacity: 0,
            maxOpacity: Math.random() * 0.5 + 0.3,
            life: 0,
            maxLife: maxLife * 0.9,
            thickness: 1.2,
          });
        }, Math.random() * 400 + 150);
      }

      // Intervalo impredecible y no periódico (entre 3s y 8s)
      const nextDelay = Math.random() * 5000 + 3000;
      spawnTimer = setTimeout(spawnStar, nextDelay);
    };

    // Primera estrella después de 1.5s
    spawnTimer = setTimeout(spawnStar, 1500);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life++;
        s.x += s.dx;
        s.y += s.dy;

        // Fade in y Fade out suave
        const halfLife = s.maxLife / 2;
        if (s.life <= halfLife) {
          s.opacity = (s.life / halfLife) * s.maxOpacity;
        } else {
          s.opacity = ((s.maxLife - s.life) / halfLife) * s.maxOpacity;
        }

        if (s.life >= s.maxLife || s.x < -100 || s.y > canvas.height + 100) {
          stars.splice(i, 1);
          continue;
        }

        // Dibujar estela de la estrella fugaz
        const tailX = s.x - (s.dx / s.speed) * s.length;
        const tailY = s.y - (s.dy / s.speed) * s.length;

        const grad = ctx.createLinearGradient(s.x, s.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255, 255, 255, ${s.opacity})`);
        grad.addColorStop(0.2, `rgba(0, 229, 255, ${s.opacity * 0.85})`);
        grad.addColorStop(0.6, `rgba(0, 102, 255, ${s.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(0, 102, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(tailX, tailY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = s.thickness;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Pequeño resplandor en la cabeza
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.thickness * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${s.opacity})`;
        ctx.shadowColor = '#00E5FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (spawnTimer) clearTimeout(spawnTimer);
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [isDark]);

  if (!isDark) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
