'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  DollarSign,
  TrendingUp,
  Tag,
  Layers,
  Sparkles,
  Printer,
} from '@/components/icons';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';
import { TiendaEtiquetasModal } from './TiendaEtiquetasModal';

export interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoriaNombre: string | null;
  precio: number;
  costo?: number | null;
  stock?: number | null;
  stockMinimo?: number | null;
  codigoBarras?: string | null;
  unidadMedida?: string | null;
  imagenUrl: string | null;
  portadaUrl?: string | null;
  disponible: boolean;
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

export function TiendaInventario({ isDark, categoriaTienda = 'tienda' }: { isDark: boolean; categoriaTienda?: string }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'publicados' | 'bajo_stock' | 'ocultos'>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);
  const [archivarConfirmId, setArchivarConfirmId] = useState<string | null>(null);

  // Modal de Etiquetas & Códigos (Barras / QR)
  const [etiquetasProd, setEtiquetasProd] = useState<Producto | null>(null);
  const [etiquetasModalOpen, setEtiquetasModalOpen] = useState(false);

  // Form State
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaNombre, setCategoriaNombre] = useState('General');
  const [precio, setPrecio] = useState('');
  const [costo, setCosto] = useState('');
  const [stock, setStock] = useState('');
  const [stockMinimo, setStockMinimo] = useState('5');
  const [codigoBarras, setCodigoBarras] = useState('');
  const [unidadMedida, setUnidadMedida] = useState('unidad');
  const [imagenUrl, setImagenUrl] = useState('');
  const [portadaUrl, setPortadaUrl] = useState('');
  const [disponible, setDisponible] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const cargarProductos = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/productos');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setProductos(data.productos || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const abrirModalCrear = () => {
    setEditingProd(null);
    setNombre('');
    setDescripcion('');
    setCategoriaNombre('General');
    setPrecio('');
    setCosto('');
    setStock('10');
    setStockMinimo('5');
    setCodigoBarras('');
    setUnidadMedida('unidad');
    setImagenUrl('');
    setPortadaUrl('');
    setDisponible(true);
    setModalOpen(true);
  };

  const abrirModalEditar = (p: Producto) => {
    setEditingProd(p);
    setNombre(p.nombre);
    setDescripcion(p.descripcion || '');
    setCategoriaNombre(p.categoriaNombre || 'General');
    setPrecio(String(p.precio));
    setCosto(p.costo ? String(p.costo) : '');
    setStock(p.stock !== null && p.stock !== undefined ? String(p.stock) : '0');
    setStockMinimo(p.stockMinimo !== null && p.stockMinimo !== undefined ? String(p.stockMinimo) : '5');
    setCodigoBarras(p.codigoBarras || '');
    setUnidadMedida(p.unidadMedida || 'unidad');
    setImagenUrl(p.imagenUrl || '');
    setPortadaUrl(p.portadaUrl || '');
    setDisponible(p.disponible);
    setModalOpen(true);
  };

  const abrirGeneradorEtiquetas = (p: Producto) => {
    setEtiquetasProd(p);
    setEtiquetasModalOpen(true);
  };

  const generarCodigoSku = () => {
    const randomSku = `744${Math.floor(100000000 + Math.random() * 900000000)}`;
    setCodigoBarras(randomSku);
    notify.info(`Código SKU generado: ${randomSku}`);
  };

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      notify.error('El nombre del producto es obligatorio');
      return;
    }
    if (!precio || Number(precio) <= 0) {
      notify.error('Ingresa un precio válido');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = !!editingProd;
      const url = '/api/tienda/productos';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProd?.id,
          nombre,
          descripcion,
          categoriaNombre,
          precio: Number(precio),
          costo: Number(costo) || 0,
          stock: Number(stock) || 0,
          stockMinimo: stockMinimo === '' ? 5 : Number(stockMinimo) || 0,
          codigoBarras,
          unidadMedida,
          imagenUrl,
          portadaUrl,
          disponible,
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success(isEdit ? 'Producto actualizado' : 'Producto creado en inventario');
        setModalOpen(false);
        cargarProductos();
      } else {
        notify.error(data.error || 'Error al guardar el producto');
      }
    } catch (err) {
      notify.error('Error de conexión con el servidor');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDisponible = async (p: Producto) => {
    try {
      const res = await fetch('/api/tienda/productos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, disponible: !p.disponible }),
      });
      if (res.ok) {
        notify.success(
          p.disponible
            ? 'Producto archivado del catálogo'
            : 'Producto publicado en el catálogo'
        );
        setArchivarConfirmId(null);
        cargarProductos();
      }
    } catch (e) {
      notify.error('Error de conexión');
    }
  };

  // Resumen Métricas KPI
  const stats = useMemo(() => {
    const total = productos.length;
    const publicados = productos.filter((p) => p.disponible).length;
    const bajoStock = productos.filter(
      (p) => p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5)
    ).length;
    const valorInventario = productos.reduce((acc, p) => {
      const cant = p.stock ?? 0;
      const c = p.costo ?? p.precio * 0.7;
      return acc + cant * c;
    }, 0);

    return { total, publicados, bajoStock, valorInventario };
  }, [productos]);

  // Categorías Únicas
  const categorias = useMemo(() => {
    const set = new Set<string>();
    productos.forEach((p) => {
      if (p.categoriaNombre && p.categoriaNombre.trim()) {
        set.add(p.categoriaNombre.trim());
      }
    });
    return ['todos', ...Array.from(set)];
  }, [productos]);

  // Filtrado de Productos
  const filtrados = productos.filter((p) => {
    const matchBusqueda =
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.codigoBarras && p.codigoBarras.includes(busqueda));

    const matchCat =
      categoriaSeleccionada === 'todos' ||
      (p.categoriaNombre && p.categoriaNombre.toLowerCase() === categoriaSeleccionada.toLowerCase());

    let matchEstado = true;
    if (filtroEstado === 'publicados') matchEstado = p.disponible;
    else if (filtroEstado === 'ocultos') matchEstado = !p.disponible;
    else if (filtroEstado === 'bajo_stock') {
      matchEstado = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);
    }

    return matchBusqueda && matchCat && matchEstado;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── 1. KPI STAT CARDS (ESTILO LOGIFAST 2.0 ADMIN/CLIENTE) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Productos */}
        <div style={statCard('var(--primario)')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--primario-soft, rgba(0, 122, 255, 0.1))',
            color: 'var(--primario)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Package size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Total Productos</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
              {stats.total}
            </span>
          </div>
        </div>

        {/* Publicados */}
        <div style={statCard('#34C759')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(52, 199, 89, 0.12)',
            color: '#34C759',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Eye size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Publicados</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
              {stats.publicados}
            </span>
          </div>
        </div>

        {/* Alerta Stock */}
        <div style={statCard('#FF9500')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(255, 149, 0, 0.12)',
            color: '#FF9500',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Alerta Stock</span>
            <span style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: stats.bajoStock > 0 ? '#FF9500' : 'var(--text)' }}>
              {stats.bajoStock}
            </span>
          </div>
        </div>

        {/* Valor Inventario */}
        <div style={statCard('#AF52DE')}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(175, 82, 222, 0.12)',
            color: '#AF52DE',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <TrendingUp size={22} />
          </div>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', display: 'block' }}>Valor Inventario</span>
            <span style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text)' }}>
              C$ {stats.valorInventario.toLocaleString('es-NI', { maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. TOOLBAR & CONTROLES DE INVENTARIO ─── */}
      <div style={sectionCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
              Gestión de Inventario & Catálogo
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Control de artículos, existencias, código de barras e impresión de etiquetas con SKU/QR
            </p>
          </div>

          <button
            onClick={abrirModalCrear}
            style={btnPrimary}
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Barra de Búsqueda & Filtros de Estado */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          {/* Input Buscador */}
          <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
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

          {/* Chips de Estado Rápido */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto' }}>
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'publicados', label: 'Publicados' },
                { id: 'bajo_stock', label: 'Bajo Stock' },
                { id: 'ocultos', label: 'Archivados' },
              ] as const
            ).map((opt) => {
              const active = filtroEstado === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFiltroEstado(opt.id)}
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
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Slider horizontal de categorías */}
        {categorias.length > 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', paddingTop: 12 }}>
            {categorias.map((cat) => {
              const active = categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: active ? 'var(--surface-elevated, var(--border))' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text-muted)',
                    border: active ? '1px solid var(--text)' : '1px solid transparent',
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat === 'todos' ? 'Todas las Categorías' : cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 3. CONTENIDO: PRODUCTOS (MÓVIL CARDS + DESKTOP TABLA) ─── */}
      {loading ? (
        <div style={{ ...sectionCard, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
            <div className="w-8 h-8 border-3 border-[var(--primario)]/20 border-t-[var(--primario)] rounded-full animate-spin" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Cargando catálogo de productos...</span>
          </div>
        </div>
      ) : filtrados.length === 0 ? (
        <div style={{ ...sectionCard, padding: 48, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Package size={44} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
            No se encontraron productos
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, maxWidth: 360 }}>
            Prueba ajustando los filtros de búsqueda o pulsa "Nuevo Producto" para añadir artículos al catálogo.
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════
              VISTA MÓVIL (Celular: Opción A - Tarjetas Táctiles LogiFast)
              ═══════════════════════════════════════════════ */}
          <div className="block md:hidden space-y-3">
            {filtrados.map((p) => {
              const bajoStock = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);

              return (
                <div
                  key={p.id}
                  style={{
                    ...sectionCard,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    {/* Thumbnail */}
                    <div style={{
                      width: 72, height: 72, borderRadius: 14,
                      background: 'var(--bg-alt)',
                      border: '1px solid var(--border)',
                      overflow: 'hidden', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {p.portadaUrl || p.imagenUrl ? (
                        <img
                          src={p.portadaUrl || p.imagenUrl || ''}
                          alt={p.nombre}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Package size={24} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      )}
                    </div>

                    {/* Metadata */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primario)' }}>
                          {p.categoriaNombre || 'General'}
                        </span>
                        <span
                          style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: p.disponible ? 'rgba(52, 199, 89, 0.12)' : 'rgba(142, 142, 160, 0.12)',
                            color: p.disponible ? '#34C759' : 'var(--text-muted)',
                          }}
                        >
                          {p.disponible ? 'Publicado' : 'Archivado'}
                        </span>
                        {bajoStock && (
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                            background: 'rgba(255, 59, 48, 0.12)', color: '#FF3B30',
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                          }}>
                            <AlertTriangle size={10} /> Bajo Stock
                          </span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', margin: '4px 0 2px 0', lineHeight: 1.3 }}>
                        {p.nombre}
                      </h3>

                      {p.codigoBarras && (
                        <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                          SKU: {p.codigoBarras}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Precios & Stock Destacados */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
                    padding: '10px 14px', borderRadius: 12, background: 'var(--bg-alt)',
                    border: '1px solid var(--border)',
                  }}>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Precio Venta</span>
                      <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primario)', fontFamily: "'JetBrains Mono', monospace" }}>
                        C$ {p.precio.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', fontWeight: 600 }}>Stock Disponible</span>
                      <span style={{
                        fontSize: 15, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace",
                        color: bajoStock ? '#FF3B30' : 'var(--text)',
                      }}>
                        {p.stock ?? 0} {p.unidadMedida || 'und'}
                      </span>
                    </div>
                  </div>

                  {/* Confirmación antes de archivar */}
                  {archivarConfirmId === p.id && (
                    <div style={{
                      padding: 12, borderRadius: 12, background: 'rgba(255, 59, 48, 0.08)',
                      border: '1px solid rgba(255, 59, 48, 0.25)', display: 'flex', flexDirection: 'column', gap: 8,
                    }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                        ¿Archivar "{p.nombre}"? Dejará de mostrarse a los clientes.
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => toggleDisponible(p)}
                          style={{ ...btnPrimary, background: '#FF3B30', padding: '8px 12px', fontSize: 12, flex: 1 }}
                        >
                          Sí, archivar
                        </button>
                        <button
                          onClick={() => setArchivarConfirmId(null)}
                          style={{ ...btnSecondary, padding: '8px 12px', fontSize: 12, flex: 1 }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Botones de Acción */}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => (p.disponible ? setArchivarConfirmId(p.id) : toggleDisponible(p))}
                      style={{ ...btnSecondary, flex: 1 }}
                    >
                      {p.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{p.disponible ? 'Archivar' : 'Publicar'}</span>
                    </button>

                    <button
                      onClick={() => abrirGeneradorEtiquetas(p)}
                      style={{ ...btnSecondary, flex: 1 }}
                    >
                      <Printer size={14} />
                      <span>Etiquetas</span>
                    </button>

                    <button
                      onClick={() => abrirModalEditar(p)}
                      style={{ ...btnPrimary, flex: 1 }}
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>
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
                  <th style={{ padding: '12px 16px', width: 60, textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Foto</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Producto & SKU</th>
                  <th style={{ padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Categoría</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Precio Venta</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Costo</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Stock</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Estado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p) => {
                  const bajoStock = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);

                  return (
                    <tr
                      key={p.id}
                      style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--primario-soft, rgba(0, 122, 255, 0.04))')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Foto */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: 'var(--bg-alt)', border: '1px solid var(--border)',
                          overflow: 'hidden', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {p.portadaUrl || p.imagenUrl ? (
                            <img
                              src={p.portadaUrl || p.imagenUrl || ''}
                              alt={p.nombre}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Package size={18} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                          )}
                        </div>
                      </td>

                      {/* Nombre & SKU */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text)', display: 'block' }}>{p.nombre}</span>
                        {p.codigoBarras && (
                          <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                            SKU: {p.codigoBarras}
                          </span>
                        )}
                      </td>

                      {/* Categoría */}
                      <td style={{ padding: '10px 16px', color: 'var(--text-muted)', fontWeight: 500 }}>
                        {p.categoriaNombre || 'General'}
                      </td>

                      {/* Precio */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: 'var(--primario)' }}>
                        C$ {p.precio.toFixed(2)}
                      </td>

                      {/* Costo */}
                      <td style={{ padding: '10px 16px', textAlign: 'right', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-muted)' }}>
                        {p.costo ? `C$ ${p.costo.toFixed(2)}` : '-'}
                      </td>

                      {/* Stock */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
                          color: bajoStock ? '#FF3B30' : 'var(--text)',
                        }}>
                          {p.stock ?? 0} {p.unidadMedida || 'und'}
                        </span>
                      </td>

                      {/* Estado */}
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                          background: p.disponible ? 'rgba(52, 199, 89, 0.12)' : 'rgba(142, 142, 160, 0.12)',
                          color: p.disponible ? '#34C759' : 'var(--text-muted)',
                        }}>
                          {p.disponible ? 'Publicado' : 'Archivado'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button
                            onClick={() => abrirGeneradorEtiquetas(p)}
                            title="Imprimir Etiquetas / Código"
                            style={{ ...btnSecondary, padding: '6px 10px', fontSize: 12 }}
                          >
                            <Printer size={13} />
                          </button>
                          <button
                            onClick={() => toggleDisponible(p)}
                            title={p.disponible ? 'Archivar' : 'Publicar'}
                            style={{ ...btnSecondary, padding: '6px 10px', fontSize: 12 }}
                          >
                            {p.disponible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => abrirModalEditar(p)}
                            title="Editar"
                            style={{ ...btnPrimary, padding: '6px 12px', fontSize: 12 }}
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ─── MODAL CREAR / EDITAR PRODUCTO (ESTILO LOGIFAST 2.0) ─── */}
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
              width: '100%', maxWidth: 580, maxHeight: '90vh',
              overflowY: 'auto', padding: 24, borderRadius: 24,
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne', sans-serif", color: 'var(--text)', margin: 0 }}>
                  {editingProd ? 'Editar Producto en Catálogo' : 'Crear Nuevo Producto'}
                </h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                  {editingProd ? 'Actualiza los datos comerciales y stock' : 'Completa los detalles para agregarlo al inventario'}
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

            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Nombre */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Refresco Coca-Cola 355ml"
                  style={inputStyle}
                  required
                />
              </div>

              {/* Categoría & SKU */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoriaNombre}
                    onChange={(e) => setCategoriaNombre(e.target.value)}
                    placeholder="Ej: Bebidas, Snacks, Lácteos"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      Código de Barras / SKU
                    </label>
                    <button
                      type="button"
                      onClick={generarCodigoSku}
                      style={{ fontSize: 11, color: 'var(--primario)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      + Generar SKU
                    </button>
                  </div>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    placeholder="744..."
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Precios & Stock */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Precio Venta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="C$ 0.00"
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Costo Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    placeholder="C$ 0.00"
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    placeholder="5"
                    style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  />
                </div>
              </div>

              {/* Imagen del Producto */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
                  Foto del Producto
                </label>
                <ImageUploader
                  categoria="tienda_productos"
                  onUploaded={(url) => setImagenUrl(url)}
                  label="Subir Imagen del Producto"
                  aspectRatio="square"
                  previewUrl={imagenUrl || null}
                  className="w-full h-32 rounded-xl"
                />
              </div>

              {/* Botón Guardar */}
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
                  {submitting ? 'Guardando...' : (editingProd ? 'Guardar Cambios' : 'Crear Producto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Generador de Etiquetas */}
      {etiquetasModalOpen && etiquetasProd && (
        <TiendaEtiquetasModal
          producto={etiquetasProd}
          isDark={isDark}
          onClose={() => setEtiquetasModalOpen(false)}
        />
      )}
    </div>
  );
}

export default TiendaInventario;
