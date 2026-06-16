'use client';

import RepartidorShell from './RepartidorShell';

interface RepartidorAppProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
}

/**
 * Thin wrapper around RepartidorShell.
 * Preserves the props interface used by src/app/page.tsx so existing call sites don't break.
 */
export default function RepartidorApp({ isDark, toggleTheme, onLogout }: RepartidorAppProps) {
  return (
    <RepartidorShell
      isDark={isDark}
      toggleTheme={toggleTheme}
      onLogout={onLogout}
      userName="Carlos Martínez"
    />
  );
}
