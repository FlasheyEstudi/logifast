'use client';

import React, { useRef, useCallback } from 'react';

export function useRipple() {
  const containerRef = useRef<HTMLDivElement>(null);

  const createRipple = useCallback((e: React.MouseEvent<HTMLElement> | React.TouchEvent<HTMLElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    container.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }, []);

  return { containerRef, createRipple };
}

interface RippleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function RippleContainer({ children, className = '', ...props }: RippleContainerProps) {
  const { containerRef, createRipple } = useRipple();

  return (
    <div
      ref={containerRef}
      className={`ripple-container ${className}`}
      onMouseDown={createRipple}
      onTouchStart={createRipple}
      {...props}
    >
      {children}
    </div>
  );
}
