'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sileo';
import { useConfigStore } from '@/store/configStore';

export default function SileoToaster() {
  const configTema = useConfigStore((s) => s.tema);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const computeTheme = (): 'light' | 'dark' => {
      if (typeof document === 'undefined') return 'dark';
      const domTheme = document.documentElement.getAttribute('data-theme');
      if (domTheme === 'dark' || domTheme === 'light') {
        return domTheme;
      }
      if (configTema === 'dark' || configTema === 'light') {
        return configTema;
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    };

    setTheme(computeTheme());

    const observer = new MutationObserver(() => {
      setTheme(computeTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    const handleMediaChange = () => setTheme(computeTheme());
    mql?.addEventListener?.('change', handleMediaChange);

    return () => {
      observer.disconnect();
      mql?.removeEventListener?.('change', handleMediaChange);
    };
  }, [configTema]);

  return (
    <Toaster
      position="top-center"
      theme={theme}
      options={{
        duration: 3200,
        roundness: 16,
      }}
    />
  );
}
