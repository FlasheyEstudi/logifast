'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';
import { LogoSpinner, MiniSpinner } from '@/components/ui/loaders';

interface Producto {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoriaNombre: string | null;
  precio: number;
  precioOriginal: number | null;
  imagenColor: string;
  imagenUrl: string | null;
  disponible: boolean;
  esPopular: boolean;
  esNuevo: boolean;
  stock: number | null;
}

interface Pedido {
  id: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteInitials: string;
  clienteColor: string;
  estado: string;
  direccionEntrega: string;
  metodoPago: string;
  total: number;
  items: { nombreProducto: string; cantidad: number; precioUnitario: number }[];
  fecha: string;
  hora: string;
}

interface TiendaData {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  logoColor: string;
  logoIniciales: string;
  portadaColor: string;
  imagenUrl: string | null;
  direccion: string;
  telefono: string | null;
  email: string | null;
  costoEnvio: number;
  pedidoMinimo: number;
  tiempoEstimado: string;
  horario: Record<string, unknown>;
  zonaCobertura: string[];
  estado: string;
  calificacion: number;
  totalPedidos: number;
  productos: Producto[];
  stats: {
    totalProductos: number;
    ordenesActivas: number;
    totalPedidos: number;
    ingresos: number;
  };
}

const CATEGORIAS: { value: string; label: string; icon: string }[] = [
  { value: 'comida', label: 'Comida rápida', icon: '' },
  { value: 'tienda', label: 'Tienda', icon: '' },
  { value: 'farmacia', label: 'Farmacia', icon: '' },
  { value: 'regalos', label: 'Regalos / Flores', icon: '' },
  { value: 'supermercado', label: 'Supermercado', icon: '' },
  { value: 'tecnologia', label: 'Tecnología', icon: '' },
  { value: 'deportes', label: 'Deportes', icon: '' },
];

