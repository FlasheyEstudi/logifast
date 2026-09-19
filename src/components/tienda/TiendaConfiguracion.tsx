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

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    <div className="w-full space-y-3.5">
      {/* ─── Encabezado del módulo ─── */}
      <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
              <Settings size={22} />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Ajustes Generales</div>
              <h2 className="text-base font-semibold text-[var(--text)] font-syne mt-0.5">
                Configuración del Local Comercial & Horarios
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
                Personaliza el nombre, fachada, banner, tarifas de envío y horarios semanales en LogiFast
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={guardarConfiguracion} className="space-y-3.5">
        {/* ─── Datos ─── */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
                <Store size={17} />
              </span>
              <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">Datos</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Nombre Comercial *
                </label>
                <Input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Sabor Nica Restaurant"
                  className="h-11 rounded-[var(--lf-input-radius)] bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Categoría de Comercio
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full h-11 px-3 rounded-[var(--lf-input-radius)] border border-[var(--border)] bg-[var(--bg-alt)] text-[var(--text)] text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primario)] cursor-pointer font-medium"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Dirección Física Exacta *
                </label>
                <Input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: De la Rotonda El Guegüense 2c abajo, Managua"
                  className="h-11 rounded-[var(--lf-input-radius)] bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Teléfono / WhatsApp
                </label>
                <Input
                  type="text"
                  value={telefono || whatsapp}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setWhatsapp(e.target.value);
                  }}
                  placeholder="8888-8888"
                  className="h-11 rounded-[var(--lf-input-radius)] font-mono bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                Descripción Comercial del Local
              </label>
              <Textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Describe los productos y especialidades de tu negocio para los clientes en Marketplace..."
                rows={3}
                className="text-sm bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] resize-none rounded-[var(--lf-input-radius)] p-3"
              />
            </div>

            <div className="border-t border-[var(--border)] pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] m-0 flex items-center gap-1.5">
                  <MapPin size={14} /> Ubicación GPS en Mapa *
                </h4>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectarGPS}
                  className="h-11 sm:h-10 rounded-full px-4 text-sm font-bold gap-1.5 self-start sm:self-auto"
                >
                  <MapPin size={13} />
                  <span>Capturar mi GPS Actual</span>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                    Latitud (GPS)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="12.1365"
                    className="h-11 rounded-[var(--lf-input-radius)] text-sm font-mono bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                    Longitud (GPS)
                  </label>
                  <Input
                    type="number"
                    step="any"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="-86.2514"
                    className="h-11 rounded-[var(--lf-input-radius)] text-sm font-mono bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                    required
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Horarios ─── */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
                <Clock size={17} />
              </span>
              <div>
                <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">Horarios</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5 m-0 font-medium">
                  Horarios de Atención Semanal
                </p>
              </div>
            </div>

            <div className="rounded-[var(--lf-card-radius)] border border-[var(--border)] overflow-hidden">
              {DIAS.map(({ key, label }) => {
                const item = horarioSemanal[key] || { abre: '08:00', cierra: '20:00', cerrado: false };
                return (
                  <div
                    key={key}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 border-b border-[var(--border)] last:border-b-0 transition-colors hover:bg-[var(--bg-alt)]"
                  >
                    <span className="text-sm font-semibold text-[var(--text)] sm:w-24 shrink-0">
                      {label}
                    </span>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">Abre:</span>
                        <Input
                          type="time"
                          value={item.abre}
                          disabled={item.cerrado}
                          onChange={(e) => updateDaySchedule(key, 'abre', e.target.value)}
                          className="h-11 sm:h-10 rounded-[var(--lf-input-radius)] text-sm bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
                        />
                      </div>

                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] shrink-0">Cierra:</span>
                        <Input
                          type="time"
                          value={item.cierra}
                          disabled={item.cerrado}
                          onChange={(e) => updateDaySchedule(key, 'cierra', e.target.value)}
                          className="h-11 sm:h-10 rounded-[var(--lf-input-radius)] text-sm bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--text-muted)] shrink-0">
                      <input
                        type="checkbox"
                        checked={!!item.cerrado}
                        onChange={(e) => updateDaySchedule(key, 'cerrado', e.target.checked)}
                        className="w-4 h-4 rounded accent-[var(--primario)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primario)]"
                      />
                      <span>Cerrado</span>
                    </label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ─── Envío ─── */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
                <Truck size={17} />
              </span>
              <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">Envío</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Costo de Envío Base (C$)
                </label>
                <Input
                  type="number"
                  value={costoEnvio}
                  onChange={(e) => setCostoEnvio(e.target.value)}
                  placeholder="20"
                  className="h-11 rounded-[var(--lf-input-radius)] font-mono text-lg font-bold bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Pedido Mínimo (C$)
                </label>
                <Input
                  type="number"
                  value={pedidoMinimo}
                  onChange={(e) => setPedidoMinimo(e.target.value)}
                  placeholder="50"
                  className="h-11 rounded-[var(--lf-input-radius)] font-mono text-lg font-bold bg-[var(--bg-alt)] border-[var(--border)] text-[var(--text)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Marca ─── */}
        <Card className="rounded-[var(--lf-card-radius)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--lf-shadow-card)]">
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-[var(--lf-card-radius)] bg-[var(--primario)]/10 text-[var(--primario)] flex items-center justify-center shrink-0">
                <ImageIcon size={17} />
              </span>
              <h3 className="text-base font-semibold font-syne text-[var(--text)] m-0">Marca</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Foto de Portada / Banner del Local
                </label>
                <ImageUploader
                  categoria="tienda_banners"
                  onUploaded={(url) => setBannerUrl(url)}
                  label="Subir Banner de Portada"
                  aspectRatio="wide"
                  previewUrl={bannerUrl || null}
                  className="w-full h-36 rounded-[var(--lf-card-radius)]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1.5">
                  Logotipo del Comercio
                </label>
                <ImageUploader
                  categoria="tienda_logos"
                  onUploaded={(url) => setImagenUrl(url)}
                  label="Subir Logotipo"
                  aspectRatio="square"
                  rounded="md"
                  previewUrl={imagenUrl || null}
                  className="w-full h-36 rounded-[var(--lf-card-radius)]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Acción primaria ─── */}
        <div className="flex justify-end pt-1">
          <Button
            type="submit"
            disabled={guardando}
            className="w-full sm:w-auto h-12 rounded-full px-6 text-sm font-bold gap-2 shadow-[var(--lf-shadow-float)] transition-transform active:scale-[0.99]"
          >
            {guardando ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Guardando Ajustes...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Configuración de Tienda</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Cupones propios de la tienda */}
      <TiendaCupones />

      {/* Equipo con roles, alianzas y publicidad contratada */}
      <TiendaComercial />
    </div>
  );
}
