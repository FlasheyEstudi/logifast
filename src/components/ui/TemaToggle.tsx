'use client';

import React from 'react';
import { useConfigStore, type Tema } from '@/store/configStore';

/* ═══════════════════════════════════════════════
   INLINE SVG ICONS (no emojis, no lucide-react)
   ═══════════════════════════════════════════════ */

const SunIcon = (
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
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="M4.93 4.93l1.41 1.41" />
    <path d="M17.66 17.66l1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="M4.93 19.07l1.41-1.41" />
    <path d="M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = (
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
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const MonitorIcon = (
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
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
  </svg>
);

/* ═══════════════════════════════════════════════
   OPTIONS
   ═══════════════════════════════════════════════ */

interface TemaOption {
  value: Tema;
  label: string;
  icon: React.ReactNode;
}

const OPTIONS: TemaOption[] = [
  { value: 'light', label: 'Claro', icon: SunIcon },
  { value: 'dark', label: 'Oscuro', icon: MoonIcon },
  { value: 'system', label: 'Sistema', icon: MonitorIcon },
];

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

/**
 * TemaToggle — 3-button segmented control (Claro / Oscuro / Sistema).
 * Reads `tema` and `setTema` from the global configStore so the choice
 * persists across sessions and is reflected everywhere in the app.
 */
export function TemaToggle() {
  const tema = useConfigStore((s) => s.tema);
  const setTema = useConfigStore((s) => s.setTema);

  return (
    <div
      role="radiogroup"
      aria-label="Selección de tema"
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        padding: 4,
        background: 'var(--bg-alt, #F2EDE8)',
        borderRadius: 14,
        width: '100%',
      }}
    >
      {OPTIONS.map((opt) => {
        const active = tema === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTema(opt.value)}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: active
                ? 'var(--surface, #FFFFFF)'
                : 'transparent',
              color: active
                ? 'var(--primario, #FF5722)'
                : 'var(--text-muted, #8E8EA0)',
              fontWeight: 600,
              fontSize: 13,
              fontFamily: 'inherit',
              boxShadow: active
                ? 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.04))'
                : 'none',
              transition:
                'background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease',
            }}
          >
            {opt.icon}
            <span>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