export default function ClientMiTienda() {
  const [tienda, setTienda] = useState<TiendaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState<'overview' | 'productos' | 'pedidos' | 'config'>('overview');
  const [showCrearForm, setShowCrearForm] = useState(false);
  const [showProductoForm, setShowProductoForm] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);

  const cargarTienda = useCallback(async () => {
    try {
      const res = await fetch('/api/cliente/tienda');
      if (!res.ok) return;
      const data = await res.json();
      const t = data.tienda;
      if (t) {
        // Garantizar que stats siempre exista aunque el API no lo devuelva
        if (!t.stats) {
          t.stats = {
            totalProductos: (t.productos ?? []).length,
            ordenesActivas: 0,
            totalPedidos: t.totalPedidos ?? 0,
            ingresos: 0,
          };
        }
      }
      setTienda(t);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarPedidos = useCallback(async () => {
    try {
      const res = await fetch('/api/cliente/tienda/pedidos');
      if (!res.ok) return;
      const data = await res.json();
      setPedidos(data.pedidos ?? []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    cargarTienda();
    cargarPedidos();
  }, [cargarTienda, cargarPedidos]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <LogoSpinner size={64} />
      </div>
    );
  }

  // Si no tiene tienda → pantalla de crear
  if (!tienda) {
    return (
      <CrearTiendaForm
        onCreated={() => {
          setShowCrearForm(false);
          cargarTienda();
        }}
      />
    );
  }

  return (
    <div className="lf-mi-tienda">
      {/* Header */}
      <div className="lf-mt-header">
        <div className="lf-mt-header-info">
          <div
            className="lf-mt-logo"
            style={{
              background: tienda.imagenUrl
                ? `url(${tienda.imagenUrl}) center/cover`
                : `linear-gradient(135deg, ${tienda.logoColor}, ${tienda.portadaColor})`,
            }}
          >
            {!tienda.imagenUrl && <span>{tienda.logoIniciales}</span>}
          </div>
          <div>
            <h1 className="lf-mt-title">{tienda.nombre}</h1>
            <p className="lf-mt-subtitle">
              {CATEGORIAS.find((c) => c.value === tienda.categoria)?.icon}{' '}
              {CATEGORIAS.find((c) => c.value === tienda.categoria)?.label} ·{' '}
              <span style={{ color: tienda.estado === 'activo' ? 'var(--exito)' : 'var(--warning)' }}>
                {tienda.estado === 'activo' ? 'Activa' : 'Pausada'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="lf-mt-kpis">
        <div className="lf-mt-kpi">
          <div className="lf-mt-kpi-icon" style={{ background: 'rgba(255,87,34,0.12)', color: '#FF5722' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7h-9M14 17H5M20 7l-3-3M20 7l-3 3M4 17l3-3M4 17l3 3" /></svg>
          </div>
          <div>
            <div className="lf-mt-kpi-value">{tienda.stats.totalProductos}</div>
            <div className="lf-mt-kpi-label">Productos</div>
          </div>
        </div>
        <div className="lf-mt-kpi">
          <div className="lf-mt-kpi-icon" style={{ background: 'rgba(255,152,0,0.12)', color: '#FF9800' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <div>
            <div className="lf-mt-kpi-value">{tienda.stats.ordenesActivas}</div>
            <div className="lf-mt-kpi-label">Pedidos activos</div>
          </div>
        </div>
        <div className="lf-mt-kpi">
          <div className="lf-mt-kpi-icon" style={{ background: 'rgba(76,175,80,0.12)', color: 'var(--exito)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <div>
            <div className="lf-mt-kpi-value">C$ {tienda.stats.ingresos.toLocaleString()}</div>
            <div className="lf-mt-kpi-label">Ingresos</div>
          </div>
        </div>
        <div className="lf-mt-kpi">
          <div className="lf-mt-kpi-icon" style={{ background: 'rgba(255,193,7,0.12)', color: 'var(--warning)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 18.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
          </div>
          <div>
            <div className="lf-mt-kpi-value">{tienda.calificacion.toFixed(1)}</div>
            <div className="lf-mt-kpi-label">Calificación</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="lf-mt-tabs">
        {[
          { value: 'overview', label: 'Resumen', icon: '' },
          { value: 'productos', label: 'Productos', icon: '' },
          { value: 'pedidos', label: 'Pedidos', icon: '' },
          { value: 'config', label: 'Configuración', icon: '' },
        ].map((tab) => (
          <button
            key={tab.value}
            className={`lf-mt-tab ${vista === tab.value ? 'active' : ''}`}
            onClick={() => setVista(tab.value as typeof vista)}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="lf-mt-content">
        {vista === 'overview' && (
          <OverviewTab tienda={tienda} pedidos={pedidos} onVerPedidos={() => setVista('pedidos')} />
        )}
        {vista === 'productos' && (
          <ProductosTab
            productos={tienda.productos}
            onAdd={() => { setEditingProducto(null); setShowProductoForm(true); }}
            onEdit={(p) => { setEditingProducto(p); setShowProductoForm(true); }}
            onDelete={async (id) => {
              if (!confirm('¿Eliminar este producto?')) return;
              const res = await fetch(`/api/cliente/tienda/productos?id=${id}`, { method: 'DELETE' });
              if (res.ok) {
                notify.success('Producto eliminado');
                cargarTienda();
              } else {
                notify.error('Error al eliminar');
              }
            }}
          />
        )}
        {vista === 'pedidos' && <PedidosTab pedidos={pedidos} onActualizar={cargarPedidos} />}
        {vista === 'config' && <ConfigTab tienda={tienda} onUpdated={cargarTienda} />}
      </div>

      {/* Modal crear/editar producto */}
      <AnimatePresence>
        {showProductoForm && (
          <ProductoFormModal
            producto={editingProducto}
            onClose={() => setShowProductoForm(false)}
            onSaved={() => {
              setShowProductoForm(false);
              cargarTienda();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CREAR TIENDA FORM
   ═══════════════════════════════════════════════════════ */
function CrearTiendaForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'comida',
    direccion: '',
    lat: 12.1365,
    lng: -86.2514,
    telefono: '',
    email: '',
    ruc: '',
    whatsapp: '',
    costoEnvio: 25,
    pedidoMinimo: 50,
    tiempoEstimado: '20-35 min',
    logoColor: '#FF5722',
    portadaColor: '#1B1B2F',
    imagenUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [gettingGps, setGettingGps] = useState(false);
  const [gpsCaptured, setGpsCaptured] = useState(false);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      notify.error('La geolocalización no está soportada por tu navegador');
      return;
    }
    setGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        }));
        setGpsCaptured(true);
        setGettingGps(false);
        notify.success(`GPS Capturado: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        setGettingGps(false);
        notify.error('No se pudo obtener la ubicación GPS. Verifica los permisos.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.imagenUrl) {
      notify.error('La fotografía o logo de la tienda es obligatorio');
      return;
    }
    if (!form.nombre.trim()) {
      notify.error('El nombre de la tienda es obligatorio');
      return;
    }
    if (!form.ruc.trim()) {
      notify.error('El número RUC o Cédula del propietario es obligatorio');
      return;
    }
    if (!form.whatsapp.trim()) {
      notify.error('El número de WhatsApp comercial es obligatorio');
      return;
    }
    if (!form.direccion.trim()) {
      notify.error('La dirección física del negocio es obligatoria');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/cliente/tienda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          logoIniciales: form.nombre.slice(0, 2).toUpperCase(),
        }),
      });
      const data = await res.json();
      setLoading(false);
      if (res.ok && data.ok) {
        notify.success('¡Tienda registrada y verificada con éxito!');
        onCreated();
      } else {
        notify.error(data.error || 'Error al registrar la tienda');
      }
    } catch {
      setLoading(false);
      notify.error('Error de conexión con el servidor');
    }
  };

  return (
    <div className="lf-crear-tienda">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="lf-crear-tienda-card"
      >
        <div className="lf-crear-tienda-header">
          <div className="lf-crear-tienda-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 9l2-5h14l2 5M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9M3 9h18M9 13h6" />
            </svg>
          </div>
          <h2>Registra tu Negocio en LOGIFAST</h2>
          <p>Afiliación comercial con verificación de RUC, WhatsApp y Ubicación GPS</p>
        </div>

        <form onSubmit={handleSubmit} className="lf-crear-tienda-form">
          {/* Logo Obligatorio */}
          <div className="lf-crear-tienda-logo-row">
            <ImageUploader
              categoria="tienda"
              onUploaded={(url) => setForm({ ...form, imagenUrl: url })}
              label="Logo o Foto de Fachada * (Obligatorio)"
              aspectRatio="square"
              rounded="full"
              previewUrl={form.imagenUrl || null}
            />
            {!form.imagenUrl && (
              <span style={{ fontSize: 11, color: '#FF453A', fontWeight: 600, display: 'block', textAlign: 'center', marginTop: 4 }}>
                * La imagen comercial es obligatoria
              </span>
            )}
          </div>

          <div className="lf-form-row">
            <label>Nombre Comercial de la Tienda *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Restaurant El Madroño"
              className="lf-form-input"
              required
            />
          </div>

          <div className="lf-form-grid-2">
            <div className="lf-form-row">
              <label>RUC del Negocio o Cédula Propietario *</label>
              <input
                type="text"
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                placeholder="J0310000012345 o 001-120495-0002E"
                className="lf-form-input"
                required
              />
            </div>
            <div className="lf-form-row">
              <label>WhatsApp de Pedidos *</label>
              <input
                type="tel"
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="+505 8888-8888"
                className="lf-form-input"
                required
              />
            </div>
          </div>

          <div className="lf-form-row">
            <label>Descripción del Comercio</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Comida típica nicaragüense, batidos y repostería artesanal..."
              className="lf-form-input"
              rows={3}
            />
          </div>

          <div className="lf-form-row">
            <label>Categoría Comercial *</label>
            <div className="lf-cat-grid">
              {CATEGORIAS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`lf-cat-btn ${form.categoria === c.value ? 'active' : ''}`}
                  onClick={() => setForm({ ...form, categoria: c.value })}
                >
                  <span className="lf-cat-icon">{c.icon}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dirección y Ubicación GPS */}
          <div className="lf-form-row">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ margin: 0 }}>Dirección Física Exacta *</label>
              <button
                type="button"
                onClick={handleGetGps}
                disabled={gettingGps}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: gpsCaptured ? 'rgba(76,175,80,0.15)' : 'rgba(0,102,255,0.12)',
                  border: gpsCaptured ? '1px solid #4CAF50' : '1px solid rgba(0,102,255,0.3)',
                  color: gpsCaptured ? '#4CAF50' : '#0066FF',
                  padding: '4px 12px',
                  borderRadius: 100,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <span>{gettingGps ? 'Capturando GPS...' : gpsCaptured ? 'GPS Confirmado' : 'Capturar GPS con mi celular'}</span>
              </button>
            </div>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="De la Rotonda El Guegüense 2c al sur, Managua"
              className="lf-form-input"
              required
            />
          </div>

          <div className="lf-form-grid-2">
            <div className="lf-form-row">
              <label>Teléfono Convencional/Contacto</label>
              <input
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                placeholder="+505 2270-1111"
                className="lf-form-input"
              />
            </div>
            <div className="lf-form-row">
              <label>Correo del Negocio</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="contacto@minogocio.com"
                className="lf-form-input"
              />
            </div>
          </div>

          <div className="lf-form-grid-3">
            <div className="lf-form-row">
              <label>Costo envío (C$)</label>
              <input
                type="number"
                value={form.costoEnvio}
                onChange={(e) => setForm({ ...form, costoEnvio: Number(e.target.value) })}
                className="lf-form-input"
              />
            </div>
            <div className="lf-form-row">
              <label>Pedido mín (C$)</label>
              <input
                type="number"
                value={form.pedidoMinimo}
                onChange={(e) => setForm({ ...form, pedidoMinimo: Number(e.target.value) })}
                className="lf-form-input"
              />
            </div>
            <div className="lf-form-row">
              <label>Tiempo estimado</label>
              <input
                type="text"
                value={form.tiempoEstimado}
                onChange={(e) => setForm({ ...form, tiempoEstimado: e.target.value })}
                className="lf-form-input"
              />
            </div>
          </div>

          <button type="submit" className="lf-form-submit" disabled={loading}>
            {loading ? <MiniSpinner size={18} color="white" /> : 'Finalizar y Afiliar mi Tienda'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════
   OVERVIEW TAB
   ═══════════════════════════════════════════════════════ */
function OverviewTab({ tienda, pedidos, onVerPedidos }: { tienda: TiendaData; pedidos: Pedido[]; onVerPedidos: () => void }) {
  return (
    <div className="lf-mt-overview">
      <div className="lf-mt-section">
        <h3>Resumen de hoy</h3>
        <div className="lf-mt-overview-grid">
          <div className="lf-mt-overview-card">
            <div className="lf-mt-overview-num">{tienda.stats.ordenesActivas}</div>
            <div className="lf-mt-overview-label">Pedidos activos</div>
          </div>
          <div className="lf-mt-overview-card">
            <div className="lf-mt-overview-num">{tienda.stats.totalPedidos}</div>
            <div className="lf-mt-overview-label">Total pedidos</div>
          </div>
          <div className="lf-mt-overview-card">
            <div className="lf-mt-overview-num">{tienda.calificacion.toFixed(1)} ★</div>
            <div className="lf-mt-overview-label">Calificación</div>
          </div>
        </div>
      </div>

      <div className="lf-mt-section">
        <div className="lf-mt-section-header">
          <h3>Pedidos recientes</h3>
          <button className="lf-mt-link" onClick={onVerPedidos}>Ver todos →</button>
        </div>
        {pedidos.length === 0 ? (
          <div className="lf-mt-empty">
            <p>No tienes pedidos aún. ¡Comparte tu tienda!</p>
          </div>
        ) : (
          <div className="lf-mt-pedidos-list">
            {pedidos.slice(0, 5).map((p) => (
              <div key={p.id} className="lf-mt-pedido-card">
                <div className="lf-mt-pedido-avatar" style={{ background: p.clienteColor }}>
                  {p.clienteInitials}
                </div>
                <div className="lf-mt-pedido-info">
                  <div className="lf-mt-pedido-nombre">{p.clienteNombre}</div>
                  <div className="lf-mt-pedido-items">
                    {p.items.length} item{s(p.items.length)} · C$ {p.total}
                  </div>
                </div>
                <span className={`lf-mt-pedido-estado estado-${p.estado}`}>
                  {p.estado.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="lf-mt-section">
        <h3>Productos destacados</h3>
        <div className="lf-mt-productos-mini">
          {tienda.productos.slice(0, 4).map((p) => (
            <div key={p.id} className="lf-mt-producto-mini">
              <div
                className="lf-mt-producto-img"
                style={{
                  background: p.imagenUrl
                    ? `url(${p.imagenUrl}) center/cover`
                    : p.imagenColor,
                }}
              />
              <div className="lf-mt-producto-info">
                <div className="lf-mt-producto-nombre">{p.nombre}</div>
                <div className="lf-mt-producto-precio">C$ {p.precio}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRODUCTOS TAB
   ═══════════════════════════════════════════════════════ */
function ProductosTab({ productos, onAdd, onEdit, onDelete }: {
  productos: Producto[];
  onAdd: () => void;
  onEdit: (p: Producto) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="lf-mt-productos">
      <div className="lf-mt-section-header">
        <h3>Tus productos ({productos.length})</h3>
        <button className="lf-mt-btn-primary" onClick={onAdd}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo producto
        </button>
      </div>
      {productos.length === 0 ? (
        <div className="lf-mt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
            <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <p>Aún no tienes productos. ¡Agrega el primero!</p>
        </div>
      ) : (
        <div className="lf-mt-productos-grid">
          {productos.map((p) => (
            <div key={p.id} className="lf-mt-producto-card">
              <div
                className="lf-mt-producto-card-img"
                style={{
                  background: p.imagenUrl
                    ? `url(${p.imagenUrl}) center/cover`
                    : p.imagenColor,
                }}
              >
                {p.esPopular && <span className="lf-mt-badge-popular">Popular</span>}
                {p.esNuevo && <span className="lf-mt-badge-nuevo">Nuevo</span>}
                {!p.disponible && <span className="lf-mt-badge-no-disp">No disponible</span>}
              </div>
              <div className="lf-mt-producto-card-body">
                <div className="lf-mt-producto-card-nombre">{p.nombre}</div>
                <div className="lf-mt-producto-card-desc">{p.descripcion || 'Sin descripción'}</div>
                <div className="lf-mt-producto-card-precio">C$ {p.precio}</div>
                <div className="lf-mt-producto-card-actions">
                  <button className="lf-mt-btn-ghost" onClick={() => onEdit(p)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Editar
                  </button>
                  <button className="lf-mt-btn-ghost danger" onClick={() => onDelete(p.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PEDIDOS TAB
   ═══════════════════════════════════════════════════════ */
function PedidosTab({ pedidos, onActualizar }: { pedidos: Pedido[]; onActualizar: () => void }) {
  const [filtro, setFiltro] = useState<string>('todos');

  const filtered = filtro === 'todos' ? pedidos : pedidos.filter((p) => p.estado === filtro);

  const cambiarEstado = async (id: string, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/cliente/tienda/pedidos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });
      if (res.ok) {
        notify.success(`Pedido marcado como "${nuevoEstado}"`);
        onActualizar();
      } else {
        notify.error('Error al actualizar');
      }
    } catch {
      notify.error('Error de conexión');
    }
  };

  return (
    <div className="lf-mt-pedidos">
      <div className="lf-mt-pedidos-filtros">
        {['todos', 'recibido', 'preparando', 'listo', 'en_camino', 'entregado'].map((f) => (
          <button
            key={f}
            className={`lf-modern-chip ${filtro === f ? 'active' : ''}`}
            onClick={() => setFiltro(f)}
          >
            {f === 'todos' ? 'Todos' : f.replace('_', ' ')}
            <span className="lf-chip-count">
              {f === 'todos' ? pedidos.length : pedidos.filter((p) => p.estado === f).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="lf-mt-empty">
          <p>No hay pedidos en este estado.</p>
        </div>
      ) : (
        <div className="lf-mt-pedidos-lista">
          {filtered.map((p) => (
            <div key={p.id} className="lf-mt-pedido-detalle">
              <div className="lf-mt-pedido-header">
                <div className="lf-mt-pedido-avatar" style={{ background: p.clienteColor }}>
                  {p.clienteInitials}
                </div>
                <div className="lf-mt-pedido-info">
                  <div className="lf-mt-pedido-nombre">{p.clienteNombre}</div>
                  <div className="lf-mt-pedido-meta">
                    {p.fecha} · {p.hora} · {p.metodoPago}
                  </div>
                </div>
                <span className={`lf-mt-pedido-estado estado-${p.estado}`}>
                  {p.estado.replace('_', ' ')}
                </span>
              </div>
              <div className="lf-mt-pedido-items-list">
                {p.items.map((it, i) => (
                  <div key={i} className="lf-mt-pedido-item">
                    <span className="lf-mt-pedido-item-cant">{it.cantidad}x</span>
                    <span className="lf-mt-pedido-item-nombre">{it.nombreProducto}</span>
                    <span className="lf-mt-pedido-item-precio">C$ {it.precioUnitario * it.cantidad}</span>
                  </div>
                ))}
              </div>
              <div className="lf-mt-pedido-footer">
                <div className="lf-mt-pedido-total">Total: C$ {p.total}</div>
                <div className="lf-mt-pedido-acciones">
                  {p.estado === 'recibido' && (
                    <button className="lf-mt-btn-primary sm" onClick={() => cambiarEstado(p.id, 'preparando')}>
                      Empezar a preparar
                    </button>
                  )}
                  {p.estado === 'preparando' && (
                    <button className="lf-mt-btn-primary sm" onClick={() => cambiarEstado(p.id, 'listo')}>
                      Marcar como listo
                    </button>
                  )}
                  {p.estado === 'listo' && (
                    <button className="lf-mt-btn-primary sm" onClick={() => cambiarEstado(p.id, 'en_camino')}>
                      En camino
                    </button>
                  )}
                  {p.estado === 'en_camino' && (
                    <button className="lf-mt-btn-primary sm success" onClick={() => cambiarEstado(p.id, 'entregado')}>
                      Entregado
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONFIG TAB
   ═══════════════════════════════════════════════════════ */
function ConfigTab({ tienda, onUpdated }: { tienda: TiendaData; onUpdated: () => void }) {
  const [form, setForm] = useState({
    nombre: tienda.nombre,
    descripcion: tienda.descripcion || '',
    direccion: tienda.direccion,
    telefono: tienda.telefono || '',
    email: tienda.email || '',
    costoEnvio: tienda.costoEnvio,
    pedidoMinimo: tienda.pedidoMinimo,
    tiempoEstimado: tienda.tiempoEstimado,
    logoColor: tienda.logoColor,
    portadaColor: tienda.portadaColor,
    imagenUrl: tienda.imagenUrl || '',
    estado: tienda.estado,
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cliente/tienda', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setLoading(false);
      if (res.ok) {
        notify.success('Tienda actualizada');
        onUpdated();
      } else {
        notify.error('Error al actualizar');
      }
    } catch {
      setLoading(false);
      notify.error('Error de conexión');
    }
  };

  return (
    <div className="lf-mt-config">
      <div className="lf-mt-section-header">
        <h3>Configuración de la tienda</h3>
      </div>

      <div className="lf-mt-config-grid">
        <div className="lf-mt-config-section">
          <h4>Identidad</h4>
          <div className="lf-form-row">
            <label>Logo</label>
            <ImageUploader
              categoria="tienda"
              entidadId={tienda.id}
              onUploaded={(url) => setForm({ ...form, imagenUrl: url })}
              aspectRatio="square"
              rounded="full"
              previewUrl={form.imagenUrl || null}
            />
          </div>
          <div className="lf-form-row">
            <label>Nombre</label>
            <input className="lf-form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="lf-form-row">
            <label>Descripción</label>
            <textarea className="lf-form-input" rows={3} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="lf-form-grid-2">
            <div className="lf-form-row">
              <label>Color logo</label>
              <input type="color" className="lf-form-color" value={form.logoColor} onChange={(e) => setForm({ ...form, logoColor: e.target.value })} />
            </div>
            <div className="lf-form-row">
              <label>Color portada</label>
              <input type="color" className="lf-form-color" value={form.portadaColor} onChange={(e) => setForm({ ...form, portadaColor: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="lf-mt-config-section">
          <h4>Contacto y logística</h4>
          <div className="lf-form-row">
            <label>Dirección</label>
            <input className="lf-form-input" value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
          <div className="lf-form-grid-2">
            <div className="lf-form-row">
              <label>Teléfono</label>
              <input className="lf-form-input" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
            </div>
            <div className="lf-form-row">
              <label>Email</label>
              <input className="lf-form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="lf-form-grid-3">
            <div className="lf-form-row">
              <label>Costo envío</label>
              <input type="number" className="lf-form-input" value={form.costoEnvio} onChange={(e) => setForm({ ...form, costoEnvio: Number(e.target.value) })} />
            </div>
            <div className="lf-form-row">
              <label>Pedido mín</label>
              <input type="number" className="lf-form-input" value={form.pedidoMinimo} onChange={(e) => setForm({ ...form, pedidoMinimo: Number(e.target.value) })} />
            </div>
            <div className="lf-form-row">
              <label>Tiempo est.</label>
              <input className="lf-form-input" value={form.tiempoEstimado} onChange={(e) => setForm({ ...form, tiempoEstimado: e.target.value })} />
            </div>
          </div>
          <div className="lf-form-row">
            <label>Estado</label>
            <select className="lf-form-input" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })}>
              <option value="activo">Activa</option>
              <option value="inactivo">Pausada</option>
            </select>
          </div>
        </div>
      </div>

      <button className="lf-form-submit" onClick={handleSave} disabled={loading}>
        {loading ? <MiniSpinner size={18} color="white" /> : 'Guardar cambios'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PRODUCTO FORM MODAL
   ═══════════════════════════════════════════════════════ */
function ProductoFormModal({ producto, onClose, onSaved }: {
  producto: Producto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    nombre: producto?.nombre || '',
    descripcion: producto?.descripcion || '',
    categoriaNombre: producto?.categoriaNombre || 'General',
    precio: producto?.precio || 0,
    precioOriginal: producto?.precioOriginal || 0,
    imagenColor: producto?.imagenColor || 'var(--border)',
    imagenUrl: producto?.imagenUrl || '',
    disponible: producto?.disponible ?? true,
    esNuevo: producto?.esNuevo ?? false,
    esPopular: producto?.esPopular ?? false,
    stock: producto?.stock ?? null,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre || form.precio === undefined) {
      notify.error('Nombre y precio son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const url = '/api/cliente/tienda/productos';
      const method = producto ? 'PATCH' : 'POST';
      const body = producto ? { id: producto.id, ...form } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setLoading(false);
      if (res.ok) {
        notify.success(producto ? 'Producto actualizado' : 'Producto creado');
        onSaved();
      } else {
        const data = await res.json();
        notify.error(data.error || 'Error');
      }
    } catch {
      setLoading(false);
      notify.error('Error de conexión');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="lf-modal-overlay"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="lf-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="lf-modal-header">
          <h3>{producto ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button className="lf-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="lf-modal-body">
          <div className="lf-form-row">
            <label>Foto del producto</label>
            <ImageUploader
              categoria="producto"
              onUploaded={(url) => setForm({ ...form, imagenUrl: url })}
              aspectRatio="square"
              rounded="md"
              previewUrl={form.imagenUrl || null}
            />
          </div>
          <div className="lf-form-row">
            <label>Nombre *</label>
            <input className="lf-form-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="lf-form-row">
            <label>Descripción</label>
            <textarea className="lf-form-input" rows={2} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
          <div className="lf-form-row">
            <label>Categoría</label>
            <input className="lf-form-input" value={form.categoriaNombre} onChange={(e) => setForm({ ...form, categoriaNombre: e.target.value })} placeholder="Ej: Pizzas, Bebidas..." />
          </div>
          <div className="lf-form-grid-2">
            <div className="lf-form-row">
              <label>Precio (C$) *</label>
              <input type="number" className="lf-form-input" value={form.precio} onChange={(e) => setForm({ ...form, precio: Number(e.target.value) })} required />
            </div>
            <div className="lf-form-row">
              <label>Precio original (C$)</label>
              <input type="number" className="lf-form-input" value={form.precioOriginal} onChange={(e) => setForm({ ...form, precioOriginal: Number(e.target.value) })} placeholder="Para descuento" />
            </div>
          </div>
          <div className="lf-form-row">
            <label>Stock (vacío = ilimitado)</label>
            <input type="number" className="lf-form-input" value={form.stock ?? ''} onChange={(e) => setForm({ ...form, stock: e.target.value ? Number(e.target.value) : null })} />
          </div>
          <div className="lf-form-row">
            <label>Color de fondo (sin foto)</label>
            <input type="color" className="lf-form-color" value={form.imagenColor} onChange={(e) => setForm({ ...form, imagenColor: e.target.value })} />
          </div>
          <div className="lf-form-checkboxes">
            <label>
              <input type="checkbox" checked={form.disponible} onChange={(e) => setForm({ ...form, disponible: e.target.checked })} />
              Disponible
            </label>
            <label>
              <input type="checkbox" checked={form.esNuevo} onChange={(e) => setForm({ ...form, esNuevo: e.target.checked })} />
              Marcar como nuevo
            </label>
            <label>
              <input type="checkbox" checked={form.esPopular} onChange={(e) => setForm({ ...form, esPopular: e.target.checked })} />
              Marcar como popular
            </label>
          </div>
          <div className="lf-modal-actions">
            <button type="button" className="lf-mt-btn-ghost" onClick={onClose}>Cancelar</button>
            <button type="submit" className="lf-form-submit" disabled={loading}>
              {loading ? <MiniSpinner size={18} color="white" /> : (producto ? 'Guardar' : 'Crear producto')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════ */
function s(n: number) {
  return n === 1 ? '' : 's';
}
