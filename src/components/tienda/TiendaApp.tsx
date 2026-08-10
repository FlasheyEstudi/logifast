'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TiendaNavbar, type TiendaModulo } from './TiendaNavbar';
import { TiendaKDS } from './TiendaKDS';
import { TiendaInventario } from './TiendaInventario';
import { TiendaKardex } from './TiendaKardex';
import { TiendaPOS } from './TiendaPOS';
import { TiendaFacturacion } from './TiendaFacturacion';
import { TiendaReportesExcel } from './TiendaReportesExcel';
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
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text)',
        fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Layout Navbar Dedicado Propio para Tiendas */}
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

      {/* Main Module Content View */}
      <main className="w-[96%] sm:w-[98%] lg:w-full max-w-[1400px] mx-auto pt-20 pb-36 px-2 sm:px-4">
        {moduloActivo === 'kds' && <TiendaKDS isDark={isDark} categoriaTienda={tiendaCategoria} />}
        {moduloActivo === 'inventario' && <TiendaInventario isDark={isDark} categoriaTienda={tiendaCategoria} />}
        {moduloActivo === 'kardex' && <TiendaKardex isDark={isDark} />}
        {moduloActivo === 'pos' && <TiendaPOS isDark={isDark} />}
        {moduloActivo === 'facturacion' && <TiendaFacturacion isDark={isDark} />}
        {moduloActivo === 'reportes' && <TiendaReportesExcel isDark={isDark} />}
        {moduloActivo === 'configuracion' && <TiendaConfiguracion isDark={isDark} />}
      </main>
    </div>
  );
}

export default TiendaApp;
