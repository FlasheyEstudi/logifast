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
    <div className="space-y-5">
      {/* ─── KPI Dashboard Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
            <Package size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Productos</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Eye size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Publicados</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.publicados}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Alerta Stock</p>
            <p className="text-lg sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
              {stats.bajoStock}
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Valor Inventario</p>
            <p className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono truncate">
              C$ {stats.valorInventario.toLocaleString('es-NI', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Header & Controls ─── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-syne">
              Gestión de Inventario & Catálogo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control de productos, costos, código de barras e impresión de etiquetas con SKU/QR
            </p>
          </div>

          <button
            onClick={abrirModalCrear}
            className="h-11 min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Search Bar */}
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o SKU..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-slate-900 dark:text-white text-xs sm:text-sm placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="w-6 h-6 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 flex items-center justify-center shrink-0"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick status selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
            {(
              [
                { id: 'todos', label: 'Todos' },
                { id: 'publicados', label: 'Publicados' },
                { id: 'bajo_stock', label: 'Bajo Stock' },
                { id: 'ocultos', label: 'Archivados' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                onClick={() => setFiltroEstado(opt.id)}
                className={`h-9 min-h-[36px] px-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                  filtroEstado === opt.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category horizontal pill scroll */}
        {categorias.length > 2 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categorias.map((cat) => {
              const active = categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => setCategoriaSeleccionada(cat)}
                  className={`h-8 min-h-[32px] px-3 rounded-lg font-bold uppercase tracking-wider text-[10px] whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                    active
                      ? 'bg-primary text-white shadow-sm shadow-primary/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'todos' ? 'Todas las Categorías' : cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Grid of Products ─── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : filtrados.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-3xl p-6">
          <Package size={44} className="mx-auto mb-3 opacity-30 text-slate-500" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-syne">
            No se encontraron productos
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Prueba ajustando los filtros de búsqueda o haz clic en "Nuevo Producto" para añadir artículos al inventario.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtrados.map((p) => {
            const bajoStock =
              p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);

            return (
              <div
                key={p.id}
                className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Image Cover Preview */}
                <div className="relative h-40 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {p.portadaUrl || p.imagenUrl ? (
                    <img
                      src={p.portadaUrl || p.imagenUrl || ''}
                      alt={p.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                      <ImageIcon size={32} className="opacity-40" />
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        p.disponible
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {p.disponible ? 'Publicado' : 'Archivado'}
                    </span>

                    {bajoStock && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500 text-white flex items-center gap-1 shadow-sm">
                        <AlertTriangle size={10} /> Bajo Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-primary tracking-wider">
                      {p.categoriaNombre || 'General'}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5 line-clamp-2 leading-snug">
                      {p.nombre}
                    </h3>
                    {p.codigoBarras && (
                      <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        SKU: {p.codigoBarras}
                      </p>
                    )}
                  </div>

                  {/* Price & Stock info pills */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        Precio Venta
                      </span>
                      <span className="text-sm font-extrabold text-primary font-mono">
                        C$ {p.precio.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        Stock Actual
                      </span>
                      <span
                        className={`text-sm font-extrabold font-mono ${
                          bajoStock ? 'text-red-500' : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {p.stock ?? 0} {p.unidadMedida || 'und'}
                      </span>
                    </div>
                  </div>

                  {/* Confirmación antes de archivar */}
                  {archivarConfirmId === p.id && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs space-y-2 animate-scale-up">
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                        ¿Archivar "{p.nombre}"? Dejará de mostrarse en catálogo, conservando su historial.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleDisponible(p)}
                          className="flex-1 h-8 min-h-[32px] rounded-lg bg-red-500 text-white font-bold text-[11px] active:scale-95"
                        >
                          Sí, archivar
                        </button>
                        <button
                          onClick={() => setArchivarConfirmId(null)}
                          className="flex-1 h-8 min-h-[32px] rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] active:scale-95"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons (3 columnas táctiles con targets de 44px) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => (p.disponible ? setArchivarConfirmId(p.id) : toggleDisponible(p))}
                      title={p.disponible ? 'Archivar del catálogo' : 'Publicar en catálogo'}
                      className="h-11 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                    >
                      {p.disponible ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span className="truncate">{p.disponible ? 'Archivar' : 'Publicar'}</span>
                    </button>

                    <button
                      onClick={() => abrirGeneradorEtiquetas(p)}
                      title="Generar e imprimir etiquetas con código de barras o QR"
                      className="h-11 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
                    >
                      <Tag size={14} />
                      <span>Etiquetas</span>
                    </button>

                    <button
                      onClick={() => abrirModalEditar(p)}
                      className="h-11 min-h-[44px] rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
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

      {/* ─── Modal Crear / Editar Producto ─── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl max-h-[90vh] overflow-y-auto animate-scale-up"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-syne">
                  {editingProd ? 'Editar Producto en Inventario' : 'Crear Nuevo Producto'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProd ? 'Actualiza los datos del producto' : 'Completa los detalles comerciales y stock'}
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 flex items-center justify-center active:scale-95 transition-all"
                aria-label="Cerrar modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarProducto} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Refresco Coca-Cola 355ml"
                  className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
              </div>

              {/* Categoría & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    value={categoriaNombre}
                    onChange={(e) => setCategoriaNombre(e.target.value)}
                    placeholder="Ej: Bebidas, Snacks, Lácteos"
                    className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Código de Barras / SKU
                    </label>
                    <button
                      type="button"
                      onClick={generarCodigoSku}
                      className="text-[11px] text-primary font-bold hover:underline flex items-center gap-1 active:scale-95"
                    >
                      <Sparkles size={12} />
                      <span>Generar SKU</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      placeholder="Ej: 7501055301072 o SKU..."
                      className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    {editingProd && (
                      <button
                        type="button"
                        onClick={() => {
                          abrirGeneradorEtiquetas({
                            ...editingProd,
                            codigoBarras: codigoBarras || editingProd.codigoBarras,
                          });
                        }}
                        title="Imprimir etiquetas con código de barras o QR"
                        className="h-11 min-h-[44px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-bold whitespace-nowrap flex items-center gap-1.5 active:scale-95"
                      >
                        <Printer size={15} />
                        <span className="hidden sm:inline">Etiquetas</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Precios y Costos */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Precio Venta *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    placeholder="C$ 0.00"
                    className="w-full h-11 min-h-[44px] px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Costo Compra
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={costo}
                    onChange={(e) => setCosto(e.target.value)}
                    placeholder="C$ 0.00"
                    className="w-full h-11 min-h-[44px] px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="10"
                    className="w-full h-11 min-h-[44px] px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={stockMinimo}
                    onChange={(e) => setStockMinimo(e.target.value)}
                    placeholder="5"
                    className="w-full h-11 min-h-[44px] px-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Unidad de Medida */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={unidadMedida}
                  onChange={(e) => setUnidadMedida(e.target.value)}
                  className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="unidad">Unidad (und)</option>
                  <option value="libra">Libra (lb)</option>
                  <option value="kilo">Kilogramo (kg)</option>
                  <option value="litro">Litro (lt)</option>
                  <option value="paquete">Paquete (paq)</option>
                  <option value="caja">Caja</option>
                  <option value="porcion">Porción</option>
                </select>
              </div>

              {/* Imágenes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Foto Principal del Producto
                  </label>
                  <ImageUploader
                    categoria="productos"
                    onUploaded={(url) => setImagenUrl(url)}
                    label="Foto Principal"
                    previewUrl={imagenUrl || null}
                    className="w-24 h-24 rounded-2xl mx-auto"
                  />
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Foto de Portada / Banner
                  </label>
                  <ImageUploader
                    categoria="productos"
                    onUploaded={(url) => setPortadaUrl(url)}
                    label="Portada Producto"
                    previewUrl={portadaUrl || null}
                    className="w-24 h-24 rounded-2xl mx-auto"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción Comercial (opcional)
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles, especificaciones o notas de venta..."
                  rows={2}
                  className="w-full p-3 rounded-xl text-sm bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                />
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="h-11 min-h-[44px] px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 min-h-[44px] px-6 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>{editingProd ? 'Guardar Cambios' : 'Crear Producto'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal de Etiquetas & Códigos (Barras / QR) ─── */}
      <TiendaEtiquetasModal
        abierto={etiquetasModalOpen}
        onCerrar={() => setEtiquetasModalOpen(false)}
        producto={etiquetasProd}
      />
    </div>
  );
}
