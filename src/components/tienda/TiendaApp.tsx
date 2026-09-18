'use client';

import React, { useState, useEffect, useCallback, Component } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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
import { AlertCircle, RefreshCw } from '@/components/icons';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TiendaAppProps {
  isDark: boolean;
  toggleTheme: () => void;
  onLogout: () => void;
  onReturnToClient?: () => void;
  userName?: string;
}

// Error Boundary local para aislar fallos en módulos de la tienda
class TiendaModuloErrorBoundary extends Component<
  { children: React.ReactNode; modulo: string; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error(`[TiendaApp Error en ${this.props.modulo}]:`, error, errorInfo);
  }

  componentDidUpdate(prevProps: any) {
    if (prevProps.modulo !== this.props.modulo && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full bg-[var(--surface)] border-[var(--peligro)] shadow-[var(--lf-shadow-card)] my-6">
          <CardContent className="p-8 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-[var(--lf-card-radius)] bg-[var(--peligro)]/10 text-[var(--peligro)] flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-[var(--text)] font-syne">
                Error al cargar el módulo
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Ocurrió un problema inesperado en este apartado ({this.props.modulo}). Puedes reintentar o navegar a otro módulo.
              </p>
            </div>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              size="sm"
              className="gap-2 font-bold"
            >
              <RefreshCw size={14} />
              <span>Reintentar módulo</span>
            </Button>
          </CardContent>
        </Card>
      );
    }
    return this.props.children;
  }
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

  const renderModulo = () => {
    switch (moduloActivo) {
      case 'kds':
        return <TiendaKDS isDark={isDark} categoriaTienda={tiendaCategoria} />;
      case 'pos':
        return <TiendaPOS isDark={isDark} />;
      case 'inventario':
        return <TiendaInventario isDark={isDark} categoriaTienda={tiendaCategoria} />;
      case 'kardex':
        return <TiendaKardex isDark={isDark} />;
      case 'facturacion':
        return <TiendaFacturacion isDark={isDark} />;
      case 'reportes':
        return <TiendaReportesExcel isDark={isDark} />;
      case 'estadisticas':
        return <TiendaEstadisticas isDark={isDark} />;
      case 'configuracion':
        return <TiendaConfiguracion isDark={isDark} />;
      default:
        return <TiendaInventario isDark={isDark} categoriaTienda={tiendaCategoria} />;
    }
  };

  return (
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
    >
      <TiendaModuloErrorBoundary modulo={moduloActivo} onReset={cargarPerfil}>
        <AnimatePresence mode="wait">
          <motion.div
            key={moduloActivo}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="w-full"
          >
            {renderModulo()}
          </motion.div>
        </AnimatePresence>
      </TiendaModuloErrorBoundary>
    </TiendaNavbar>
  );
}

export default TiendaApp;
