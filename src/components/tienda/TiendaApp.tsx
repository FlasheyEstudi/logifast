'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Store } from '@/components/icons';
import {
  TiendaNavbar,
  type TiendaModulo,
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
      className={`min-h-screen w-full bg-[#f8fafc] dark:bg-[#0b0d13] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200 selection:bg-blue-500/20 relative`}
    >
      {/* ═══════════════════════════════════════════════
          CÁPSULA FLOTANTE SUPERIOR IZQUIERDA (Identidad Tienda Estilo Mac)
          ═══════════════════════════════════════════════ */}
      <div className="fixed top-3 left-3 sm:left-6 z-40 flex items-center gap-3 px-3.5 py-2 rounded-full bg-white/85 dark:bg-[#0f111a]/85 backdrop-blur-2xl border border-white/60 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/40 transition-all select-none pointer-events-auto">
        {/* Avatar miniatura con indicador de estado */}
        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm border border-white/60 dark:border-white/20">
          {tiendaImagenUrl ? (
            <img
              src={tiendaImagenUrl}
              alt={tiendaNombre}
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Store size={18} />
          )}
          {/* Indicador de conexión / actividad comercial */}
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#0f111a] ${
              isAbierta ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            title={isAbierta ? 'Tienda Abierta' : 'Tienda Pausada'}
          />
        </div>

        {/* Datos y estado del comercio */}
        <div className="flex flex-col min-w-0 pr-1">
          <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate max-w-[130px] sm:max-w-[220px] leading-tight font-syne">
            {tiendaNombre || 'Mi Tienda'}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 capitalize truncate">
              {tiendaCategoria}
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full leading-none font-mono ${
                isAbierta
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}
            >
              {isAbierta ? 'En línea' : 'Pausada'}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          DOCK FLOTANTE VERTICAL ESTILO MAC (Lado Derecho de la Pantalla)
          ═══════════════════════════════════════════════ */}
      <aside
        aria-label="Dock Flotante Estilo Mac"
        className="fixed right-2.5 sm:right-4 top-1/2 -translate-y-1/2 z-50 pointer-events-auto select-none"
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

      {/* ═══════════════════════════════════════════════
          ÁREA DE CONTENIDO DE MÓDULOS (ESPACIO 100% EXCLUSIVO A LA DERECHA)
          El padding derecho pr-[76px] sm:pr-[92px] lg:pr-[104px] garantiza
          que ningún módulo, tarjeta, tabla ni botón flotante colisione con el dock.
          ═══════════════════════════════════════════════ */}
      <main className="w-full min-h-screen pt-20 pb-16 pl-3 sm:pl-6 lg:pl-8 pr-[76px] sm:pr-[92px] lg:pr-[104px] overflow-x-hidden">
        <div className="w-full max-w-[1600px] mx-auto">
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
    </div>
  );
}

export default TiendaApp;
