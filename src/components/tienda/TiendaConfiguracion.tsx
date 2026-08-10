'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Save, MapPin, Store, Image as ImageIcon, Phone, Clock } from '@/components/icons';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { notify } from '@/lib/notify';

export function TiendaConfiguracion({ isDark }: { isDark: boolean }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoria, setCategoria] = useState('tienda');
  const [direccion, setDireccion] = useState('');
  const [lat, setLat] = useState<number | string>(12.1365);
  const [lng, setLng] = useState<number | string>(-86.2514);
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [horario, setHorario] = useState('8:00 AM - 6:00 PM');
  const [imagenUrl, setImagenUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [estado, setEstado] = useState('activo');
  const [costoEnvio, setCostoEnvio] = useState('20');
  const [pedidoMinimo, setPedidoMinimo] = useState('50');
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

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
        setHorario(t.horario || '8:00 AM - 6:00 PM');
        setImagenUrl(t.imagenUrl || '');
        setBannerUrl(t.bannerUrl || '');
        setEstado(t.estado || 'activo');
        setCostoEnvio(String(t.costoEnvio ?? 20));
        setPedidoMinimo(String(t.pedidoMinimo ?? 50));
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
    notify.info('Obteniendo ubicación GPS...');
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
          horario,
          imagenUrl,
          bannerUrl,
          estado,
          costoEnvio: Number(costoEnvio),
          pedidoMinimo: Number(pedidoMinimo),
        }),
      });

      const data = await res.json();
      if (res.ok && data.ok) {
        notify.success('Perfil de tienda actualizado correctamente');
      } else {
        notify.error(data.error || 'Error al actualizar tienda');
      }
    } catch (err) {
      notify.error('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 20,
        border: '1px solid var(--border)',
        padding: 24,
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
        maxWidth: 900,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: 'var(--text)' }}>
          Configuración del Local Comercial & Fachada
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Personaliza el nombre, logo, imagen de portada, horarios y cobertura en LogiFast.
        </p>
      </div>

      <form onSubmit={guardarConfiguracion} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Banner Cover Image & Logo Uploaders */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              Foto de Portada / Banner del Local
            </label>
            <ImageUploader
              categoria="tienda_banners"
              onUploaded={(url) => setBannerUrl(url)}
              label="Subir Banner de Portada"
              aspectRatio="wide"
              previewUrl={bannerUrl || null}
              className="w-full h-36"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 6 }}>
              Logotipo del Comercio
            </label>
            <ImageUploader
              categoria="tienda_logos"
              onUploaded={(url) => setImagenUrl(url)}
              label="Subir Logo"
              aspectRatio="square"
              rounded="md"
              previewUrl={imagenUrl || null}
              className="w-full h-36"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Nombre Comercial *</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Sabor Nica Restaurant"
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Categoría de Comercio</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
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

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Dirección Física Exacta *</label>
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            placeholder="Ej: De la Rotonda El Guegüense 2c abajo, Managua"
            style={{
              width: '100%',
              height: 40,
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              padding: '0 12px',
              color: 'var(--text)',
              fontSize: 13,
              marginTop: 4,
            }}
            required
          />
        </div>

        {/* Coordenadas GPS para Mapa Inteligente */}
        <div style={{ background: 'var(--bg-alt, #f8f9fa)', padding: 14, borderRadius: 12, border: '1px solid var(--border, #e5e7eb)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#0066FF" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                Ubicación GPS Exacta en Mapa (Geolocalización) *
              </span>
            </div>
            <button
              type="button"
              onClick={detectarGPS}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                background: '#0066FF',
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              Detectar Mi GPS
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Latitud (GPS)</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="12.1365"
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface, #ffffff)',
                  padding: '0 10px',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 2,
                }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Longitud (GPS)</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="-86.2514"
                style={{
                  width: '100%',
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--surface, #ffffff)',
                  padding: '0 10px',
                  color: 'var(--text)',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 2,
                }}
                required
              />
            </div>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '8px 0 0 0' }}>
            Estas coordenadas alimentan el Mapa Inteligente de LogiFast para calcular distancias exactas y asignar repartidores cercanos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="2222-8888"
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>WhatsApp de Pedidos</label>
            <input
              type="text"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="8888-8888"
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Horario de Atención</label>
            <input
              type="text"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
              placeholder="8:00 AM - 9:00 PM"
              style={{
                width: '100%',
                height: 40,
                borderRadius: 10,
                border: '1px solid var(--border)',
                background: 'var(--bg-alt)',
                padding: '0 12px',
                color: 'var(--text)',
                fontSize: 13,
                marginTop: 4,
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>Descripción Corta del Local</label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Describe la especialidad de tu tienda para tus clientes..."
            rows={3}
            style={{
              width: '100%',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
              padding: 10,
              color: 'var(--text)',
              fontSize: 13,
              marginTop: 4,
            }}
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 44,
            borderRadius: 12,
            border: 'none',
            background: '#0066FF',
            color: 'white',
            fontSize: 14,
            fontWeight: 800,
            cursor: 'pointer',
            marginTop: 10,
            boxShadow: '0 4px 14px rgba(0,102,255,0.3)',
          }}
        >
          <Save size={16} />
          <span>{guardando ? 'Guardando Ajustes...' : 'Guardar Configuración de Tienda'}</span>
        </button>
      </form>
    </div>
  );
}
