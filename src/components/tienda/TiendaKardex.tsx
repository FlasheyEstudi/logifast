'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  SlidersHorizontal,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Package,
  Search,
  X,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
} from '@/components/icons';
import { notify } from '@/lib/notify';
import type { Producto } from './TiendaInventario';

interface MovimientoKardex {
  id: string;
  tipo: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  costoUnitario?: number | null;
  precioVenta?: number | null;
  motivo?: string | null;
  createdAt: string;
  producto?: {
    id: string;
    nombre: string;
    codigoBarras?: string | null;
    unidadMedida?: string | null;
  };
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM CONSTANTS (LOGIFAST 2.0 UNIFIED)
   ═══════════════════════════════════════════════ */

const sectionCard: React.CSSProperties = {
  background: 'var(--surface)',
  borderRadius: 'var(--lf-card-radius, 20px)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--lf-shadow-card)',
  padding: 20,
};

const statCard = (accentColor = 'var(--primario)'): React.CSSProperties => ({
  background: 'var(--surface)',
  borderRadius: 16,
  border: '1px solid var(--border)',
  borderLeft: `4px solid ${accentColor}`,
  padding: '16px 20px',
  boxShadow: 'var(--lf-shadow-card)',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
});

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 16px',
  borderRadius: 'var(--lf-input-radius, 14px)',
  border: '1px solid var(--border)',
  background: 'var(--bg-alt)',
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  outline: 'none',
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 20px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: 'none',
  background: 'var(--primario)',
  color: '#FFFFFF',
  fontWeight: 600,
  fontSize: 14,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxShadow: '0 4px 14px rgba(0, 122, 255, 0.25)',
  transition: 'all 0.2s ease',
};

const btnSecondary: React.CSSProperties = {
  padding: '9px 16px',
  borderRadius: 'var(--lf-button-radius, 14px)',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text)',
  fontWeight: 600,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'all 0.2s ease',
};

