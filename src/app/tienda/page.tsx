'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { RoleLoader } from '@/components/ui/loaders';
import { aplicarTema } from '@/store/configStore';

const TiendaApp = dynamic(() => import('@/components/tienda/TiendaApp'), {
  ssr: false,
  loading: () => <RoleLoader role="cliente" />,
});

export default function TiendaPage() {
  const [userName, setUserName] = useState('Tienda');
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

  return <TiendaApp isDark={isDark} toggleTheme={toggleTheme} onLogout={onLogout} userName={userName} />;
}
