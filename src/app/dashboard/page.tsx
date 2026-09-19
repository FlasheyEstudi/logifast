'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { aplicarTema } from '@/store/configStore';

const Dashboard = dynamic(() => import('../dashboard'), { ssr: false });

export default function DashboardPage() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    aplicarTema(isDark ? 'dark' : 'light');
  }, [isDark]);

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

  return <Dashboard isDark={isDark} toggleTheme={toggleTheme} onLogout={onLogout} />;
}
