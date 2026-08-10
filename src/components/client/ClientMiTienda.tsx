'use client';

import React, { useState, useEffect } from 'react';
import TiendaApp from '@/components/tienda/TiendaApp';

interface ClientMiTiendaProps {
  isDark?: boolean;
  toggleTheme?: () => void;
  onReturnToClient?: () => void;
}

export default function ClientMiTienda({
  isDark: propIsDark,
  toggleTheme: propToggleTheme,
  onReturnToClient,
}: ClientMiTiendaProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof propIsDark === 'boolean') return propIsDark;
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    if (typeof propIsDark === 'boolean') {
      setIsDark(propIsDark);
    }
  }, [propIsDark]);

  const handleToggleTheme = () => {
    if (propToggleTheme) {
      propToggleTheme();
    } else if (typeof window !== 'undefined') {
      const newDark = !isDark;
      setIsDark(newDark);
      if (newDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <TiendaApp
      isDark={isDark}
      toggleTheme={handleToggleTheme}
      onReturnToClient={onReturnToClient}
      onLogout={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/api/auth/logout';
        }
      }}
    />
  );
}
