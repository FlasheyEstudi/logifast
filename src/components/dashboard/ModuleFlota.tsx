'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bike, ChevronDown, ChevronUp, Plus, X, Wrench, MapPin,
} from 'lucide-react';
import { useStore, type Moto, type MotoStatus } from '@/lib/store';

const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });

const MANAGUA_CENTER: [number, number] = [12.1149926, -86.2361742];

const STATUS_CONFIG: Record<MotoStatus, { label: string; color: string; bg: string }> = {
  available: { label: 'Disponible', color: '#16A34A', bg: 'rgba(22,163,74,0.1)' },
  'in-service': { label: 'En servicio', color: '#FF6600', bg: 'rgba(255,102,0,0.1)' },
  maintenance: { label: 'Mantenimiento', color: '#DC2626', bg: 'rgba(220,38,38,0.1)' },
};

function FlotaMap({ motos, isDark }: { motos: Moto[]; isDark: boolean }) {
  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      setL(leaflet);
    });
    // Load leaflet CSS via link tag for reliability in standalone builds
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }
  }, []);

  if (!L) return <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--lf-text-muted)' }}>Cargando mapa...</div>;

  const createIcon = (status: MotoStatus) => {
    const cfg = STATUS_CONFIG[status];
    return L.divIcon({
      className: '',
      html: `<div style="width:24px;height:24px;border-radius:50%;background:${cfg.color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24], iconAnchor: [12, 12],
    });
  };

  return (
    <div className={isDark ? 'lf-dark-map' : ''} style={{ height: '100%', borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer center={MANAGUA_CENTER} zoom={13} style={{ height: '100%' }} zoomControl>
        <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {motos.map((moto) => (
          <Marker key={moto.id} position={[moto.lat, moto.lng]} icon={createIcon(moto.status)}>
            <Popup>
              <div style={{ fontFamily: "'DM Sans',sans-serif" }}>
                <div style={{ fontWeight: 700 }}>{moto.nombre}</div>
                <div style={{ fontSize: 12, color: STATUS_CONFIG[moto.status].color }}>{STATUS_CONFIG[moto.status].label}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

const FlotaMapDynamic = dynamic(() => Promise.resolve(FlotaMap), { ssr: false });

export default function ModuleFlota({ isDark }: { isDark: boolean }) {
  const { motos, riders, flotaFilter, setFlotaFilter, expandedMoto, setExpandedMoto,
    addMotoOpen, setAddMotoOpen, editMoto, setEditMoto, addMoto, updateMoto } = useStore();

  const [formNombre, setFormNombre] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formAnio, setFormAnio] = useState('');
  const [formPlaca, setFormPlaca] = useState('');
  const [formStatus, setFormStatus] = useState<MotoStatus>('available');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string }>>([]);
  let toastId = 0;
  const showToast = (msg: string) => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  };

  const filtered = flotaFilter === 'all' ? motos : motos.filter((m) => m.status === flotaFilter);

  const resetForm = () => { setFormNombre(''); setFormModelo(''); setFormAnio(''); setFormPlaca(''); setFormStatus('available'); setFormErrors({}); };

  const handleSave = () => {
    const errors: Record<string, string> = {};
    if (!formNombre.trim()) errors.nombre = 'Requerido';
    if (!formModelo.trim()) errors.modelo = 'Requerido';
    if (!formAnio || isNaN(Number(formAnio))) errors.anio = 'Año inválido';
    if (!formPlaca.trim()) errors.placa = 'Requerida';
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (editMoto) {
      updateMoto({ ...editMoto, nombre: formNombre, modelo: formModelo, anio: Number(formAnio), placa: formPlaca, status: formStatus });
      showToast(`Moto ${formNombre} actualizada`);
    } else {
      const newMoto: Moto = {
        id: `Moto-${13 + motos.length}`, nombre: formNombre, modelo: formModelo, anio: Number(formAnio),
        placa: formPlaca, status: formStatus, lat: 12.11 + (Math.random() - 0.5) * 0.05,
        lng: -86.24 + (Math.random() - 0.5) * 0.05, km: 0, repartidorAsignado: null,
        ultimoMantenimiento: new Date().toISOString().slice(0, 10), proximoMantenimiento: '2026-12-01',
        costoTotalMantenimiento: 0,
      };
      addMoto(newMoto);
      showToast(`Moto ${formNombre} agregada`);
    }
    setAddMotoOpen(false); setEditMoto(null); resetForm();
  };

  const openEdit = (moto: Moto) => {
    setFormNombre(moto.nombre); setFormModelo(moto.modelo); setFormAnio(String(moto.anio));
    setFormPlaca(moto.placa); setFormStatus(moto.status);
    setEditMoto(moto); setAddMotoOpen(true);
  };

  return (
    <div style={{ height: '100%', display: 'flex', padding: '16px 20px', gap: 16, overflow: 'hidden' }}>
      {/* LEFT: List */}
      <div style={{ flex: '1 1 60%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontWeight: 700, fontSize: 18 }}>Gestión de Flota</h2>
          <button onClick={() => { resetForm(); setAddMotoOpen(true); }} style={{
            padding: '8px 16px', borderRadius: 8, border: 'none', background: 'var(--lf-accent)',
            color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}><Plus size={14} /> Agregar moto</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
          {(['all', 'available', 'in-service', 'maintenance'] as const).map((f) => {
            const label = f === 'all' ? 'Todas' : STATUS_CONFIG[f].label;
            return (
              <button key={f} onClick={() => setFlotaFilter(f)} style={{
                padding: '5px 12px', borderRadius: 999, border: '1px solid var(--lf-border)',
                background: flotaFilter === f ? 'var(--lf-accent)' : 'transparent',
                color: flotaFilter === f ? '#fff' : 'var(--lf-text-muted)',
                fontWeight: 600, fontSize: 12, cursor: 'pointer',
              }}>{label}</button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {filtered.map((moto) => {
            const cfg = STATUS_CONFIG[moto.status];
            const isExpanded = expandedMoto === moto.id;
            const rider = riders.find((r) => r.motoId === moto.id);
            return (
              <div key={moto.id} style={{
                background: 'var(--lf-surface)', border: '1px solid var(--lf-border)', borderRadius: 12,
                marginBottom: 8, overflow: 'hidden',
              }}>
                {/* Main row */}
                <div onClick={() => setExpandedMoto(isExpanded ? null : moto.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer',
                  transition: 'background 0.15s',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{moto.nombre}</span>
                    <span style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{moto.modelo}</span>
                  </div>
                  {rider && <span style={{ fontSize: 12, color: 'var(--lf-text-secondary)' }}>{rider.nombre}</span>}
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--lf-text-muted)' }}>{moto.km.toLocaleString()} km</span>
                  {isExpanded ? <ChevronUp size={16} style={{ color: 'var(--lf-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--lf-text-muted)' }} />}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 14px 14px', borderTop: '1px solid var(--lf-border)', paddingTop: 12 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
                          <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Placa</span><div style={{ fontSize: 13, fontWeight: 600 }}>{moto.placa}</div></div>
                          <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Año</span><div style={{ fontSize: 13 }}>{moto.anio}</div></div>
                          <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Repartidor</span><div style={{ fontSize: 13 }}>{moto.repartidorAsignado || 'Sin asignar'}</div></div>
                          <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Último mant.</span><div style={{ fontSize: 13 }}>{moto.ultimoMantenimiento}</div></div>
                          <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Próximo mant.</span><div style={{ fontSize: 13 }}>{moto.proximoMantenimiento}</div></div>
                          <div><span style={{ fontSize: 11, fontWeight: 600, color: 'var(--lf-text-muted)', textTransform: 'uppercase' }}>Costo total</span><div className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>C${moto.costoTotalMantenimiento.toLocaleString()}</div></div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => openEdit(moto)} style={{
                            padding: '6px 12px', borderRadius: 8, border: '1px solid var(--lf-border)',
                            background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--lf-text-main)',
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}><Wrench size={12} /> Editar</button>
                          {moto.status === 'maintenance' && (
                            <button onClick={() => { updateMoto({ ...moto, status: 'available' }); showToast(`${moto.nombre} disponible`); }} style={{
                              padding: '6px 12px', borderRadius: 8, border: 'none', background: 'var(--lf-success)',
                              color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            }}>Marcar disponible</button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Map */}
      <div className="lf-flota-map-desktop" style={{ flex: '0 0 40%', minWidth: 300, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--lf-border)' }}>
        <FlotaMapDynamic motos={filtered} isDark={isDark} />
      </div>

      {/* ═══ ADD/EDIT MOTO MODAL ═══ */}
      <AnimatePresence>
        {addMotoOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setAddMotoOpen(false); setEditMoto(null); resetForm(); }}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              style={{ background: 'var(--lf-surface)', borderRadius: 16, padding: 24, width: '90%', maxWidth: 440 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontWeight: 700, fontSize: 18 }}>{editMoto ? 'Editar Moto' : 'Agregar Moto'}</h3>
                <button onClick={() => { setAddMotoOpen(false); setEditMoto(null); resetForm(); }} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--lf-border)', background: 'transparent', cursor: 'pointer', color: 'var(--lf-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={14} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Nombre *</label>
                  <input value={formNombre} onChange={(e) => setFormNombre(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.nombre ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Modelo *</label>
                    <input value={formModelo} onChange={(e) => setFormModelo(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.modelo ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Año *</label>
                    <input value={formAnio} onChange={(e) => setFormAnio(e.target.value)} type="number" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.anio ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Placa *</label>
                  <input value={formPlaca} onChange={(e) => setFormPlaca(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${formErrors.placa ? 'var(--lf-danger)' : 'var(--lf-border)'}`, background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--lf-text-muted)', display: 'block', marginBottom: 4 }}>Estado</label>
                  <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as MotoStatus)} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--lf-border)', background: 'var(--lf-bg-base)', color: 'var(--lf-text-main)', fontSize: 13 }}>
                    <option value="available">Disponible</option>
                    <option value="in-service">En servicio</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>
                <button onClick={handleSave} style={{ padding: '12px', borderRadius: 10, border: 'none', background: 'var(--lf-accent)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginTop: 4 }}>
                  {editMoto ? 'Guardar Cambios' : 'Agregar Moto'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 70, right: 20, zIndex: 300, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map((t) => (
          <motion.div key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--lf-success)', color: '#fff', fontSize: 13, fontWeight: 600 }}>{t.msg}</motion.div>
        ))}
      </div>

      <style jsx global>{`
        @media (max-width: 768px) {
          .lf-flota-map-desktop { display: none !important; }
        }
      `}</style>
    </div>
  );
}
