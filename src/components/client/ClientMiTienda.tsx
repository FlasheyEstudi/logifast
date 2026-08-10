'use client';

import React from 'react';
import TiendaApp from '@/components/tienda/TiendaApp';

interface ClientMiTiendaProps {
  onReturnToClient?: () => void;
}

export default function ClientMiTienda({ onReturnToClient }: ClientMiTiendaProps) {
  return (
    <TiendaApp
      isDark={true}
      toggleTheme={() => {}}
      onReturnToClient={onReturnToClient}
      onLogout={() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/api/auth/logout';
        }
      }}
    />
  );
}