export function TiendaKardex({ isDark }: { isDark: boolean }) {
  const [movimientos, setMovimientos] = useState<MovimientoKardex[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entradas' | 'salidas' | 'ajustes'>('todos');

  // Form Movimiento
  const [productoId, setProductoId] = useState('');
  const [tipo, setTipo] = useState<'ENTRADA' | 'SALIDA' | 'AJUSTE'>('ENTRADA');
  const [cantidad, setCantidad] = useState('');
  const [motivo, setMotivo] = useState('');
  const [costoUnitario, setCostoUnitario] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [resKardex, resProds] = await Promise.all([
        fetch('/api/tienda/kardex'),
        fetch('/api/tienda/productos'),
      ]);

      if (resKardex.ok) {
        const dataK = await resKardex.json();
        if (dataK.ok) setMovimientos(dataK.movimientos || []);
      }

      if (resProds.ok) {
        const dataP = await resProds.json();
        if (dataP.ok) {
          setProductos(dataP.productos || []);
          if (dataP.productos.length > 0 && !productoId) {
            setProductoId(dataP.productos[0].id);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) {
      notify.error('Selecciona un producto');
      return;
    }
    if (!cantidad || Number(cantidad) <= 0) {
      notify.error('Ingresa una cantidad válida mayor a cero');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/tienda/kardex', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId,
          tipo,
          cantidad: Number(cantidad),
          motivo,
          costoUnitario: Number(costoUnitario) || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('Movimiento Kardex registrado exitosamente');
        setModalOpen(false);
        setCantidad('');
        setMotivo('');
        cargarDatos();
      } else {
        notify.error(data.error || 'Error al registrar movimiento');
      }
    } catch (err) {
      notify.error('Error de conexión');
    } finally {
      setSubmitting(false);
    }
  };

  // Resumen Kardex KPI
  const stats = useMemo(() => {
    let cantEntradas = 0;
    let cantSalidas = 0;
    let cantAjustes = 0;

    movimientos.forEach((m) => {
      if (m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE') {
        cantEntradas += m.cantidad;
      } else if (
        m.tipo === 'SALIDA' ||
        m.tipo === 'VENTA_POS' ||
        m.tipo === 'VENTA_DELIVERY' ||
        m.tipo === 'MERMA'
      ) {
        cantSalidas += m.cantidad;
      } else if (m.tipo === 'AJUSTE') {
        cantAjustes += m.cantidad;
      }
    });

    return {
      total: movimientos.length,
      cantEntradas,
      cantSalidas,
      cantAjustes,
    };
  }, [movimientos]);

  // Filtrado
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const matchBusqueda =
        (m.producto?.nombre && m.producto.nombre.toLowerCase().includes(busqueda.toLowerCase())) ||
        (m.producto?.codigoBarras && m.producto.codigoBarras.includes(busqueda)) ||
        (m.motivo && m.motivo.toLowerCase().includes(busqueda.toLowerCase()));

      let matchTipo = true;
      if (filtroTipo === 'entradas') {
        matchTipo = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
      } else if (filtroTipo === 'salidas') {
        matchTipo =
          m.tipo === 'SALIDA' ||
          m.tipo === 'VENTA_POS' ||
          m.tipo === 'VENTA_DELIVERY' ||
          m.tipo === 'MERMA';
      } else if (filtroTipo === 'ajustes') {
        matchTipo = m.tipo === 'AJUSTE';
      }

      return matchBusqueda && matchTipo;
    });
  }, [movimientos, busqueda, filtroTipo]);

  const prodSeleccionado = productos.find((p) => p.id === productoId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── 1. KPI STAT CARDS ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Movimientos */}
        <div style={statCard('var(--primario)')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--primario-soft, rgba(0, 122, 255, 0.1))',
            color: 'var(--primario)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <SlidersHorizontal size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Total Movimientos</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
              {stats.total}
            </span>
          </div>
        </div>

        {/* Entradas */}
        <div style={statCard('#34C759')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(52, 199, 89, 0.12)',
            color: '#34C759',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ArrowDownLeft size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Entradas (Stock)</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#34C759' }}>
              +{stats.cantEntradas}
            </span>
          </div>
        </div>

        {/* Salidas */}
        <div style={statCard('#FF3B30')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255, 59, 48, 0.12)',
            color: '#FF3B30',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <ArrowUpRight size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Salidas / Ventas</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#FF3B30' }}>
              -{stats.cantSalidas}
            </span>
          </div>
        </div>

        {/* Ajustes */}
        <div style={statCard('#FF9500')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255, 149, 0, 0.12)',
            color: '#FF9500',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <RotateCcw size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Ajustes Físicos</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: '#FF9500' }}>
              {stats.cantAjustes}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. HEADER & TOOLBAR DE AUDITORÍA ─── */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
              Kardex de Inventario & Auditoría
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Trazabilidad inmutable de entradas, salidas por ventas POS y ajustes de stock
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={cargarDatos}
              style={btnSecondary}
              title="Recargar movimientos"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>

            <button
              onClick={() => setModalOpen(true)}
              style={btnPrimary}
            >
              <Plus size={16} />
              <span>Registrar Movimiento</span>
            </button>
          </div>
        </div>

        {/* Buscador & Filtros */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar por producto, SKU o motivo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 40, paddingRight: busqueda ? 40 : 16 }}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'entradas', label: 'Entradas' },
                { id: 'salidas', label: 'Salidas' },
                { id: 'ajustes', label: 'Ajustes' },
              ] as const
            ).map((f) => {
              const active = filtroTipo === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFiltroTipo(f.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--lf-pill-radius, 100px)',
                    background: active ? 'var(--primario)' : 'var(--bg-alt)',
                    color: active ? '#FFFFFF' : 'var(--text-muted)',
                    border: active ? 'none' : '1px solid var(--border)',
                    fontWeight: 600,
                    fontSize: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── 3. CONTENIDO KARDEX (MÓVIL CARDS + DESKTOP TABLA) ─── */}
      {loading ? (
        <div style={{ ...sectionCard, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 border-3 border-[var(--primario)]/20 border-t-[var(--primario)] rounded-full animate-spin" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Cargando movimientos Kardex...</span>
          </div>
        </div>
      ) : movimientosFiltrados.length === 0 ? (
        <div style={{ ...sectionCard, padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <SlidersHorizontal size={44} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
            No se encontraron movimientos
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360 }}>
            Las compras, ventas POS y ajustes de stock quedarán registrados aquí automáticamente.
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════
              VISTA MÓVIL (Celular: Opción A - Tarjetas Táctiles)
              ═══════════════════════════════════════════════ */}
          <div className="block md:hidden space-y-3">
            {movimientosFiltrados.map((m) => {
              const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
              const esSalida =
                m.tipo === 'SALIDA' ||
                m.tipo === 'VENTA_POS' ||
                m.tipo === 'VENTA_DELIVERY' ||
                m.tipo === 'MERMA';

              return (
                <div
                  key={m.id}
                  style={{
                    ...sectionCard,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                        {m.producto?.nombre || 'Producto'}
                      </h4>
                      {m.producto?.codigoBarras && (
                        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                          SKU: {m.producto.codigoBarras}
                        </span>
                      )}
                    </div>

                    {/* Badge Píldora */}
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                        background: esEntrada ? 'rgba(52, 199, 89, 0.12)' : esSalida ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                        color: esEntrada ? '#34C759' : esSalida ? '#FF3B30' : '#FF9500',
                        display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0,
                      }}
                    >
                      {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                      {m.tipo}
                    </span>
                  </div>

                  {/* Resumen Numérico */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8,
                    padding: '8px 12px', borderRadius: 12, background: 'var(--bg-alt)',
                    border: '1px solid var(--border)', textAlign: 'center',
                  }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Anterior</span>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                        {m.stockAnterior}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Cambio</span>
                      <span style={{
                        fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                        color: esEntrada ? '#34C759' : esSalida ? '#FF3B30' : '#FF9500',
                      }}>
                        {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Nuevo</span>
                      <span style={{ fontSize: 13, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>
                        {m.stockNuevo}
                      </span>
                    </div>
                  </div>

                  {/* Detalle y Fecha */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)', paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                    </span>
                    <span style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {m.motivo || 'Operación comercial'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════
              VISTA ESCRITORIO / TABLET (Opción B - Back-Office Tabla Densa)
              ═══════════════════════════════════════════════ */}
          <div className="hidden md:block" style={{
            borderRadius: 16,
            border: '1px solid var(--border)',
            overflow: 'hidden',
            background: 'var(--surface)',
            boxShadow: 'var(--lf-shadow-card)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Fecha & Hora</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Producto / SKU</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Tipo Movimiento</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Cantidad</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Stock Ant.</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Nuevo Stock</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Motivo / Detalle</th>
                </tr>
              </thead>
              <tbody>
                {movimientosFiltrados.map((m) => {
                  const esEntrada = m.tipo === 'ENTRADA' || m.tipo === 'DEVOLUCION_CLIENTE';
                  const esSalida =
                    m.tipo === 'SALIDA' ||
                    m.tipo === 'VENTA_POS' ||
                    m.tipo === 'VENTA_DELIVERY' ||
                    m.tipo === 'MERMA';

                  return (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primario-soft, rgba(0, 122, 255, 0.04))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', whiteSpace: 'nowrap', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'var(--text-muted)' }}>
                        {new Date(m.createdAt).toLocaleDateString('es-NI')} {new Date(m.createdAt).toLocaleTimeString('es-NI', { timeStyle: 'short' })}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)', display: 'block' }}>
                          {m.producto?.nombre || 'Producto'}
                        </span>
                        {m.producto?.codigoBarras && (
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                            SKU: {m.producto.codigoBarras}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                            background: esEntrada ? 'rgba(52, 199, 89, 0.12)' : esSalida ? 'rgba(255, 59, 48, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                            color: esEntrada ? '#34C759' : esSalida ? '#FF3B30' : '#FF9500',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          {esEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                          {m.tipo}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800 }}>
                        <span style={{ color: esEntrada ? '#34C759' : esSalida ? '#FF3B30' : '#FF9500' }}>
                          {esEntrada ? `+${m.cantidad}` : `-${m.cantidad}`}
                        </span>
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                        {m.stockAnterior}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontWeight: 800, color: 'var(--primario)' }}>
                        {m.stockNuevo}
                      </td>

                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: 12 }}>
                        {m.motivo || 'Operación comercial estándar'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── MODAL REGISTRAR MOVIMIENTO KARDEX (ESTILO LOGIFAST 2.0) ─── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              ...sectionCard,
              width: '100%', maxWidth: 500, maxHeight: '90vh',
              overflowY: 'auto', padding: 24, borderRadius: 24,
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                  Registrar Movimiento Kardex
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  Ajuste manual, compra a proveedor o merma física
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)',
                  background: 'var(--bg-alt)', color: 'var(--text-muted)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={registrarMovimiento} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Producto */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  Producto a Afectar *
                </label>
                <select
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                  required
                >
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} (Stock actual: {p.stock ?? 0})
                    </option>
                  ))}
                </select>
                {prodSeleccionado && (
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0', fontFamily: "'JetBrains Mono', monospace" }}>
                    Stock en sistema: <b>{prodSeleccionado.stock ?? 0} {prodSeleccionado.unidadMedida || 'und'}</b>
                  </p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  Tipo de Operación *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[
                    { id: 'ENTRADA', label: 'Entrada', desc: 'Compra / Ingreso', color: '#34C759', icon: <ArrowDownLeft size={14} /> },
                    { id: 'SALIDA', label: 'Salida', desc: 'Merma / Baja', color: '#FF3B30', icon: <ArrowUpRight size={14} /> },
                    { id: 'AJUSTE', label: 'Ajuste', desc: 'Conteo Físico', color: '#FF9500', icon: <RotateCcw size={14} /> },
                  ].map((t) => {
                    const isSelected = tipo === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTipo(t.id as any)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: 12,
                          border: isSelected ? `2px solid ${t.color}` : '1px solid var(--border)',
                          background: isSelected ? 'var(--surface)' : 'var(--bg-alt)',
                          color: isSelected ? t.color : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 12 }}>
                          {t.icon} {t.label}
                        </span>
                        <span style={{ fontSize: 10, opacity: 0.8 }}>{t.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cantidad & Costo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Cantidad ({tipo === 'ENTRADA' ? '+ stock' : tipo === 'SALIDA' ? '- stock' : 'fijar'}) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="10"
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Costo Unitario (C$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    placeholder="C$ 0.00"
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  Motivo / Justificación
                </label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej: Factura Proveedor #4092, Conteo mensual..."
                  style={inputStyle}
                />
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ ...btnSecondary, flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ ...btnPrimary, flex: 2 }}
                >
                  {submitting ? 'Registrando...' : 'Registrar en Kardex'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TiendaKardex;
