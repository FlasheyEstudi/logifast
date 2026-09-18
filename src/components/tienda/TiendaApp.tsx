'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [moduloActivo, setModuloActivo] = useState<TiendaModulo>('inventario');
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
    <div className="min-h-screen w-full bg-[var(--bg)] text-[var(--text)] font-sans transition-colors duration-200 selection:bg-primary/20">
      {/* ─── Encabezado Back-Office Superior ─── */}
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

      {/* ─── Área Principal de Contenido (Full Width, Centrada y Respaldada) ─── */}
      <main className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-6 pb-28 lg:pb-8">
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
      </main>
    </div>
  );
}

export default TiendaApp;
