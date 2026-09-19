'use client';

import React, { use, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';
import { aplicarTema } from '@/store/configStore';

const ClientShell = dynamic(() => import('@/components/client/ClientShell'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" message="Cargando LogiFast..." />,
});

const MODULOS_VALIDOS = ['inicio', 'solicitar', 'explorar', 'envios', 'pedidos', 'puntos', 'perfil'];

export default function ClienteModuloPage({ params }: { params: Promise<{ mod: string }> }) {
  const { mod } = use(params);
  const initialModule = (MODULOS_VALIDOS.includes(mod) ? mod : 'inicio') as 'inicio' | 'solicitar' | 'explorar' | 'envios' | 'pedidos' | 'puntos' | 'perfil';
  const [userName, setUserName] = useState('Cliente');
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    aplicarTema(isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user?.name) setUserName(d.user.name);
      })
      .catch(() => null);
  }, []);

  const toggleTheme = useCallback(() => {
    setIsDark((p) => !p);
  }, []);

  const onLogout = useCallback(() => {
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => null);
    localStorage.removeItem('lf-jwt-token');
    localStorage.removeItem('lf-session-view');
    localStorage.removeItem('lf-session-role');
    localStorage.removeItem('lf-session-name');
    window.location.href = '/';
  }, []);

  return (
    <ClientShell
      isDark={isDark}
      toggleTheme={toggleTheme}
      onLogout={onLogout}
      userName={userName}
      initialModule={initialModule}
    />
  );
}
