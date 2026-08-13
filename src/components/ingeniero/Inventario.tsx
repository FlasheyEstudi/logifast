// components/ingeniero/Inventario.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIngenieroStore, type Repuesto } from '@/store/ingenieroStore';
import EmptyState from '@/components/ui/EmptyState';
import { notify } from '@/lib/notify';

const CATEGORIAS = ['TODAS', 'ACEITE', 'FRENO', 'LLANTA', 'CADENA', 'ELECTRICO', 'MOTOR', 'GENERAL', 'OTRO'];

const CATEGORIA_ICONS: Record<string, string> = {
  ACEITE: '🛢️',
  FRENO: '🛑',
  LLANTA: '🛞',
  CADENA: '⛓️',
  ELECTRICO: '⚡',
  MOTOR: '⚙️',
  GENERAL: '📦',
  OTRO: '🔧',
};

interface InventarioProps {
  isTab?: boolean;
}

export default function Inventario({ isTab = false }: InventarioProps) {
  const store = useIngenieroStore();
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [soloBajoStock, setSoloBajoStock] = useState(false);
  const [sortBy, setSortBy] = useState<'nombre' | 'stock' | 'precio'>('nombre');

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState('ACEITE');
  const [formSku, setFormSku] = useState('');
  const [formPrecio, setFormPrecio] = useState('');
  const [formStock, setFormStock] = useState('10');
  const [formStockMin, setFormStockMin] = useState('5');
  const [formUnidad, setFormUnidad] = useState('pza');
  const [formProveedor, setFormProveedor] = useState('');
  const [formUbicacion, setFormUbicacion] = useState('');
  const [formCompatible, setFormCompatible] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // When store triggers showAgregarRepuesto from elsewhere
  React.useEffect(() => {
    if (store.showAgregarRepuesto) {
      if (store.repuestoAEditar) {
        handleOpenEdit(store.repuestoAEditar);
      } else {
        handleOpenCreate();
      }
    }
  }, [store.showAgregarRepuesto, store.repuestoAEditar]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormNombre('');
    setFormCategoria('ACEITE');
    setFormSku(`SKU-${Date.now().toString().slice(-5)}`);
    setFormPrecio('250');
    setFormStock('10');
    setFormStockMin('5');
    setFormUnidad('pza');
    setFormProveedor('Distribuidora Central');
    setFormUbicacion('Estante A-1');
    setFormCompatible('Honda Wave 110, Yamaha YBR 125');
    setFormOpen(true);
  };

  const handleOpenEdit = (r: Repuesto) => {
    setEditingId(r.id);
    setFormNombre(r.nombre);
    setFormCategoria(r.categoria || 'GENERAL');
    setFormSku(r.sku || '');
    setFormPrecio(String(r.precioUnitario || ''));
    setFormStock(String(r.stock || '0'));
    setFormStockMin(String(r.stockMinimo || '5'));
    setFormUnidad(r.unidad || 'pza');
    setFormProveedor(r.proveedor || '');
    setFormUbicacion(r.ubicacion || '');
    setFormCompatible(Array.isArray(r.compatibleCon) ? r.compatibleCon.join(', ') : '');
    setFormOpen(true);
  };

  const handleSaveRepuesto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      notify.error('El nombre del repuesto es obligatorio');
      return;
    }
    setSubmitting(true);
    try {
      const compatibleList = formCompatible
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        nombre: formNombre.trim(),
        categoria: formCategoria.toUpperCase(),
        sku: formSku.trim() || undefined,
        precioUnitario: parseFloat(formPrecio) || 0,
        stock: parseInt(formStock) || 0,
        stockMinimo: parseInt(formStockMin) || 5,
        unidad: formUnidad.trim() || 'pza',
        proveedor: formProveedor.trim() || undefined,
        ubicacion: formUbicacion.trim() || undefined,
        compatibleCon: compatibleList,
      };

      if (editingId) {
        await store.editarRepuesto(editingId, payload);
        notify.success('Repuesto actualizado correctamente');
      } else {
        await store.agregarRepuesto(payload);
        notify.success('Nuevo repuesto agregado al inventario');
      }
      setFormOpen(false);
      store.setRepuestoAEditar(null);
    } catch (err) {
      console.error(err);
      notify.error('Error al guardar repuesto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (id: string, currentStock: number, delta: number) => {
    const nextStock = Math.max(0, currentStock + delta);
    await store.actualizarStock(id, nextStock);
    notify.success(`Stock actualizado: ${nextStock} unidades`);
  };

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el repuesto "${nombre}"?`)) {
      await store.eliminarRepuesto(id);
      notify.success('Repuesto eliminado');
    }
  };

  const repuestosFiltrados = useMemo(() => {
    let result = store.repuestos.filter((r) => {
      const matchBusqueda =
        !busqueda ||
        r.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.sku || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.proveedor || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (r.ubicacion || '').toLowerCase().includes(busqueda.toLowerCase());

      const matchCat = filtroCategoria === 'TODAS' || r.categoria.toUpperCase() === filtroCategoria.toUpperCase();
      const matchBajo = !soloBajoStock || r.stock <= r.stockMinimo;

      return matchBusqueda && matchCat && matchBajo;
    });

    if (sortBy === 'nombre') {
      result = [...result].sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortBy === 'stock') {
      result = [...result].sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'precio') {
      result = [...result].sort((a, b) => b.precioUnitario - a.precioUnitario);
    }

    return result;
  }, [store.repuestos, busqueda, filtroCategoria, soloBajoStock, sortBy]);

  // KPIs
  const totalRepuestos = store.repuestos.length;
  const totalValor = store.repuestos.reduce((s, r) => s + (r.precioUnitario || 0) * (r.stock || 0), 0);
  const bajoStockCount = store.repuestos.filter((r) => r.stock <= r.stockMinimo).length;

  if (!isTab && !store.showInventario) return null;

  const content = (
    <div className="inventario-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!isTab && (
            <button
              onClick={() => store.toggleInventario()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: '1px solid var(--lf-border, #e5e7eb)',
                background: 'var(--lf-surface, #ffffff)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ←
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: 'var(--lf-text-main, #1a1a2e)' }}>
              Inventario & Repuestos
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lf-text-muted, #6B7280)' }}>
              Control de almacén, suministros y piezas de recambio de la flota
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          style={{
            padding: '10px 20px',
            borderRadius: 12,
            border: 'none',
            background: 'var(--lf-accent, #FF5722)',
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,87,34,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> Nuevo Repuesto
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <div style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(0, 102, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            📦
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: 'var(--lf-text-main, #1a1a2e)' }}>
              {totalRepuestos}
            </div>
            <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 600 }}>Ítems en Catálogo</div>
          </div>
        </div>

        <div style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255, 179, 0, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            ⚠️
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: bajoStockCount > 0 ? '#FFB300' : '#10B981' }}>
              {bajoStockCount}
            </div>
            <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 600 }}>Bajo Stock Mínimo</div>
          </div>
        </div>

        <div style={{ background: 'var(--lf-surface, #ffffff)', padding: 16, borderRadius: 16, border: '1px solid var(--lf-border, #e5e7eb)', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            💵
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#10B981' }}>
              C$ {totalValor.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--lf-text-muted, #6B7280)', fontWeight: 600 }}>Valoración Total</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search box */}
          <div
            style={{
              flex: 1,
              minWidth: 260,
              display: 'flex',
              alignItems: 'center',
              background: 'var(--lf-surface, #ffffff)',
              borderRadius: 12,
              padding: '8px 14px',
              border: '1px solid var(--lf-border, #e5e7eb)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
            }}
          >
            <span style={{ fontSize: 15, marginRight: 8, color: '#94A3B8' }}>🔍</span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por repuesto, SKU, proveedor o ubicación..."
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                background: 'transparent',
                color: 'var(--lf-text-main, #1a1a2e)',
              }}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                ✕
              </button>
            )}
          </div>

          {/* Quick Low Stock filter toggle */}
          <button
            onClick={() => setSoloBajoStock((p) => !p)}
            style={{
              padding: '8px 14px',
              borderRadius: 12,
              border: `1px solid ${soloBajoStock ? '#FFB300' : 'var(--lf-border, #e5e7eb)'}`,
              background: soloBajoStock ? 'rgba(255, 179, 0, 0.12)' : 'var(--lf-surface, #ffffff)',
              color: soloBajoStock ? '#D97706' : 'var(--lf-text-muted, #6B7280)',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>⚠️ Solo Bajo Stock</span>
          </button>

          {/* Sorter */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 12,
              border: '1px solid var(--lf-border, #e5e7eb)',
              background: 'var(--lf-surface, #ffffff)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--lf-text-main, #1a1a2e)',
              cursor: 'pointer',
            }}
          >
            <option value="nombre">Ordenar: Nombre (A-Z)</option>
            <option value="stock">Ordenar: Menor Stock</option>
            <option value="precio">Ordenar: Mayor Precio</option>
          </select>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {CATEGORIAS.map((cat) => {
            const count =
              cat === 'TODAS'
                ? store.repuestos.length
                : store.repuestos.filter((r) => r.categoria.toUpperCase() === cat).length;
            const isSelected = filtroCategoria === cat;
            return (
              <button
                key={cat}
                onClick={() => setFiltroCategoria(cat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 999,
                  border: `1px solid ${isSelected ? 'var(--lf-accent, #FF5722)' : 'var(--lf-border, #e5e7eb)'}`,
                  background: isSelected ? 'var(--lf-accent, #FF5722)' : 'var(--lf-surface, #ffffff)',
                  color: isSelected ? '#ffffff' : 'var(--lf-text-muted, #6B7280)',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <span>{CATEGORIA_ICONS[cat] || '📦'}</span>
                <span>{cat.charAt(0) + cat.slice(1).toLowerCase()}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 99,
                    background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--lf-bg, #f1f5f9)',
                    color: isSelected ? '#ffffff' : 'inherit',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Spare Parts */}
      {repuestosFiltrados.length === 0 ? (
        <EmptyState
          icono={<span style={{ fontSize: 32 }}>📦</span>}
          titulo="No se encontraron repuestos"
          descripcion="Prueba ajustando los filtros de búsqueda o agrega un nuevo repuesto al inventario."
          accionLabel="+ Agregar Repuesto"
          onAccion={handleOpenCreate}
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {repuestosFiltrados.map((rep) => {
            const isLowStock = rep.stock <= rep.stockMinimo;
            const stockPct = Math.min(100, Math.round((rep.stock / (rep.stockMinimo * 2 || 1)) * 100));

            return (
              <div
                key={rep.id}
                style={{
                  background: 'var(--lf-surface, #ffffff)',
                  borderRadius: 16,
                  border: `1px solid ${isLowStock ? 'rgba(255, 179, 0, 0.4)' : 'var(--lf-border, #e5e7eb)'}`,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isLowStock && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'linear-gradient(90deg, #FFB300, #FF1744)',
                    }}
                  />
                )}

                {/* Top: Category and SKU */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{CATEGORIA_ICONS[rep.categoria.toUpperCase()] || '📦'}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: 'var(--lf-bg, #f1f5f9)',
                        color: 'var(--lf-text-muted, #64748B)',
                        textTransform: 'uppercase',
                      }}
                    >
                      {rep.categoria}
                    </span>
                  </div>

                  {rep.sku && (
                    <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--lf-text-muted, #94A3B8)', fontWeight: 700 }}>
                      {rep.sku}
                    </span>
                  )}
                </div>

                {/* Name and Price */}
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: 'var(--lf-text-main, #1a1a2e)' }}>
                    {rep.nombre}
                  </h3>
                  <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'DM Mono', monospace", color: '#10B981' }}>
                    C$ {(rep.precioUnitario || 0).toLocaleString()}{' '}
                    <span style={{ fontSize: 11, color: 'var(--lf-text-muted, #94A3B8)', fontWeight: 500 }}>
                      / {rep.unidad || 'pza'}
                    </span>
                  </div>
                </div>

                {/* Details (Location & Supplier) */}
                <div style={{ fontSize: 11, color: 'var(--lf-text-muted, #64748B)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {rep.ubicacion && <div>📍 Ubicación: <strong>{rep.ubicacion}</strong></div>}
                  {rep.proveedor && <div>🏢 Proveedor: <strong>{rep.proveedor}</strong></div>}
                </div>

                {/* Stock Bar & Counter */}
                <div style={{ background: 'var(--lf-bg, #f8fafc)', padding: 10, borderRadius: 12, border: '1px solid var(--lf-border, #e2e8f0)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: isLowStock ? '#D97706' : 'var(--lf-text-main, #334155)' }}>
                      {isLowStock ? '⚠️ Stock Crítico' : '✅ Stock Disponible'}
                    </span>
                    <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "'DM Mono', monospace" }}>
                      {rep.stock} / min: {rep.stockMinimo} {rep.unidad}
                    </span>
                  </div>
                  {/* Visual Bar */}
                  <div style={{ width: '100%', height: 6, borderRadius: 99, background: '#E2E8F0', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${stockPct}%`,
                        height: '100%',
                        background: isLowStock ? '#FFB300' : '#10B981',
                        borderRadius: 99,
                      }}
                    />
                  </div>
                </div>

                {/* Bottom: Fast +/- stock buttons and Edit/Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, paddingTop: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--lf-text-muted, #94A3B8)', marginRight: 4 }}>Ajustar:</span>
                    <button
                      onClick={() => handleAdjustStock(rep.id, rep.stock, -1)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: '1px solid var(--lf-border, #e2e8f0)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 14,
                      }}
                      title="Restar 1"
                    >
                      -
                    </button>
                    <button
                      onClick={() => handleAdjustStock(rep.id, rep.stock, 1)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 6,
                        border: '1px solid var(--lf-border, #e2e8f0)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 800,
                        fontSize: 14,
                        color: '#10B981',
                      }}
                      title="Sumar 1"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleAdjustStock(rep.id, rep.stock, 5)}
                      style={{
                        padding: '2px 6px',
                        borderRadius: 6,
                        border: '1px solid var(--lf-border, #e2e8f0)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 10,
                        color: 'var(--lf-accent, #FF5722)',
                      }}
                      title="Sumar 5"
                    >
                      +5
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => handleOpenEdit(rep)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 8,
                        border: '1px solid var(--lf-border, #e2e8f0)',
                        background: '#ffffff',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: 'var(--lf-text-main, #334155)',
                      }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(rep.id, rep.nombre)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: '#EF4444',
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CREATE / EDIT REPUESTO MODAL ── */}
      <AnimatePresence>
        {formOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitting && setFormOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(8px)',
              }}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: 520,
                background: 'var(--lf-surface, #ffffff)',
                borderRadius: 20,
                padding: 24,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                zIndex: 10000,
                border: '1px solid var(--lf-border, #e5e7eb)',
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--lf-text-main, #1a1a2e)' }}>
                  {editingId ? 'Editar Repuesto' : 'Registrar Nuevo Repuesto'}
                </h2>
                <button
                  onClick={() => !submitting && setFormOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94A3B8' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveRepuesto} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                    Nombre del Repuesto *
                  </label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Aceite Sintético 10W-40 1L"
                    required
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Categoría
                    </label>
                    <select
                      value={formCategoria}
                      onChange={(e) => setFormCategoria(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13 }}
                    >
                      <option value="ACEITE">🛢️ Aceite / Lubricante</option>
                      <option value="FRENO">🛑 Frenos</option>
                      <option value="LLANTA">🛞 Llantas y Ruedas</option>
                      <option value="CADENA">⛓️ Transmisión / Cadena</option>
                      <option value="ELECTRICO">⚡ Sistema Eléctrico</option>
                      <option value="MOTOR">⚙️ Motor y Mecánica</option>
                      <option value="GENERAL">📦 Accesorios / General</option>
                      <option value="OTRO">🔧 Otros</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Código SKU / Referencia
                    </label>
                    <input
                      type="text"
                      value={formSku}
                      onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                      placeholder="Ej: ACE-1040-1L"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Precio (C$) *
                    </label>
                    <input
                      type="number"
                      value={formPrecio}
                      onChange={(e) => setFormPrecio(e.target.value)}
                      placeholder="250"
                      required
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      value={formStock}
                      onChange={(e) => setFormStock(e.target.value)}
                      placeholder="10"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      value={formStockMin}
                      onChange={(e) => setFormStockMin(e.target.value)}
                      placeholder="5"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Unidad de Medida
                    </label>
                    <input
                      type="text"
                      value={formUnidad}
                      onChange={(e) => setFormUnidad(e.target.value)}
                      placeholder="Ej: litro, pza, juego"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                      Ubicación en Almacén
                    </label>
                    <input
                      type="text"
                      value={formUbicacion}
                      onChange={(e) => setFormUbicacion(e.target.value)}
                      placeholder="Ej: Estante B-2, Bodega 1"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={formProveedor}
                    onChange={(e) => setFormProveedor(e.target.value)}
                    placeholder="Ej: Distribuidora Lubricantes SA"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted, #6B7280)', marginBottom: 4, display: 'block' }}>
                    Motos Compatibles (Separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formCompatible}
                    onChange={(e) => setFormCompatible(e.target.value)}
                    placeholder="Ej: Honda Wave 110, Yamaha YBR 125"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', fontSize: 13, outline: 'none' }}
                  />
                </div>

                <div style={{ marginTop: 12, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    disabled={submitting}
                    style={{ padding: '9px 16px', borderRadius: 10, border: '1px solid var(--lf-border, #e5e7eb)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'var(--lf-accent, #FF5722)', color: '#ffffff', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
                  >
                    {submitting ? 'Guardando...' : editingId ? 'Actualizar Repuesto' : 'Guardar en Inventario'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  if (isTab) {
    return content;
  }

  return (
    <div
      className="inventario-modal-fullscreen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 150,
        overflowY: 'auto',
        background: 'var(--lf-bg, #f8f9fa)',
        padding: '24px 20px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>{content}</div>
    </div>
  );
}
