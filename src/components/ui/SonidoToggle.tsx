'use client';

import React from 'react';
import { useConfigStore } from '@/store/configStore';
import { reproducirSonido } from '@/services/audio';
import { Switch } from '@/components/ui/switch';

/* ═══════════════════════════════════════════════
   INLINE SVG ICONS (no emojis, no lucide-react)
   ═══════════════════════════════════════════════ */

const SpeakerOnIcon = (
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
    <path d="M11 5L6 9H2v6h4l5 4z" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const SpeakerMutedIcon = (
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
    <path d="M11 5L6 9H2v6h4l5 4z" />
    <path d="M22 9l-6 6" />
    <path d="M16 9l6 6" />
  </svg>
);

const VolumeIcon = (
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
    <path d="M11 5L6 9H2v6h4l5 4z" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

/**
 * SonidoToggle — sound settings card.
 *
 *  - Main row: speaker icon + "Sonido" label + shadcn Switch bound
 *    to `sonidoActivo` (toggle plays the toggle_on chirp via the store).
 *  - Volume slider row (visible only when sound is on): native range
 *    input 0-100 + percentage readout.
 *  - "Probar sonido" button: plays the notificacion sound at the
 *    current volume so the user can preview.
 *
 * All state lives in the global configStore so it persists across
 * sessions.
 */
export function SonidoToggle() {
  const sonidoActivo = useConfigStore((s) => s.sonidoActivo);
  const volumenSonido = useConfigStore((s) => s.volumenSonido);
  const toggleSonido = useConfigStore((s) => s.toggleSonido);
  const setVolumen = useConfigStore((s) => s.setVolumen);

  const handleToggle = (checked: boolean) => {
    // The store's toggleSonido handles the toggle + chirp; we only
    // fire it when the desired state differs from the current one.
    if (checked !== sonidoActivo) {
      toggleSonido();
    }
  };

  const handleProbar = () => {
    reproducirSonido('notificacion', volumenSonido);
  };

  return (
    <div
      style={{
        background: 'var(--surface, #FFFFFF)',
        border: '1px solid var(--border, #E8E4DE)',
        borderRadius: 14,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* ─── Main toggle row ─── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          aria-hidden="true"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: sonidoActivo
              ? 'var(--primario-soft, rgba(255,87,34,0.05))'
              : 'var(--bg-alt, #F2EDE8)',
            color: sonidoActivo
              ? 'var(--primario, #FF5722)'
              : 'var(--text-muted, #8E8EA0)',
            flexShrink: 0,
          }}
        >
          {sonidoActivo ? SpeakerOnIcon : SpeakerMutedIcon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text, #1B1B2F)',
            }}
          >
            Sonido
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted, #8E8EA0)',
            }}
          >
            {sonidoActivo ? 'Activado' : 'Desactivado'}
          </div>
        </div>
        <Switch
          checked={sonidoActivo}
          onCheckedChange={handleToggle}
          aria-label="Activar sonido"
        />
      </div>

      {/* ─── Volume + test button (only when sound is on) ─── */}
      {sonidoActivo && (
        <>
          <div
            aria-hidden="true"
            style={{
              height: 1,
              background: 'var(--border, #E8E4DE)',
              margin: '0 -4px',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden="true"
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-alt, #F2EDE8)',
                color: 'var(--text-secondary, #5A5A72)',
                flexShrink: 0,
              }}
            >
              {VolumeIcon}
            </div>
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--text, #1B1B2F)',
                  }}
                >
                  Volumen
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted, #8E8EA0)',
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {volumenSonido}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={volumenSonido}
                onChange={(e) => setVolumen(Number(e.target.value))}
                aria-label="Volumen del sonido"
                style={{
                  width: '100%',
                  accentColor: 'var(--primario, #FF5722)',
                  cursor: 'pointer',
                  margin: 0,
                }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleProbar}
            style={{
              alignSelf: 'flex-start',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--border, #E8E4DE)',
              background: 'var(--bg-alt, #F2EDE8)',
              color: 'var(--text, #1B1B2F)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 0.18s ease, transform 0.12s ease',
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.97)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {SpeakerOnIcon}
            Probar sonido
          </button>
        </>
      )}
    </div>
  );
}
