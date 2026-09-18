'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TiendaNavbar, type TiendaModulo } from './TiendaNavbar';
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

export function TiendaApp({ isDark, toggleTheme, onLogout, onReturnToClient, userName }: TiendaAppProps) {
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

  return (
    <div
      className={`min-h-screen flex flex-row w-full bg-[var(--bg)] text-[var(--text)] overflow-x-hidden ${
        isDark ? 'dark' : 'light'
      }`}
      data-theme={isDark ? 'dark' : 'light'}
      style={{
        fontFamily: "var(--font-dm-sans), 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ─── Área Principal del Módulo Activo (Lado Izquierdo) ─── */}
      <main className="flex-1 min-w-0 min-h-screen p-3 sm:p-5 lg:p-6 xl:p-8 overflow-y-auto">
        <div className="w-full max-w-[1400px] mx-auto">
          {moduloActivo === 'kds' && (
            <TiendaKDS isDark={isDark} categoriaTienda={tiendaCategoria} />
          )}
          {moduloActivo === 'inventario' && (
            <TiendaInventario isDark={isDark} categoriaTienda={tiendaCategoria} />
          )}
          {moduloActivo === 'kardex' && (
            <TiendaKardex isDark={isDark} />
          )}
          {moduloActivo === 'pos' && (
            <TiendaPOS isDark={isDark} />
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

      {/* ─── Barra de Navegación Vertical Exclusiva (Lado Derecho) ───
          Reserva un espacio 100% físico e impenetrable en el layout.
          El contenido de los módulos no puede superponerse ni meterse en este carril. */}
      <aside
        aria-label="Panel Lateral de Navegación"
        className="w-[64px] sm:w-[72px] xl:w-64 shrink-0 h-screen sticky top-0 border-l border-[var(--border)] bg-[var(--surface)] z-40 flex flex-col justify-between select-none shadow-sm"
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
  );
}

export default TiendaApp;
