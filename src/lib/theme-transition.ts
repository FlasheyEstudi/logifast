/**
 * LOGIFAST 2.0 — Sistema Avanzado de Transición de Tema Día/Noche
 * Utiliza View Transitions API con expansión circular radial (Circular Ripple)
 * inspirada en interfaces modernas (Telegram, Linear, Raycast).
 */

import { useConfigStore, type Tema } from '@/store/configStore';

export function toggleThemeWithTransition(
  event?: React.MouseEvent | MouseEvent | { clientX: number; clientY: number }
): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const isCurrentlyDark =
    document.documentElement.classList.contains('dark') ||
    document.documentElement.getAttribute('data-theme') === 'dark';

  const nextTema: Tema = isCurrentlyDark ? 'light' : 'dark';

  // Haptic feedback sutil en dispositivos móviles compatibles
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(12);
    } catch {}
  }

  // Si el navegador no soporta startViewTransition o el usuario prefiere movimiento reducido:
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('startViewTransition' in document) || prefersReducedMotion) {
    useConfigStore.getState().setTema(nextTema);
    return;
  }

  // Calcular las coordenadas exactas de origen del clic
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event && 'clientX' in event && typeof event.clientX === 'number' && event.clientX > 0) {
    x = event.clientX;
    y = event.clientY;
  } else {
    // Fallback: esquina superior derecha donde usualmente residen los botones de tema
    x = window.innerWidth - 60;
    y = 60;
  }

  // Radio máximo para cubrir las 4 esquinas de la pantalla desde el punto (x, y)
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Iniciar la transición de vista nativa del navegador
  const transition = (document as any).startViewTransition(() => {
    useConfigStore.getState().setTema(nextTema);
  });

  transition.ready.then(() => {
    // Animación de clip-path circular de 0 a maxRadius
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${maxRadius}px at ${x}px ${y}px)`,
        ],
      },
      {
        duration: 480,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)', // Curva suave y elástica Apple/Linear
        pseudoElement: '::view-transition-new(root)',
      }
    );
  });
}
