'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  MapPin,
  Store,
  Image as ImageIcon,
  Phone,
  Clock,
  DollarSign,
  Truck,
  Sparkles,
} from '@/components/icons';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';
import { TiendaCupones } from './TiendaCupones';
import { TiendaComercial } from './TiendaComercial';

interface DaySchedule {
  abre: string;
  cierra: string;
  cerrado?: boolean;
}

const DIAS = [
  { key: 'lun', label: 'Lunes' },
  { key: 'mar', label: 'Martes' },
  { key: 'mie', label: 'Miércoles' },
  { key: 'jue', label: 'Jueves' },
  { key: 'vie', label: 'Viernes' },
  { key: 'sab', label: 'Sábado' },
  { key: 'dom', label: 'Domingo' },
];

export function TiendaConfiguracion({ isDark }: { isDark: boolean }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('tienda');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState<number | string>(12.1365);
  const [lng, setLng] = useState<number | string>(-86.2514);
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [estado, setEstado] = useState('activo');
  const [costoEnvio, setCostoEnvio] = useState('20');
  const [pedidoMinimo, setPedidoMinimo] = useState('50');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  // Horario estructurado
  const [horarioSemanal, setHorarioSemanal] = useState<Record<string, DaySchedule>>({
    lun: { abre: '08:00', cierra: '20:00', cerrado: false },
    mar: { abre: '08:00', cierra: '20:00', cerrado: false },
    mie: { abre: '08:00', cierra: '20:00', cerrado: false },
    jue: { abre: '08:00', cierra: '20:00', cerrado: false },
    vie: { abre: '08:00', cierra: '21:00', cerrado: false },
    sab: { abre: '08:00', cierra: '21:00', cerrado: false },
    dom: { abre: '09:00', cierra: '19:00', cerrado: false },
  });

  const cargarPerfil = useCallback(async () => {
    try {
      const res = await fetch('/api/tienda/perfil');
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok && data.tienda) {
        const t = data.tienda;
        setNombre(t.nombre || '');
        setDescripcion(t.descripcion || '');
        setCategoria(t.categoria || 'tienda');
        setDireccion(t.direccion || '');
        setLat(t.lat ?? 12.1365);
        setLng(t.lng ?? -86.2514);
        setTelefono(t.telefono || '');
        setWhatsapp(t.whatsapp || '');
        setImagenUrl(t.imagenUrl || '');
        setBannerUrl(t.bannerUrl || '');
        setEstado(t.estado || 'activo');
        setCostoEnvio(String(t.costoEnvio ?? 20));
        setPedidoMinimo(String(t.pedidoMinimo ?? 50));

        if (t.horario) {
          try {
            const parsed = typeof t.horario === 'string' ? JSON.parse(t.horario) : t.horario;
            if (typeof parsed === 'object' && parsed !== null) {
              setHorarioSemanal((prev) => ({ ...prev, ...parsed }));
            }
          } catch {}
        }
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

  const detectarGPS = () => {
    if (!navigator.geolocation) {
      notify.error('Geolocalización no soportada en este navegador');
      return;
    }
    notify.info('Obteniendo coordenadas GPS de alta precisión...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        notify.success('Ubicación GPS capturada con éxito');
      },
      (err) => {
        console.error(err);
        notify.error('No se pudo obtener la ubicación GPS');
      },
      { enableHighAccuracy: true }
    );
  };

  const updateDaySchedule = (dayKey: string, field: 'abre' | 'cierra' | 'cerrado', value: any) => {
    setHorarioSemanal((prev) => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        [field]: value,
      },
    }));
  };

  const guardarConfiguracion = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const res = await fetch('/api/tienda/perfil', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre,
          descripcion,
          categoria,
          direccion,
          lat: Number(lat),
          lng: Number(lng),
          telefono,
          whatsapp,
          horario: JSON.stringify(horarioSemanal),
          imagenUrl,
          bannerUrl,
          estado,
          costoEnvio: Number(costoEnvio),
          pedidoMinimo: Number(pedidoMinimo),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('Perfil y horarios de tienda actualizados correctamente');
      } else {
        notify.error(data.error || 'Error al actualizar tienda');
      }
    } catch (err) {
      notify.error('Error de conexión con el servidor');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ─── Tarjeta Principal de Configuración ─── */}
      <div className="p-5 sm:p-7 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm space-y-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Settings size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Ajustes Generales</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[var(--text)] font-syne">
            Configuración del Local Comercial & Horarios
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Personaliza el nombre, fachada, banner, tarifas de envío y horarios semanales en LogiFast
          </p>
        </div>

        <form onSubmit={guardarConfiguracion} className="space-y-5">
          {/* Banner & Logo Uploaders */}
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
            <div className="p-3.5 rounded-2xl bg-[var(--bg-alt)]/50 border border-[var(--border)]">
              <label className="text-xs font-bold text-[var(--text)] block mb-2">
                Foto de Portada / Banner del Local
              </label>
              <ImageUploader
                categoria="tienda_banners"
                onUploaded={(url) => setBannerUrl(url)}
                label="Subir Banner de Portada"
                aspectRatio="wide"
                previewUrl={bannerUrl || null}
                className="w-full h-36 rounded-xl"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-[var(--bg-alt)]/50 border border-[var(--border)]">
              <label className="text-xs font-bold text-[var(--text)] block mb-2">
                Logotipo del Comercio
              </label>
              <ImageUploader
                categoria="tienda_logos"
                onUploaded={(url) => setImagenUrl(url)}
                label="Subir Logotipo"
                aspectRatio="square"
                rounded="md"
                previewUrl={imagenUrl || null}
                className="w-full h-36 rounded-xl"
              />
            </div>
          </div>

          {/* Nombre & Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Nombre Comercial *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Sabor Nica Restaurant"
                className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Categoría de Comercio
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all cursor-pointer font-medium"
              >
                <option value="comida">Comida rápida / Restaurante</option>
                <option value="tienda">Tienda / Abarrotes</option>
                <option value="farmacia">Farmacia</option>
                <option value="regalos">Regalos / Flores</option>
                <option value="supermercado">Supermercado</option>
                <option value="tecnologia">Tecnología</option>
                <option value="deportes">Deportes</option>
              </select>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="text-xs font-bold text-[var(--text)] block mb-1">
              Dirección Física Exacta *
            </label>
            <input
              type="text"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Ej: De la Rotonda El Guegüense 2c abajo, Managua"
              className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
              required
            />
          </div>

          {/* Tarifas de Envío, Pedido Mínimo y Contacto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Costo de Envío Base (C$)
              </label>
              <input
                type="number"
                value={costoEnvio}
                onChange={(e) => setCostoEnvio(e.target.value)}
                placeholder="20"
                className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Pedido Mínimo (C$)
              </label>
              <input
                type="number"
                value={pedidoMinimo}
                onChange={(e) => setPedidoMinimo(e.target.value)}
                placeholder="50"
                className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--text)] block mb-1">
                Teléfono / WhatsApp
              </label>
              <input
                type="text"
                value={telefono || whatsapp}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  setWhatsapp(e.target.value);
                }}
                placeholder="8888-8888"
                className="w-full h-11 min-h-[44px] px-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
              />
            </div>
          </div>

          {/* Horarios Semanales */}
          <div className="p-4 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                Horarios de Atención Semanal
              </h3>
            </div>

            <div className="space-y-2">
              {DIAS.map(({ key, label }) => {
                const item = horarioSemanal[key] || { abre: '08:00', cierra: '20:00', cerrado: false };
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-bold text-[var(--text)] w-24 shrink-0">
                      {label}
                    </span>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[11px] text-slate-500 shrink-0">Abre:</span>
                        <input
                          type="time"
                          value={item.abre}
                          disabled={item.cerrado}
                          onChange={(e) => updateDaySchedule(key, 'abre', e.target.value)}
                          className="w-full h-9 min-h-[36px] px-2 rounded-lg bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] text-xs disabled:opacity-50"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[11px] text-slate-500 shrink-0">Cierra:</span>
                        <input
                          type="time"
                          value={item.cierra}
                          disabled={item.cerrado}
                          onChange={(e) => updateDaySchedule(key, 'cierra', e.target.value)}
                          className="w-full h-9 min-h-[36px] px-2 rounded-lg bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] text-xs disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-muted)] shrink-0">
                      <input
                        type="checkbox"
                        checked={!!item.cerrado}
                        onChange={(e) => updateDaySchedule(key, 'cerrado', e.target.checked)}
                        className="w-4 h-4 rounded text-primary focus:ring-primary"
                      />
                      <span>Cerrado</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coordenadas GPS */}
          <div className="p-4 rounded-2xl bg-[var(--bg-alt)] border border-[var(--border)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                  Ubicación GPS en Mapa *
                </h3>
              </div>

              <button
                type="button"
                onClick={detectarGPS}
                className="h-9 min-h-[36px] px-3.5 rounded-xl bg-primary text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm self-start sm:self-auto"
              >
                <MapPin size={13} />
                <span>Capturar mi GPS Actual</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Latitud (GPS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="12.1365"
                  className="w-full h-10 min-h-[40px] px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Longitud (GPS)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="-86.2514"
                  className="w-full h-10 min-h-[40px] px-3 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all"
                  required
                />
              </div>
            </div>
          </div>

          {/* Descripción Corta */}
          <div>
            <label className="text-xs font-bold text-[var(--text)] block mb-1">
              Descripción Comercial del Local
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Describe los productos y especialidades de tu negocio para los clientes en Marketplace..."
              rows={3}
              className="w-full p-3.5 rounded-xl text-sm bg-[var(--bg-alt)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primario)]/20 focus:border-[var(--primario)] transition-all resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={guardando}
            className="w-full h-12 min-h-[48px] rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-sm tracking-wide shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {guardando ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando Ajustes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Configuración de Tienda</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Cupones propios de la tienda */}
      <TiendaCupones />

      {/* Equipo con roles, alianzas y publicidad contratada */}
      <TiendaComercial />
    </div>
  );
}
