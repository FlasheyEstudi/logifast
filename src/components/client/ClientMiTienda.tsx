'use client';

import React from 'react';
import TiendaApp from '@/components/tienda/TiendaApp';

export default function ClientMiTienda() {
  return (
    <TiendaApp
      isDark={true}
      toggleTheme={() => {}}
      onLogout={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/api/auth/logout';
        }
      }}
    />
  );
}
