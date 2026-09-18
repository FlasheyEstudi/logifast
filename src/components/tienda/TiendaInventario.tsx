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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

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
    <div className="w-full" style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>
      {/* ─── 1. KPI STAT CARDS (ESTILO LOGIFAST 2.0 ADMIN/CLIENTE) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Productos */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-[var(--primario)] shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[var(--primario-soft,rgba(0,122,255,0.1))] text-[var(--primario)] flex items-center justify-center shrink-0">
              <Package size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Total Productos</span>
              <span className="text-xl font-extrabold font-mono text-[var(--text)]">{stats.total}</span>
            </div>
          </CardContent>
        </Card>

        {/* Publicados */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-emerald-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Eye size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Publicados</span>
              <span className="text-xl font-extrabold font-mono text-[var(--text)]">{stats.publicados}</span>
            </div>
          </CardContent>
        </Card>

        {/* Alerta Stock */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-amber-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Alerta Stock</span>
              <span className={`text-xl font-extrabold font-mono ${stats.bajoStock > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text)]'}`}>
                {stats.bajoStock}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Valor Inventario */}
        <Card className="bg-[var(--surface)] border-[var(--border)] border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <TrendingUp size={22} />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-[var(--text-muted)] block">Valor Inventario</span>
              <span className="text-lg font-extrabold font-mono text-[var(--text)]">
                C$ {stats.valorInventario.toLocaleString('es-NI', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ─── 2. TOOLBAR & CONTROLES DE INVENTARIO ─── */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-3.5">
            <div>
              <h2 className="text-lg font-bold font-syne text-[var(--text)]">
                Gestión de Inventario & Catálogo
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Control de artículos, existencias, código de barras e impresión de etiquetas con SKU/QR
              </p>
            </div>

            <Button onClick={abrirModalCrear} className="h-10 text-sm font-semibold">
              <Plus size={16} className="mr-1.5" />
              <span>Nuevo Producto</span>
            </Button>
          </div>

          {/* Barra de Búsqueda & Filtros de Estado */}
          <div className="flex gap-2.5 flex-wrap items-center pt-3.5 border-t border-[var(--border)]">
            {/* Input Buscador */}
            <div className="relative flex-1 min-w-[240px] flex items-center">
              <Search size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar producto por nombre o SKU..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-9 pr-9 h-10 text-xs bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 w-5 h-5 rounded-full hover:bg-[var(--surface)] text-slate-400 hover:text-slate-600 flex items-center justify-center"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Chips de Estado Rápido */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
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
                  <Button
                    key={opt.id}
                    variant={active ? 'default' : 'secondary'}
                    size="sm"
                    onClick={() => setFiltroEstado(opt.id)}
                    className="h-8 rounded-full text-xs font-semibold px-3"
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Slider horizontal de categorías */}
          {categorias.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar">
              {categorias.map((cat) => {
                const active = categoriaSeleccionada.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setCategoriaSeleccionada(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[var(--surface-elevated,var(--border))] text-[var(--text)] border border-[var(--text)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text)] border border-transparent'
                    }`}
                  >
                    {cat === 'todos' ? 'Todas las Categorías' : cat}
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── 3. CONTENIDO: PRODUCTOS (MÓVIL CARDS + DESKTOP TABLA) ─── */}
      {loading ? (
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm h-[260px] flex items-center justify-center">
          <CardContent className="flex flex-col items-center gap-2.5 text-[var(--text-muted)] p-6">
            <div className="w-8 h-8 border-3 border-[var(--primario)]/20 border-t-[var(--primario)] rounded-full animate-spin" />
            <span className="text-xs font-semibold">Cargando catálogo de productos...</span>
          </CardContent>
        </Card>
      ) : filtrados.length === 0 ? (
        <Card className="bg-[var(--surface)] border-[var(--border)] shadow-sm p-12 text-center">
          <CardContent className="flex flex-col items-center gap-2.5">
            <Package size={44} className="text-[var(--text-muted)] opacity-40" />
            <h3 className="text-base font-bold font-syne text-[var(--text)]">
              No se encontraron productos
            </h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm">
              Prueba ajustando los filtros de búsqueda o pulsa "Nuevo Producto" para añadir artículos al catálogo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════
              VISTA MÓVIL (Celular: Opción A - Tarjetas Táctiles LogiFast)
              ═══════════════════════════════════════════════ */}
          <div className="block md:hidden space-y-3">
            {filtrados.map((p) => {
              const bajoStock = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);

              return (
                <Card key={p.id} className="bg-[var(--surface)] border-[var(--border)] shadow-sm">
                  <CardContent className="p-3.5 space-y-3">
                    <div className="flex gap-3 items-start">
                      {/* Thumbnail */}
                      <div className="w-[72px] h-[72px] rounded-xl bg-[var(--bg-alt)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                        {p.portadaUrl || p.imagenUrl ? (
                          <img
                            src={p.portadaUrl || p.imagenUrl || ''}
                            alt={p.nombre}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package size={24} className="text-[var(--text-muted)] opacity-50" />
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--primario)]">
                            {p.categoriaNombre || 'General'}
                          </span>
                          <Badge
                            variant={p.disponible ? 'secondary' : 'outline'}
                            className={`text-[10px] py-0 px-2 font-bold ${
                              p.disponible
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                                : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {p.disponible ? 'Publicado' : 'Archivado'}
                          </Badge>
                          {bajoStock && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] py-0 px-2 font-bold bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                            >
                              <AlertTriangle size={10} className="mr-1" /> Bajo Stock
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-[var(--text)] mt-1 mb-0.5 line-clamp-1 leading-snug">
                          {p.nombre}
                        </h3>

                        {p.codigoBarras && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            SKU: {p.codigoBarras}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Precios & Stock Destacados */}
                    <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-[var(--bg-alt)] border border-[var(--border)]">
                      <div>
                        <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Precio Venta</span>
                        <span className="text-sm font-extrabold text-[var(--primario)] font-mono">
                          C$ {p.precio.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Stock Disponible</span>
                        <span className={`text-sm font-extrabold font-mono ${bajoStock ? 'text-red-500' : 'text-[var(--text)]'}`}>
                          {p.stock ?? 0} {p.unidadMedida || 'und'}
                        </span>
                      </div>
                    </div>

                    {/* Confirmación antes de archivar */}
                    {archivarConfirmId === p.id && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/25 space-y-2">
                        <span className="text-xs font-semibold text-[var(--text)] block">
                          ¿Archivar "{p.nombre}"? Dejará de mostrarse a los clientes.
                        </span>
                        <div className="flex gap-2">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => toggleDisponible(p)}
                            className="flex-1 h-8 text-xs font-semibold"
                          >
                            Sí, archivar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setArchivarConfirmId(null)}
                            className="flex-1 h-8 text-xs font-semibold"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="flex gap-2 pt-2 border-t border-[var(--border)]">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => (p.disponible ? setArchivarConfirmId(p.id) : toggleDisponible(p))}
                        className="flex-1 h-8 text-xs font-semibold"
                      >
                        {p.disponible ? <EyeOff size={13} className="mr-1" /> : <Eye size={13} className="mr-1" />}
                        <span>{p.disponible ? 'Archivar' : 'Publicar'}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirGeneradorEtiquetas(p)}
                        className="flex-1 h-8 text-xs font-semibold"
                      >
                        <Printer size={13} className="mr-1" />
                        <span>Etiquetas</span>
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => abrirModalEditar(p)}
                        className="flex-1 h-8 text-xs font-semibold"
                      >
                        <Edit2 size={13} className="mr-1" />
                        <span>Editar</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════
              VISTA ESCRITORIO / TABLET (Opción B - Back-Office Tabla Densa)
              ═══════════════════════════════════════════════ */}
          <Card className="hidden md:block bg-[var(--surface)] border-[var(--border)] shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-[var(--bg-alt)] hover:bg-[var(--bg-alt)]">
                  <TableHead className="w-[60px] text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Foto</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Producto & SKU</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Categoría</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Precio Venta</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Costo</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Stock</TableHead>
                  <TableHead className="text-center text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Estado</TableHead>
                  <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map((p) => {
                  const bajoStock = p.stock !== null && p.stock !== undefined && p.stock <= (p.stockMinimo ?? 5);

                  return (
                    <TableRow key={p.id}>
                      {/* Foto */}
                      <TableCell className="text-center">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-alt)] border border-[var(--border)] overflow-hidden mx-auto flex items-center justify-center">
                          {p.portadaUrl || p.imagenUrl ? (
                            <img
                              src={p.portadaUrl || p.imagenUrl || ''}
                              alt={p.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package size={18} className="text-[var(--text-muted)] opacity-50" />
                          )}
                        </div>
                      </TableCell>

                      {/* Nombre & SKU */}
                      <TableCell>
                        <span className="font-bold text-[var(--text)] block">{p.nombre}</span>
                        {p.codigoBarras && (
                          <span className="text-[11px] font-mono text-[var(--text-muted)]">
                            SKU: {p.codigoBarras}
                          </span>
                        )}
                      </TableCell>

                      {/* Categoría */}
                      <TableCell className="text-[var(--text-muted)] font-medium">
                        {p.categoriaNombre || 'General'}
                      </TableCell>

                      {/* Precio */}
                      <TableCell className="text-right font-extrabold font-mono text-[var(--primario)]">
                        C$ {p.precio.toFixed(2)}
                      </TableCell>

                      {/* Costo */}
                      <TableCell className="text-right font-mono text-[var(--text-muted)]">
                        {p.costo ? `C$ ${p.costo.toFixed(2)}` : '-'}
                      </TableCell>

                      {/* Stock */}
                      <TableCell className="text-center">
                        <span className={`font-mono font-bold ${bajoStock ? 'text-red-500' : 'text-[var(--text)]'}`}>
                          {p.stock ?? 0} {p.unidadMedida || 'und'}
                        </span>
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="text-center">
                        <Badge
                          variant={p.disponible ? 'secondary' : 'outline'}
                          className={`text-[11px] font-bold px-2.5 py-0.5 ${
                            p.disponible
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'text-[var(--text-muted)]'
                          }`}
                        >
                          {p.disponible ? 'Publicado' : 'Archivado'}
                        </Badge>
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => abrirGeneradorEtiquetas(p)}
                            title="Imprimir Etiquetas / Código"
                          >
                            <Printer size={13} />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleDisponible(p)}
                            title={p.disponible ? 'Archivar' : 'Publicar'}
                          >
                            {p.disponible ? <EyeOff size={13} /> : <Eye size={13} />}
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 gap-1.5 text-xs font-semibold"
                            onClick={() => abrirModalEditar(p)}
                            title="Editar"
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* ─── MODAL CREAR / EDITAR PRODUCTO (ESTILO LOGIFAST 2.0) ─── */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[580px] max-h-[90vh] overflow-y-auto bg-[var(--surface)] border-[var(--border)] shadow-2xl rounded-3xl"
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] mb-5">
                <div>
                  <h3 className="text-lg font-bold font-syne text-[var(--text)] m-0">
                    {editingProd ? 'Editar Producto en Catálogo' : 'Crear Nuevo Producto'}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 mb-0">
                    {editingProd ? 'Actualiza los datos comerciales y stock' : 'Completa los detalles para agregarlo al inventario'}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-9 h-9 rounded-lg border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text-muted)] flex items-center justify-center hover:bg-[var(--surface-elevated)] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={guardarProducto} className="flex flex-col gap-4">
                {/* Nombre */}
                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                    Nombre del Producto *
                  </label>
                  <Input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Refresco Coca-Cola 355ml"
                    required
                  />
                </div>

                {/* Categoría & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Categoría
                    </label>
                    <Input
                      type="text"
                      value={categoriaNombre}
                      onChange={(e) => setCategoriaNombre(e.target.value)}
                      placeholder="Ej: Bebidas, Snacks, Lácteos"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-[var(--text)]">
                        Código de Barras / SKU
                      </label>
                      <button
                        type="button"
                        onClick={generarCodigoSku}
                        className="text-[11px] text-[var(--primario)] font-bold bg-transparent border-none cursor-pointer hover:underline"
                      >
                        + Generar SKU
                      </button>
                    </div>
                    <Input
                      type="text"
                      value={codigoBarras}
                      onChange={(e) => setCodigoBarras(e.target.value)}
                      placeholder="744..."
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Precios & Stock */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Precio Venta *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={precio}
                      onChange={(e) => setPrecio(e.target.value)}
                      placeholder="C$ 0.00"
                      className="font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Costo Compra
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={costo}
                      onChange={(e) => setCosto(e.target.value)}
                      placeholder="C$ 0.00"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Stock Actual
                    </label>
                    <Input
                      type="number"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="10"
                      className="font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
                      Stock Mínimo
                    </label>
                    <Input
                      type="number"
                      min={0}
                      value={stockMinimo}
                      onChange={(e) => setStockMinimo(e.target.value)}
                      placeholder="5"
                      className="font-mono"
                    />
                  </div>
                </div>

                {/* Imagen del Producto */}
                <div>
                  <label className="text-xs font-bold text-[var(--text)] block mb-1.5">
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
                <div className="flex gap-2.5 pt-3 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 h-10 font-semibold"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] h-10 font-semibold"
                  >
                    {submitting ? 'Guardando...' : (editingProd ? 'Guardar Cambios' : 'Crear Producto')}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
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
