'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ClientPerfil = dynamic(() => import('@/components/client/ClientPerfil'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" message="Cargando perfil de usuario..." />,
});

export default function ClientePerfilPage() {
  return (
    <ClientPerfil
      isDark={true}
      userName="Cliente"
      onLogout={() => {}}
      onNavigate={() => {}}
    />
  );
}
