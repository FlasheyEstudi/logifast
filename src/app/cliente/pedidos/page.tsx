'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';

const ClientPedidos = dynamic(() => import('@/components/client/ClientPedidos'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" message="Cargando historial de pedidos..." />,
});

export default function ClientePedidosPage() {
  return (
    <ClientPedidos
      isDark={true}
      userName="Cliente"
      onNavigate={() => {}}
      onOpenTracking={() => {}}
      onOpenChat={() => {}}
    />
  );
}
