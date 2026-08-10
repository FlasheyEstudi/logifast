'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Search, Edit2, CheckCircle2, AlertTriangle, Eye, EyeOff, Image as ImageIcon } from '@/components/icons';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';

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

export function TiendaInventario({ isDark }: { isDark: boolean }) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<Producto | null>(null);

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
          stockMinimo: Number(stockMinimo) || 5,
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
          p.disponible ? 'Producto pausado en el Marketplace' : 'Producto publicado en el Marketplace'
        );
        cargarProductos();
      }
    } catch (e) {
      notify.error('Error de conexión');
    }
  };

  const filtrados = productos.filter((p) =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.codigoBarras && p.codigoBarras.includes(busqueda))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header & Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: 'var(--surface)',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--border)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
            Gestión de Inventario & Catálogo
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Control de productos, costos, código de barras e imágenes publicadas en Marketplace.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-alt)',
              padding: '8px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              width: 240,
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Buscar producto o SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text)',
                fontSize: 13,
                width: '100%',
              }}
            />
          </div>

          <button
            onClick={abrirModalCrear}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '0 16px',
              height: 40,
              borderRadius: 10,
              background: '#0066FF',
              color: 'white',
              border: 'none',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
            }}
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Grid of Inventory Products */}
      {filtrados.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <Package size={40} style={{ opacity: 0.4, marginBottom: 12 }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
            No se encontraron productos en el inventario
          </div>
          <div style={{ fontSize: 13, marginTop: 4 }}>
            Haz clic en "Nuevo Producto" para añadir elementos a tu catálogo comercial.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtrados.map((p) => {
            const bajoStock = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--surface)',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                {/* Image Cover Preview */}
                <div style={{ position: 'relative', height: 140, background: 'var(--bg-alt)' }}>
                  {p.portadaUrl || p.imagenUrl ? (
                    <img
                      src={p.portadaUrl || p.imagenUrl || ''}
                      alt={p.nombre}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <ImageIcon size={32} />
                    </div>
                  )}

                  {/* Badges */}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: p.disponible ? '#34C759' : '#8E8E93',
                        color: 'white',
                      }}
                    >
                      {p.disponible ? 'Publicado' : 'Agotado/Oculto'}
                    </span>

                    {bajoStock && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: '#FF3B30',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <AlertTriangle size={10} /> Bajo Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#0066FF', textTransform: 'uppercase' }}>
                      {p.categoriaNombre || 'General'}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                      {p.nombre}
                    </div>
                    {p.codigoBarras && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        SKU: {p.codigoBarras}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      background: 'var(--bg-alt)',
                      padding: 8,
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  >
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Precio Venta</div>
                      <div style={{ fontWeight: 800, color: 'var(--text)' }}>C$ {p.precio.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>Costo / Stock</div>
                      <div style={{ fontWeight: 700, color: bajoStock ? '#FF3B30' : 'var(--text)' }}>
                        C$ {(p.costo || 0).toFixed(2)} | {p.stock ?? 0} {p.unidadMedida || 'und'}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 6 }}>
                    <button
                      onClick={() => toggleDisponible(p)}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 8,
                        border: '1px solid var(--border)',
                        background: 'var(--bg-alt)',
                        color: 'var(--text)',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      {p.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{p.disponible ? 'Pausar' : 'Publicar'}</span>
                    </button>

                    <button
                      onClick={() => abrirModalEditar(p)}
                      style={{
                        flex: 1,
                        height: 34,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(0,102,255,0.1)',
                        color: '#0066FF',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <Edit2 size={14} />
                      <span>Editar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Producto */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface)',
              width: '100%',
              maxWidth: 600,
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 20,
              padding: 24,
              border: '1px solid var(--border)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 16px 0', color: 'var(--text)' }}>
              {editingProd ? 'Editar Producto del Inventario' : 'Crear Nuevo Producto en Inventario'}
            </h3>

            <form onSubmit={guardarProducto} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Hamburguesa Doble Queso"
                  style={{
                    width: '100%',
                    height: 40,
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    padding: '0 12px',
                    color: 'var(--text)',
                    marginTop: 4,
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Categoría</label>
                  <input
                    type="text"
                    value={categoriaNombre}
                    onChange={(e) => setCategoriaNombre(e.target.value)}
                    placeholder="Ej: Comida, Bebidas, Ropa"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Código de Barras / SKU</label>
                  <input
                    type="text"
                    value={codigoBarras}
                    onChange={(e) => setCodigoBarras(e.target.value)}
                    placeholder="Ej: 7441000123"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Precio Venta (C$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="150.00"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Costo (C$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    placeholder="90.00"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Stock Actual</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="25"
                    style={{
                      width: '100%',
                      height: 40,
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-alt)',
                      padding: '0 12px',
                      color: 'var(--text)',
                      marginTop: 4,
                    }}
                  />
                </div>
              </div>

              {/* Subida de Imagen Principal e Imagen de Portada */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
                    Foto Principal del Producto
                  </label>
                  <ImageUploader
                    categoria="productos"
                    onUploaded={(url) => setImagenUrl(url)}
                    label="Foto Principal"
                    previewUrl={imagenUrl || null}
                    className="w-20 h-20"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 4 }}>
                    Foto de Portada / Banner
                  </label>
                  <ImageUploader
                    categoria="productos"
                    onUploaded={(url) => setPortadaUrl(url)}
                    label="Portada Producto"
                    previewUrl={portadaUrl || null}
                    className="w-20 h-20"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles, ingredientes, especificaciones..."
                  rows={2}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    padding: 10,
                    color: 'var(--text)',
                    marginTop: 4,
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    height: 40,
                    padding: '0 16px',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    background: 'var(--bg-alt)',
                    color: 'var(--text)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    height: 40,
                    padding: '0 20px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#0066FF',
                    color: 'white',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Guardando...' : editingProd ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
