'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { onRealtimeEvent } from '@/services/realtime';
import { buscarUbicacionDinamica } from '@/lib/osrm';

export interface TiendaPunto {
  id: string;
  tipo: 'tienda';
  nombre: string;
  descripcion?: string | null;
  categoria: string;
  lat: number;
  lng: number;
  direccion: string;
  telefono?: string | null;
  logoColor: string;
  imagenUrl?: string | null;
  calificacion: number;
  verificado?: boolean;
  popular?: boolean;
  estado?: string;
}

export interface ClientePunto {
  id: string;
  tipo: 'cliente_direccion';
  etiqueta: string;
  nombreCliente: string;
  telefono: string;
  direccion: string;
  referencia?: string | null;
  lat: number;
  lng: number;
}

export interface RepartidorPunto {
  id: string;
  tipo: 'repartidor';
  nombre: string;
  vehiculoTipo: string;
  vehiculoPlaca?: string;
  telefono?: string;
  lat: number;
  lng: number;
  conectado?: boolean;
  enServicio?: boolean;
  estado?: string;
  calificacion?: number;
  totalEntregas?: number;
  fotoUrl?: string | null;
  initials?: string;
  color: string;
}

export interface MotoPunto {
  id: string;
  tipo: 'moto';
  nombre: string;
  modelo: string;
  placa: string;
  anio?: number;
  estado: string;
  lat: number;
  lng: number;
  km?: number;
  repartidorAsignado?: string | null;
  repartidorTelefono?: string | null;
  fotoUrl?: string | null;
  color: string;
}

export interface MapaSearchResult {
  id: string;
  tipo: 'tienda' | 'repartidor' | 'moto' | 'cliente_direccion' | 'geocoded';
  titulo: string;
  subtitulo: string;
  lat: number;
  lng: number;
  color?: string;
  icono?: string;
  raw?: any;
}

export function useMapaPuntos() {
  const [tiendas, setTiendas] = useState<TiendaPunto[]>([]);
  const [clientePuntos, setClientePuntos] = useState<ClientePunto[]>([]);
  const [repartidoresPuntos, setRepartidoresPuntos] = useState<RepartidorPunto[]>([]);
  const [motos, setMotos] = useState<MotoPunto[]>([]);
  const [ordenesActivas, setOrdenesActivas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPuntos = useCallback(async () => {
    try {
      const res = await fetch('/api/mapa/puntos', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.ok) {
        setTiendas(data.tiendas || []);
        setClientePuntos(data.clientePuntos || []);
        setRepartidoresPuntos(data.repartidoresPuntos || []);
        if (data.motos) setMotos(data.motos);
        if (data.ordenesActivas) setOrdenesActivas(data.ordenesActivas);
      }
    } catch (err) {
      console.error('[USE_MAPA_PUNTOS_ERROR]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuntos();

    // 1. WebSocket updates for driver positions
    const cleanupPos = onRealtimeEvent('repartidor:posicion:update', (payload: any) => {
      if (payload && payload.repartidorId) {
        setRepartidoresPuntos((prev) => {
          const idx = prev.findIndex((r) => r.id === payload.repartidorId);
          if (idx !== -1) {
            const list = [...prev];
            list[idx] = {
              ...list[idx],
              lat: payload.lat ?? list[idx].lat,
              lng: payload.lng ?? list[idx].lng,
            };
            return list;
          }
          return prev;
        });
      }
    });

    // 2. WebSocket updates when stores or orders are created
    const cleanupOrders = onRealtimeEvent('repartidor:orden:nueva', () => {
      fetchPuntos();
    });

    // 3. Fast real-time polling every 4 seconds
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPuntos();
      }
    }, 4000);

    return () => {
      cleanupPos();
      cleanupOrders();
      clearInterval(interval);
    };
  }, [fetchPuntos]);

  // Unified intelligent search function
  const buscarPuntos = useCallback(
    async (query: string): Promise<MapaSearchResult[]> => {
      const q = query.trim().toLowerCase();
      if (!q) return [];

      const results: MapaSearchResult[] = [];

      // 1. Search in Tiendas
      for (const t of tiendas) {
        if (
          t.nombre.toLowerCase().includes(q) ||
          t.categoria.toLowerCase().includes(q) ||
          t.direccion.toLowerCase().includes(q)
        ) {
          results.push({
            id: `tienda-${t.id}`,
            tipo: 'tienda',
            titulo: t.nombre,
            subtitulo: `${t.categoria} • ${t.direccion}`,
            lat: t.lat,
            lng: t.lng,
            color: t.logoColor || '#0066FF',
            raw: t,
          });
        }
      }

      // 2. Search in Repartidores / Motos
      for (const r of repartidoresPuntos) {
        if (
          r.nombre.toLowerCase().includes(q) ||
          (r.vehiculoPlaca && r.vehiculoPlaca.toLowerCase().includes(q)) ||
          r.vehiculoTipo.toLowerCase().includes(q)
        ) {
          results.push({
            id: `rep-${r.id}`,
            tipo: 'repartidor',
            titulo: r.nombre,
            subtitulo: `Repartidor (${r.vehiculoTipo} ${r.vehiculoPlaca || ''}) • ${r.estado === 'in-service' ? 'En viaje' : 'Disponible'}`,
            lat: r.lat,
            lng: r.lng,
            color: '#10B981',
            raw: r,
          });
        }
      }

      // 3. Search in Motos
      for (const m of motos) {
        if (
          m.nombre.toLowerCase().includes(q) ||
          m.placa.toLowerCase().includes(q) ||
          m.modelo.toLowerCase().includes(q)
        ) {
          results.push({
            id: `moto-${m.id}`,
            tipo: 'moto',
            titulo: `${m.nombre} (${m.modelo})`,
            subtitulo: `Placa: ${m.placa} • ${m.repartidorAsignado ? `Asignada a ${m.repartidorAsignado}` : 'Disponible'}`,
            lat: m.lat,
            lng: m.lng,
            color: m.color || '#FF5722',
            raw: m,
          });
        }
      }

      // 4. Search in Cliente Puntos
      for (const cp of clientePuntos) {
        if (
          cp.etiqueta.toLowerCase().includes(q) ||
          cp.nombreCliente.toLowerCase().includes(q) ||
          cp.direccion.toLowerCase().includes(q)
        ) {
          results.push({
            id: `cp-${cp.id}`,
            tipo: 'cliente_direccion',
            titulo: `${cp.etiqueta} (${cp.nombreCliente})`,
            subtitulo: cp.direccion,
            lat: cp.lat,
            lng: cp.lng,
            color: '#8B5CF6',
            raw: cp,
          });
        }
      }

      // 5. Dynamic OpenStreetMap Search if query is an address
      if (results.length < 5 && q.length >= 3) {
        try {
          const osmResults = await buscarUbicacionDinamica(query);
          osmResults.forEach((osm, i) => {
            results.push({
              id: `osm-${i}-${Date.now()}`,
              tipo: 'geocoded',
              titulo: osm.display_name.split(',')[0] || query,
              subtitulo: osm.display_name,
              lat: osm.lat,
              lng: osm.lng,
              color: '#3B82F6',
            });
          });
        } catch {}
      }

      return results;
    },
    [tiendas, repartidoresPuntos, motos, clientePuntos]
  );

  return {
    tiendas,
    clientePuntos,
    repartidoresPuntos,
    motos,
    ordenesActivas,
    loading,
    refetch: fetchPuntos,
    buscarPuntos,
  };
}
