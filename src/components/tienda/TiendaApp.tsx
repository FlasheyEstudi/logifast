'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  TiendaNavbar,
  type TiendaModulo,
  TIENDA_MODULO_LABELS,
} from './TiendaNavbar';
import { TiendaKDS } from './TiendaKDS';
import { TiendaInventario } from './TiendaInventario';
import { TiendaKardex } from './TiendaKardex';
import { TiendaPOS } from './TiendaPOS';
import { TiendaFacturacion } from './TiendaFacturacion';
import { TiendaReportesExcel } from './TiendaReportesExcel';
import { TiendaEstadisticas } from './TiendaEstadisticas';
import { TiendaConfiguracion } from './TiendaConfiguracion';

interface TiendaAppProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onReturnToClient?: () => void;
  userName?: string;
}

export function TiendaApp({
  isDark,
  toggleTheme,
  onLogout,
  onReturnToClient,
  userName,
}: TiendaAppProps) {
  const [moduloActivo, setModuloActivo] = useState<TiendaModulo>('kds');
  const [tiendaNombre, setTiendaNombre] = useState('Mi Tienda');
  const [tiendaCategoria, setTiendaCategoria] = useState('tienda');
  const [tiendaImagenUrl, setTiendaImagenUrl] = useState<string | null>(null);
  const [tiendaEstado, setTiendaEstado] = useState('activo');
  const [loading, setLoading] = useState(true);

  const cargarPerfil = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/perfil');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.tienda) {
        setTiendaNombre(data.tienda.nombre || 'Mi Tienda');
        setTiendaCategoria(data.tienda.categoria || 'tienda');
        setTiendaEstado(data.tienda.estado || 'activo');
        setTiendaImagenUrl(data.tienda.imagenUrl || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  const isAbierta = tiendaEstado === 'activo';

  return (
    <div
      className={`tienda-shell ${isDark ? 'dark' : 'light'}`}
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: 'var(--lf-bg-base, var(--bg, #f2f2f7))',
        color: 'var(--lf-text-main, var(--text, #1c1c1e))',
        fontFamily: "var(--font-dm-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ═══════════════════════════════════════════════
          HEADER SUPERIOR LOGIFAST (Idéntico a Dashboard & Ingeniero)
          ═══════════════════════════════════════════════ */}
      <header
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          background: 'var(--lf-surface, #ffffff)',
          borderBottom: '1px solid var(--lf-border, rgba(60, 60, 67, 0.12))',
          zIndex: 50,
        }}
      >
        {/* Left: Logo LF + LOGIFAST + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'var(--lf-accent, #007AFF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'JetBrains Mono', 'DM Mono', monospace",
                fontWeight: 700,
                fontSize: 14,
                color: '#ffffff',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              LF
            </div>
            <span
              className="font-serif"
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: 'var(--lf-text-main, #1c1c1e)',
                letterSpacing: '-0.02em',
              }}
            >
              LOGIFAST
            </span>
          </div>

          {/* Breadcrumb oficial */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginLeft: 6,
              paddingLeft: 12,
              borderLeft: '1px solid var(--lf-border, rgba(60, 60, 67, 0.12))',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--lf-text-muted, #8e8e93)' }}>
              Tienda
            </span>
            <span style={{ fontSize: 11, color: 'var(--lf-text-muted, #8e8e93)' }}>
              ›
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: 'var(--lf-text-main, #1c1c1e)',
              }}
            >
              {TIENDA_MODULO_LABELS[moduloActivo]}
            </span>
          </div>
        </div>

        {/* Right: Estado Operativo + Comercio + Atajo Salir */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Indicador de Estado Operativo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 8,
              background: isAbierta ? 'rgba(52, 199, 89, 0.09)' : 'rgba(255, 149, 0, 0.09)',
              border: `1px solid ${isAbierta ? 'rgba(52, 199, 89, 0.25)' : 'rgba(255, 149, 0, 0.25)'}`,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isAbierta ? 'var(--lf-success, #34C759)' : 'var(--lf-warning, #FF9500)',
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: isAbierta ? 'var(--lf-success, #34C759)' : 'var(--lf-warning, #FF9500)',
              }}
            >
              {isAbierta ? 'En línea' : 'Pausada'}
            </span>
          </div>

          <span
            className="hidden sm:inline"
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--lf-text-secondary, #8e8e93)',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tiendaNombre}
          </span>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════
          LAYOUT PRINCIPAL: WORKSPACE IZQUIERDO + NAVBAR DERECHO EXCLUSIVO
          ═══════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 56px)',
        }}
      >
        {/* ─── Área de Trabajo Principal (Lado Izquierdo) ───
            Scroll independiente y acotado 100% al interior de este contenedor. */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            height: '100%',
            overflowY: 'auto',
            padding: '16px',
            position: 'relative',
          }}
          className="no-scrollbar"
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              width: '100%',
              paddingBottom: 24,
            }}
          >
            {moduloActivo === 'kds' && (
              <TiendaKDS isDark={isDark} categoriaTienda={tiendaCategoria} />
            )}
            {moduloActivo === 'pos' && (
              <TiendaPOS isDark={isDark} />
            )}
            {moduloActivo === 'inventario' && (
              <TiendaInventario isDark={isDark} categoriaTienda={tiendaCategoria} />
            )}
            {moduloActivo === 'kardex' && (
              <TiendaKardex isDark={isDark} />
            )}
            {moduloActivo === 'facturacion' && (
              <TiendaFacturacion isDark={isDark} />
            )}
            {moduloActivo === 'reportes' && (
              <TiendaReportesExcel isDark={isDark} />
            )}
            {moduloActivo === 'estadisticas' && (
              <TiendaEstadisticas isDark={isDark} />
            )}
            {moduloActivo === 'configuracion' && (
              <TiendaConfiguracion isDark={isDark} />
            )}
          </div>
        </main>

        {/* ─── Navbar Vertical Exclusivo (Lado Derecho de la Pantalla) ───
            Espacio 100% exclusivo, rígido e impenetrable.
            Ningún módulo puede solapar ni deslizarse en esta columna. */}
        <aside
          aria-label="Barra de Navegación Lateral"
          className="w-[68px] lg:w-56 xl:w-60 shrink-0 h-full border-l border-[var(--border)] bg-[var(--surface)] z-40 flex flex-col justify-between select-none shadow-sm"
          style={{
            height: '100%',
            flexShrink: 0,
            borderLeft: '1px solid var(--lf-border, rgba(60, 60, 67, 0.12))',
            background: 'var(--lf-surface, #ffffff)',
            boxShadow: 'var(--lf-shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <TiendaNavbar
            isDark={isDark}
            toggleTheme={toggleTheme}
            onLogout={onLogout}
            onReturnToClient={onReturnToClient}
            tiendaNombre={tiendaNombre}
            tiendaCategoria={tiendaCategoria}
            tiendaImagenUrl={tiendaImagenUrl}
            tiendaEstado={tiendaEstado}
            moduloActivo={moduloActivo}
            onSelectModulo={(mod) => setModuloActivo(mod)}
          />
        </aside>
      </div>
    </div>
  );
}

export default TiendaApp;
