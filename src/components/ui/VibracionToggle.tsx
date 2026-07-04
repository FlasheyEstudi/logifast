'use client';

import React from 'react';
import { useConfigStore } from '@/store/configStore';
import { Switch } from '@/components/ui/switch';

const VibrateIcon = (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d="M2 8a10 10 0 0 1 20 0" />
    <path d="M5 12a7 7 0 0 1 14 0" />
    <path d="M8 16a4 4 0 0 1 8 0" />
    <circle cx="12" cy="20" r="1" />
  </svg>
);

export default function VibracionToggle() {
  const vibracionActiva = useConfigStore(s => s.vibracionActiva);
  const toggleVibracion = useConfigStore(s => s.toggleVibracion);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 0',
        borderBottom: '1px solid var(--md-outline-variant)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--md-surface-variant)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {VibrateIcon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Vibración</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Vibrar en acciones y alertas importantes</div>
      </div>
      <Switch checked={vibracionActiva} onCheckedChange={toggleVibracion} aria-label="Vibración" />
    </div>
  );
}
